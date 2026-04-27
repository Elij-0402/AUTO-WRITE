'use client'

import { useState, useRef, useCallback } from 'react'
import { streamChat, type AIClientConfig } from '../ai/client'
import { buildSegmentedSystemPrompt, CHAPTER_DRAFT_INSTRUCTION } from '../ai/prompts'
import type { WorldEntry } from '../types/world-entry'

export type DraftGenerationState =
  | 'idle'
  | 'generating'
  | 'draft_ready'
  | 'accepted'
  | 'dismissed'

export interface UseChapterDraftGenerationOptions {
  projectId: string
  config: AIClientConfig
  worldEntries: WorldEntry[]
  onDraftAccepted?: (draft: string) => void
}

export interface UseChapterDraftGenerationReturn {
  state: DraftGenerationState
  draft: string | null
  error: string | null
  progress: string | null
  startGeneration: (opts: { chapterId: string | null; outline: string; targetWordCount?: [number, number]; chapterTitle?: string }) => Promise<void>
  acceptDraft: () => void
  dismissDraft: () => void
  cancelGeneration: () => void
}

/** Fallback draft detection when provider doesn't support tool use */
const DRAFT_INDICATORS = ['以下是草稿', '草稿：']

function extractDraftFromText(fullContent: string): string | null {
  for (const marker of DRAFT_INDICATORS) {
    const idx = fullContent.indexOf(marker)
    if (idx !== -1) {
      return fullContent.slice(idx + marker.length).trim()
    }
  }
  return null
}

export function useChapterDraftGeneration({
  config,
  worldEntries,
  onDraftAccepted,
}: UseChapterDraftGenerationOptions): UseChapterDraftGenerationReturn {
  const [state, setState] = useState<DraftGenerationState>('idle')
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setState('idle')
    setProgress(null)
  }, [])

  const startGeneration = useCallback(async (opts: {
    chapterId: string | null
    outline: string
    targetWordCount?: [number, number]
    chapterTitle?: string
  }) => {
    if (!config.apiKey) {
      setError('还没设置 API 密钥')
      return
    }

    setState('generating')
    setDraft(null)
    setError(null)
    setProgress('排队中：正在整理章纲、世界观与字数目标...')

    abortControllerRef.current = new AbortController()

    try {
      const segmentedSystem = buildSegmentedSystemPrompt({
        worldEntries,
        chapterDraftInstruction: CHAPTER_DRAFT_INSTRUCTION,
      })

      const userMessage = opts.targetWordCount
        ? `【章节大纲】\n${opts.outline}\n\n【目标字数】${opts.targetWordCount[0]}-${opts.targetWordCount[1]}字${opts.chapterTitle ? `\n【章节标题】${opts.chapterTitle}` : ''}`
        : `【章节大纲】\n${opts.outline}${opts.chapterTitle ? `\n【章节标题】${opts.chapterTitle}` : ''}`

      const messages = [{ role: 'user' as const, content: userMessage }]

      setProgress('生成中：模型正在起草正文...')

      const events = streamChat(
        {
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        },
        {
          segmentedSystem,
          messages,
          signal: abortControllerRef.current.signal,
        }
      )

      let fullContent = ''
      let draftFromTool: string | null = null

      for await (const event of events) {
        if (event.type === 'text_delta') {
          fullContent += event.delta
          if (fullContent.length > 400) {
            setProgress('生成中：正在扩写正文段落...')
          }
        } else if (event.type === 'tool_call') {
          if (event.name === 'chapter_draft') {
            // The chapter_draft tool schema doesn't include a draft content field,
            // so we extract from the accumulated text stream using the "以下是草稿" marker.
            const extracted = extractDraftFromText(fullContent)
            if (extracted) {
              draftFromTool = extracted
            }
            setProgress('已完成：正在整理草稿格式...')
          }
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      // Try to extract draft from tool call first, then fallback to text parsing
      let finalDraft: string | null = draftFromTool
      if (!finalDraft) {
        finalDraft = extractDraftFromText(fullContent)
      }

      if (finalDraft) {
        setDraft(finalDraft)
        setState('draft_ready')
      } else {
        // No draft found - use the full content as fallback
        setDraft(fullContent || '未能生成有效草稿')
        setState('draft_ready')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState('idle')
      } else {
        setError(err instanceof Error ? err.message : '生成失败')
        setState('idle')
      }
    } finally {
      abortControllerRef.current = null
      setProgress(null)
    }
  }, [config, worldEntries])

  const acceptDraft = useCallback(() => {
    if (draft) {
      onDraftAccepted?.(draft)
    }
    setState('accepted')
  }, [draft, onDraftAccepted])

  const dismissDraft = useCallback(() => {
    setState('dismissed')
    setDraft(null)
  }, [])

  return {
    state,
    draft,
    error,
    progress,
    startGeneration,
    acceptDraft,
    dismissDraft,
    cancelGeneration,
  }
}
