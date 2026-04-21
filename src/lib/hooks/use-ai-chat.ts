import { useState, useCallback, useRef, useEffect } from 'react'
import { createProjectDB } from '../db/project-db'
import { useAIConfig } from './use-ai-config'
import { useWorldEntries } from './use-world-entries'
import { useConsistencyExemptions } from './use-consistency-exemptions'
import {
  extractKeywords,
  findRelevantEntries,
  trimToTokenBudget,
} from './use-context-injection'
import { parseAISuggestions, type Suggestion } from '../ai/suggestion-parser'
import { streamChat, supportsToolUse, type ProviderStreamMessage } from '../ai/client'
import { buildSegmentedSystemPrompt } from '../ai/prompts'
import { summarizeMessages } from '../ai/summarize'
import { recordChatTurn, recordSummarizeUsage } from './use-chat-telemetry'
import type {
  SuggestEntryInput,
  SuggestRelationInput,
  ReportContradictionInput,
} from '../ai/tools/schemas'
import type { AIEvent, AIToolInput } from '../ai/events'
import type { WorldEntryType } from '../types'

export interface ChatMessage {
  id: string
  projectId: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasDraft?: boolean
  draftId?: string
}

/**
 * Partial contradiction returned by handleToolCall — AI-provided fields only.
 * The caller fills in id, projectId, conversationId, messageId, exempted,
 * createdAt before persisting to db.contradictions.
 */
export interface PartialContradiction {
  entryName: string
  entryType: WorldEntryType
  description: string
}

/** A tool call that was interrupted mid-stream by an abort. */
export interface InterruptedToolCall {
  id: string
  name: string
  partialJson: string
  input: AIToolInput
}

export interface UseAIChatOptions {
  /** Callback when draft is generated */
  onDraftGenerated?: (draft: string) => void
  /** Selected text for discussion — per D-08 */
  selectedText?: string
}

/** Draft marker heuristics kept as a fallback when the provider can't emit a structured signal. */
const DRAFT_INDICATORS = ['以下是草稿', '草稿：', '插入到编辑器', '续写如下', '生成内容：']
function detectDraft(content: string): boolean {
  return DRAFT_INDICATORS.some(marker => content.includes(marker))
}

