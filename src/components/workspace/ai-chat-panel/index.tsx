'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAIChat } from '@/lib/hooks/use-ai-chat'
import { useAIConfig } from '@/lib/hooks/use-ai-config'
import { useConversations } from '@/lib/hooks/use-conversations'
import { recordPreferenceMemory } from '@/lib/db/project-charter-queries'
import { createProjectDB } from '@/lib/db/project-db'
import { useDismissedSuggestions } from '@/lib/hooks/use-dismissed-suggestions'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useRelations } from '@/lib/hooks/use-relations'
import { History } from 'lucide-react'
import { Quote } from 'lucide-react'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { NewEntryDialog, type NewEntryPrefillData } from '../new-entry-dialog'
import { ConversationDrawer } from '../conversation-drawer'
import { findEntryIdByName } from '@/lib/ai/find-entry-by-name'
import type { WorldEntryType } from '@/lib/types'
import type { NewEntrySuggestion } from '@/lib/ai/suggestion-parser'
import type { AssistantPreferenceFeedbackInput } from '../message-bubble'

interface AIChatPanelProps {
  projectId: string
  onInsertDraft?: (content: string) => void
  selectedText?: string | null
  onDiscussComplete?: () => void
  onSwitchToWorldTab?: () => void
}

export function AIChatPanel({ projectId, onInsertDraft, selectedText, onDiscussComplete, onSwitchToWorldTab }: AIChatPanelProps) {
  // ── Conversation management ──────────────────────────────────────
  const { conversations, loading: conversationsLoading, remove: removeConversation } = useConversations(projectId)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const db = useMemo(() => createProjectDB(projectId), [projectId])
  const activeConversationId = conversations[0]?.id ?? null

  useEffect(() => {
    if (conversationsLoading || conversations.length > 0 || activeConversationId !== null) return
    const id = crypto.randomUUID()
    db.table('conversations').add({
      id, projectId, title: '对话', messageCount: 0,
      createdAt: Date.now(), updatedAt: Date.now(),
    }).catch(console.error)
  }, [conversationsLoading, conversations.length, activeConversationId, db, projectId])

  const activeConversation = conversations[0] ?? null

  // ── AI Chat ───────────────────────────────────────────────────────
  const {
    messages, loading, sendMessage, cancelStream,
    suggestions, dismissSuggestion, clearSuggestions,
    contradictions, isCheckingConsistency, addExemption,
    clearContradiction, cacheHint,
  } = useAIChat(projectId, activeConversationId, { selectedText: selectedText || undefined })

  // ── Entry management ──────────────────────────────────────────────
  const { entriesByType, addEntry, updateEntryFields } = useWorldEntries(projectId)
  const { addRelation } = useRelations(projectId)
  const { dismiss, filterDismissed, reset } = useDismissedSuggestions()

  // ── UI state ─────────────────────────────────────────────────────
  const [input, setInput] = useState('')
  const [chatError, setChatError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [cacheHintVisible, setCacheHintVisible] = useState(false)
  const cacheHintShown = useRef(false)
  const [prefillEntry, setPrefillEntry] = useState<{ type: WorldEntryType; data: NewEntryPrefillData; sourceSuggestion: NewEntrySuggestion } | null>(null)
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollPill, setShowScrollPill] = useState(false)

  const { config: aiConfig, saveConfig: saveAIConfig } = useAIConfig()

  const visibleSuggestions = filterDismissed(suggestions)

  // ── Scroll management ─────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior })
    }
  }, [])

  useEffect(() => {
    scrollToBottom('auto')
  }, [messages, scrollToBottom])

  const handleScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollPill(distanceFromBottom > 120)
  }

  // ── Reset suggestions when conversation changes ─────────────────────
  useEffect(() => {
    if (messages.length === 0) {
      reset()
      clearSuggestions()
    }
  }, [messages.length, reset, clearSuggestions])

  // ── Cache hint ────────────────────────────────────────────────────
  useEffect(() => {
    if (cacheHint && !cacheHintShown.current) {
      cacheHintShown.current = true
      queueMicrotask(() => setCacheHintVisible(true))
      setTimeout(() => setCacheHintVisible(false), 3000)
    }
  }, [cacheHint])

  // ── Input handling ────────────────────────────────────────────────
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    if (!overrideText) setInput('')

    const result = await sendMessage(text)
    if (!result.success && result.needsConfig) {
      showToast('请先在设置中配置 API 密钥')
      return
    }
    onDiscussComplete?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  // ── Suggestion handling ───────────────────────────────────────────
  const handleInsertDraft = (_draftId: string, content: string) => {
    onInsertDraft?.(content)
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleRecordPreference = async ({
    messageId,
    category,
    note,
  }: AssistantPreferenceFeedbackInput) => {
    await recordPreferenceMemory(projectId, {
      source: 'chat',
      messageId,
      verdict: 'reject',
      category,
      note,
    })
    showToast('已记录偏差')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAdoptRelationship = async (suggestion: any) => {
    const entry1Id = findEntryIdByName(entriesByType, suggestion.entry1Name)
    const entry2Id = findEntryIdByName(entriesByType, suggestion.entry2Name)
    if (!entry1Id || !entry2Id) {
      showToast('未找到相关条目，无法创建关联')
      return
    }
    try {
      await addRelation(entry1Id, entry2Id, 'character_relation', suggestion.relationshipType, suggestion.bidirectionalDescription)
      dismiss(suggestion)
      dismissSuggestion(suggestion)
      showToast('已建立关联')
    } catch (err) {
      console.error('Failed to create relation:', err)
      showToast('创建关联失败')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAdoptNewEntry = (suggestion: any) => {
    const prefillData: NewEntryPrefillData = {
      name: suggestion.suggestedName,
      ...suggestion.extractedFields
    }
    setPrefillEntry({ type: suggestion.entryType, data: prefillData, sourceSuggestion: suggestion })
    setNewEntryDialogOpen(true)
  }

  const handleDismiss = (suggestion: Parameters<typeof dismiss>[0]) => {
    dismiss(suggestion)
    dismissSuggestion(suggestion)
  }

  const handleSaveNewEntry = async (entry: Partial<import('@/lib/types').WorldEntry>) => {
    if (!prefillEntry) return
    try {
      const newId = await addEntry(prefillEntry.type, entry.name ?? '')
      const { name, ...rest } = entry
      void name
      const editable = rest as Parameters<typeof updateEntryFields>[1]
      if (Object.keys(editable).length > 0) {
        await updateEntryFields(newId, editable)
      }
      dismiss(prefillEntry.sourceSuggestion)
      dismissSuggestion(prefillEntry.sourceSuggestion)
      showToast(`已创建${prefillEntry.type === 'character' ? '角色' : prefillEntry.type === 'location' ? '地点' : prefillEntry.type === 'rule' ? '规则' : '时间线'}：「${entry.name ?? '新条目'}」`)
    } catch (err) {
      console.error('Failed to create entry:', err)
      showToast('创建条目失败')
    }
  }

  const handleCheckDuplicate = async (name: string) => {
    const allEntries = [...entriesByType.character, ...entriesByType.location, ...entriesByType.rule, ...entriesByType.timeline]
    const existing = allEntries.find(e => e.name === name)
    if (existing) {
      const entry = await db.table('worldEntries').get(existing.id)
      return entry || null
    }
    return null
  }

  const handleLinkExisting = (entry: { id: string; name: string }) => {
    showToast(`已选择关联到「${entry.name}」`)
  }

  const handleIgnoreContradiction = (index: number) => {
    clearContradiction(index)
  }

  const handleIntentionalContradiction = async (contradiction: import('@/lib/hooks/use-ai-chat').PartialContradiction, _index: number) => {
    await addExemption(contradiction.entryName, contradiction.entryType)
    const rows = await db.contradictions.where('[projectId+entryName]').equals([projectId, contradiction.entryName]).toArray()
    for (const row of rows) {
      if (row.entryType === contradiction.entryType && !row.exempted) {
        await db.contradictions.update(row.id, { exempted: true })
      }
    }
    clearContradiction(_index)
    showToast('已记录为有意为之')
  }

  const handleFixWorldEntry = () => {
    onSwitchToWorldTab?.()
  }

  const handleDeleteConversation = async (id: string) => {
    await removeConversation(id)
    setDrawerOpen(false)
  }

  const handleSaveModel = async (model: string) => {
    await saveAIConfig({ model })
  }

  const handleDismissError = () => setChatError(null)

  return (
    <div className="h-full flex flex-col overflow-hidden surface-0 relative">
      {toastMessage && (
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-foreground text-background text-[12px] rounded-[var(--radius-control)] elev-sm animate-fade-up">
          {toastMessage}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <div className="surface-elevated h-12 flex items-center gap-2 px-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground transition-colors"
          aria-label="对话历史"
        >
          <History className="h-4 w-4" />
        </button>
        <div className="flex flex-col min-w-0 flex-1 px-1">
          <span className="text-[14px] font-semibold text-foreground leading-none truncate">
            {activeConversation?.title ?? '墨客'}
          </span>
          <span className="text-[11px] text-muted-foreground leading-none mt-1">
            {activeConversation ? `${activeConversation.messageCount} 条消息` : 'AI 写作伙伴'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span
              className={loading
                ? 'h-1.5 w-1.5 rounded-full bg-primary animate-pulse'
                : 'h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-jade))]'}
            />
            {loading ? '思索中' : '就绪'}
          </span>
        </div>
      </div>

      {/* ── Selected-text indicator ────────────────────────── */}
      {selectedText && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-[hsl(var(--surface-2))] border-b border-border animate-fade-up">
          <Quote className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-muted-foreground mb-0.5">已选中文本</div>
            <div className="text-[13px] text-foreground/80 line-clamp-2 leading-snug">{selectedText}</div>
          </div>
        </div>
      )}

      {/* ── Message list ─────────────────────────────────── */}
      <MessageList
        messages={messages}
        loading={loading}
        contradictions={contradictions}
        isCheckingConsistency={isCheckingConsistency}
        projectId={projectId}
        showScrollPill={showScrollPill}
        visibleSuggestions={visibleSuggestions}
        onSendMessage={handleSend}
        onInsertDraft={handleInsertDraft}
        onRecordPreference={handleRecordPreference}
        onAdoptRelationship={handleAdoptRelationship}
        onDismiss={handleDismiss}
        onAdoptNewEntry={handleAdoptNewEntry}
        onIgnoreContradiction={handleIgnoreContradiction}
        onIntentionalContradiction={handleIntentionalContradiction}
        onFixWorldEntry={handleFixWorldEntry}
        scrollToBottom={scrollToBottom}
        messagesContainerRef={messagesContainerRef}
        onScroll={handleScroll}
      />

      {/* ── Chat input ───────────────────────────────────── */}
      <ChatInput
        input={input}
        loading={loading}
        chatError={chatError}
        aiConfig={aiConfig}
        onInputChange={setInput}
        onKeyDown={handleKeyDown}
        onSend={() => void handleSend()}
        onCancel={cancelStream}
        onSaveModel={handleSaveModel}
        onDismissError={handleDismissError}
      />

      {/* ── Cache hint ───────────────────────────────────── */}
      {cacheHintVisible && cacheHint && (
      <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-foreground text-background text-[12px] rounded-[var(--radius-control)] elev-sm animate-fade-up">
          已节省约 {cacheHint.tokens.toLocaleString()} tokens（1小时缓存）
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────── */}
      {prefillEntry && (
        <NewEntryDialog
          open={newEntryDialogOpen}
          onClose={() => setNewEntryDialogOpen(false)}
          entryType={prefillEntry.type}
          prefillData={prefillEntry.data}
          onSave={handleSaveNewEntry}
          onCheckDuplicate={handleCheckDuplicate}
          onLinkExisting={handleLinkExisting}
        />
      )}

      <ConversationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        onDelete={handleDeleteConversation}
      />
    </div>
  )
}