export function useAIChat(projectId: string, conversationId: string | null, options?: UseAIChatOptions) {
  const { config } = useAIConfig()
  const { entriesByType } = useWorldEntries(projectId)
  const { exemptions, addExemption } = useConsistencyExemptions(projectId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [contradictions, setContradictions] = useState<PartialContradiction[]>([])
  const [isCheckingConsistency] = useState(false)
  const [interruptedToolCalls, setInterruptedToolCalls] = useState<InterruptedToolCall[]>([])
  const [cacheHint, setCacheHint] = useState<{ tokens: number } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const entriesByTypeRef = useRef(entriesByType)
  const exemptionsRef = useRef(exemptions)

  useEffect(() => {
    exemptionsRef.current = exemptions
  }, [exemptions])

  useEffect(() => {
    entriesByTypeRef.current = entriesByType
  }, [entriesByType])

  useEffect(() => {
    if (!projectId || !conversationId) {
      setMessages([])
      return
    }
    const db = createProjectDB(projectId)
    db.table('messages')
      .where('conversationId').equals(conversationId)
      .sortBy('timestamp')
      .then(msgs => setMessages(msgs as ChatMessage[]))
      .catch(console.error)
    // Also clear per-conversation ephemeral state.
    setSuggestions([])
    setContradictions([])
  }, [projectId, conversationId])

  const sendMessage = useCallback(async (content: string): Promise<{ success: true } | { success: false; needsConfig: true; message: string }> => {
    if (!conversationId) {
      return { success: false, needsConfig: true, message: '未选择对话' }
    }
    if (!config.apiKey) {
      return { success: false, needsConfig: true, message: '还没设置 API 密钥，去设置一下？' }
    }
    if (config.provider === 'openai-compatible' && !config.baseUrl) {
      return { success: false, needsConfig: true, message: '还没填写接口地址，去设置一下？' }
    }

    // Clear interrupted tool calls from any prior aborted stream.
    setInterruptedToolCalls([])

    // Pure keyword matching replaces hybrid RAG — topK=6, 2000-token budget
    const db = createProjectDB(projectId)
    const relevantEntries = entriesByType
      ? findRelevantEntries(extractKeywords(content), entriesByType).slice(0, 6)
      : []
    const trimmedEntries = trimToTokenBudget(relevantEntries, 2000)

    // Load the conversation for rollingSummary + window boundary.
    const conversation = await db.table('conversations').get(conversationId) as
      | { rollingSummary?: string; summarizedUpTo?: number; messageCount: number }
      | undefined

    const segmentedSystem = buildSegmentedSystemPrompt({
      worldEntries: trimmedEntries,
      selectedText: options?.selectedText,
      rollingSummary: conversation?.rollingSummary,
    })

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      projectId,
      conversationId,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    const assistantMsgId = crypto.randomUUID()

    await db.table('messages').add(userMsg)
    setMessages(prev => [...prev, userMsg])

    setLoading(true)
    setStreamingContent('')
    setMessages(prev => [
      ...prev,
      {
        id: assistantMsgId,
        projectId,
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      },
    ])

    // Sliding window: only last WINDOW_SIZE messages get replayed; older ones
    // are represented by rollingSummary (injected into systemPrompt above).
    // Read from Dexie instead of React state so rapid successive sends don't
    // drop the previous user message from history.
    const WINDOW_SIZE = 10
    const persistedHistory = await db.table('messages')
      .where('conversationId').equals(conversationId)
      .sortBy('timestamp') as ChatMessage[]
    const recentWindow = persistedHistory
      .filter(m => m.id !== assistantMsgId && m.content.length > 0)
      .slice(-WINDOW_SIZE)
    const historicalMessages: ProviderStreamMessage[] = recentWindow.map(m => ({
      role: m.role,
      content: m.content,
    }))
    if (recentWindow[recentWindow.length - 1]?.id !== userMsg.id) {
      historicalMessages.push({ role: 'user', content })
    }

    abortControllerRef.current = new AbortController()
    let fullContent = ''
    const pendingSuggestions: Suggestion[] = []
    const pendingContradictions: PartialContradiction[] = []
    const startedAt = Date.now()
    let inputTokens = 0
    let outputTokens = 0
    let cacheReadTokens = 0
    let cacheWriteTokens = 0

    try {
      const events = streamChat(
        {
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        },
        {
          segmentedSystem,
          messages: historicalMessages,
          signal: abortControllerRef.current.signal,
        }
      )

      for await (const event of events) {
        if (event.type === 'text_delta') {
          fullContent += event.delta
          setStreamingContent(fullContent)
          setMessages(prev =>
            prev.map(m => (m.id === assistantMsgId ? { ...m, content: fullContent } : m))
          )
} else if (event.type === 'tool_call') {
          const pc = handleToolCall(event, pendingSuggestions, exemptionsRef.current)
          if (pc) pendingContradictions.push(pc)
        } else if (event.type === 'tool_call_partial') {
          // Stream was aborted mid-tool. Store partial result so UI can surface it.
          setInterruptedToolCalls(prev => [
            ...prev,
            {
              id: event.id,
              name: event.name,
              partialJson: event.partialJson,
              input: event.input,
            },
          ])
        } else if (event.type === 'usage') {
          // Last usage event wins — providers emit a partial usage mid-stream
          // and a final one at message_stop with complete counts.
          if (event.inputTokens !== undefined) inputTokens = event.inputTokens
          if (event.outputTokens !== undefined) outputTokens = event.outputTokens
          if (event.cacheReadTokens !== undefined) cacheReadTokens = event.cacheReadTokens
          if (event.cacheWriteTokens !== undefined) cacheWriteTokens = event.cacheWriteTokens
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      const hasDraft = detectDraft(fullContent)
      const finalMsg: ChatMessage = {
        id: assistantMsgId,
        projectId,
        conversationId,
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        hasDraft,
        draftId: hasDraft ? crypto.randomUUID() : undefined,
      }
      await db.table('messages').update(assistantMsgId, finalMsg)
      setMessages(prev => prev.map(m => (m.id === assistantMsgId ? finalMsg : m)))
      // Update conversation metadata.
      const nowTs = Date.now()
      const newCount = (conversation?.messageCount ?? persistedHistory.length) + 2
      await db.table('conversations').update(conversationId, {
        updatedAt: nowTs,
        messageCount: newCount,
      })

      // Fallback suggestion parsing for providers that don't support tool use.
      if (!supportsToolUse(config.provider)) {
        setIsAnalyzing(true)
        try {
          const parsed = parseAISuggestions(fullContent, entriesByTypeRef.current)
          setSuggestions(parsed)
        } finally {
          setIsAnalyzing(false)
        }
      } else {
        setSuggestions(pendingSuggestions)
      }

setContradictions(pendingContradictions)

      // Persist contradictions to DB with dedup (CEO-4C: 7d window by entryName+description).
      // Fire-and-forget; never block the chat UI.
      if (pendingContradictions.length > 0) {
        void (async () => {
          const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
          const now = Date.now()
          for (const pc of pendingContradictions) {
            // Check for a recent same-description contradiction for this entry (within 7d).
            const cutoff = now - SEVEN_DAYS
            const recent = await db.contradictions
              .where('[projectId+entryName]')
              .equals([projectId, pc.entryName])
              .and(row => row.createdAt >= cutoff && !row.exempted)
              .toArray()
            const isDupe = recent.some(r => r.description === pc.description)
            if (isDupe) continue
await db.contradictions.add({
              id: crypto.randomUUID(),
              projectId,
              conversationId,
              messageId: assistantMsgId,
              entryName: pc.entryName,
              entryType: pc.entryType,
              description: pc.description,
              exempted: false,
              createdAt: now,
            })
          }
        })()
      }
      // the last summary, rebuild the rollingSummary. Fire-and-forget; never
      // block the chat UI, never throw up to the caller.
      const totalAfter = newCount
      const outsideWindow = Math.max(0, totalAfter - WINDOW_SIZE)
      const summarizedUpTo = conversation?.summarizedUpTo ?? 0
      if (outsideWindow >= 6 && outsideWindow - summarizedUpTo >= 6) {
        void (async () => {
          try {
            const allMsgs = await db.table('messages')
              .where('conversationId').equals(conversationId)
              .sortBy('timestamp')
            const older = (allMsgs as ChatMessage[]).slice(0, outsideWindow)
            const summary = await summarizeMessages(
              { provider: config.provider, apiKey: config.apiKey, baseUrl: config.baseUrl, model: config.model },
              older.map(m => ({ role: m.role, content: m.content }))
            )
            if (summary.summary) {
              await db.table('conversations').update(conversationId, {
                rollingSummary: summary.summary,
                summarizedUpTo: outsideWindow,
              })
            }
            await recordSummarizeUsage({
              db,
              projectId,
              conversationId,
              provider: config.provider,
              model: config.model ?? '',
              inputTokens: summary.inputTokens,
              outputTokens: summary.outputTokens,
              cacheReadTokens: summary.cacheReadTokens,
              cacheWriteTokens: summary.cacheWriteTokens,
              latencyMs: summary.latencyMs,
            })
          } catch (e) {
            console.warn('[useAIChat] summarize failed:', e)
          }
        })()
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // user cancelled — keep partial content
      } else {
        throw err
      }
    } finally {
      setLoading(false)
      setStreamingContent('')
      abortControllerRef.current = null
      // Persist usage regardless of success/abort — even a cancelled stream
      // incurred input tokens, and the prefix output tokens still cost money.
      await recordChatTurn({
        db,
        projectId,
        conversationId,
        assistantMessageId: assistantMsgId,
        provider: config.provider,
        model: config.model ?? '',
        counters: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens },
        latencyMs: Date.now() - startedAt,
      })
      // Surface cache TTL savings hint. UI layer decides whether to show.
      if (cacheReadTokens > 0) {
        setCacheHint({ tokens: cacheReadTokens })
      }
    }
    return { success: true }
  }, [config, projectId, conversationId, entriesByType, options?.selectedText])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const dismissSuggestion = useCallback((suggestion: Suggestion) => {
    setSuggestions(prev => prev.filter(s => {
      if (s.type === 'relationship' && suggestion.type === 'relationship') {
        return s.entry1Name !== suggestion.entry1Name || s.entry2Name !== suggestion.entry2Name
      }
      if (s.type === 'newEntry' && suggestion.type === 'newEntry') {
        return s.suggestedName !== suggestion.suggestedName
      }
      return true
    }))
  }, [])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  const clearInterruptedToolCalls = useCallback(() => {
    setInterruptedToolCalls([])
  }, [])

  return {
    messages,
    loading,
    streamingContent,
    sendMessage,
    cancelStream,
    suggestions,
    isAnalyzing,
    dismissSuggestion,
    clearSuggestions,
    contradictions,
    isCheckingConsistency,
    addExemption,
    clearContradiction: (index: number) =>
      setContradictions(prev => prev.filter((_, i) => i !== index)),
    interruptedToolCalls,
    clearInterruptedToolCalls,
    cacheHint,
  }
}

/**
 * Convert an AI tool_call event into the shape the UI suggestion/contradiction
 * cards already know how to render.
 */
function handleToolCall(
  event: Extract<AIEvent, { type: 'tool_call' }>,
  suggestions: Suggestion[],
  exemptions: Array<{ exemptionKey: string }> | undefined
): PartialContradiction | null {
  if (event.name === 'suggest_entry') {
    const input = event.input as Partial<SuggestEntryInput>
    if (!input.entryType || !input.name) return null
    suggestions.push({
      type: 'newEntry',
      entryType: input.entryType,
      suggestedName: input.name,
      description: input.description ?? '',
      extractedFields: input.fields ?? {},
      confidence: input.confidence ?? 'medium',
    })
    return null
  }

  if (event.name === 'suggest_relation') {
    const input = event.input as Partial<SuggestRelationInput>
    if (!input.entry1Name || !input.entry2Name || !input.relationshipType) return null
    suggestions.push({
      type: 'relationship',
      entry1Name: input.entry1Name,
      entry2Name: input.entry2Name,
      entry1Type: input.entry1Type ?? 'character',
      entry2Type: input.entry2Type ?? 'character',
      relationshipType: input.relationshipType,
      bidirectionalDescription:
        input.bidirectionalDescription ??
        `${input.entry1Name}与${input.entry2Name}存在${input.relationshipType}关系`,
      confidence: input.confidence ?? 'medium',
    })
    return null
  }

  if (event.name === 'report_contradiction') {
    const input = event.input as Partial<ReportContradictionInput>
    if (!input.entryName || !input.entryType || !input.description) return null
    if (input.severity === 'low') return null
    const key = `${input.entryName}:${input.entryType}`
    if (exemptions?.some(e => e.exemptionKey === key)) return null
    return {
      entryName: input.entryName,
      entryType: input.entryType,
      description: input.description,
    }
  }

  return null
}
