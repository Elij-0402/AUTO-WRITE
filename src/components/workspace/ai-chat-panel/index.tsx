'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAIChat } from '@/lib/hooks/use-ai-chat'
import { useAIConfig } from '@/lib/hooks/use-ai-config'
import { useConversations } from '@/lib/hooks/use-conversations'
import { useProjectCharter } from '@/lib/hooks/use-project-charter'
import { recordPreferenceMemory } from '@/lib/db/project-charter-queries'
import { createProjectDB } from '@/lib/db/project-db'
import { useDismissedSuggestions } from '@/lib/hooks/use-dismissed-suggestions'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useRelations } from '@/lib/hooks/use-relations'
import { generateDirectionConfirmation, type DirectionConfirmationDraft } from '@/lib/ai/direction-confirmation'
import { History } from 'lucide-react'
import { PenLine, MessageSquare, Quote, Wand2 } from 'lucide-react'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { DirectionConfirmationCard } from './direction-confirmation-card'
import { AIUnderstandingPanel } from './ai-understanding-panel'
import { NewEntryDialog, type NewEntryPrefillData } from '../new-entry-dialog'
import { ConversationDrawer } from '../conversation-drawer'
import { ChapterDraftPanel, type DraftApplyMode } from '../chapter-draft-panel'
import { findEntryIdByName } from '@/lib/ai/find-entry-by-name'
import type { WorldEntry, WorldEntryType } from '@/lib/types'
import type { NewEntrySuggestion } from '@/lib/ai/suggestion-parser'
import type { AssistantPreferenceFeedbackInput } from '../message-bubble'
import { Button } from '@/components/ui/button'

interface AIChatPanelProps {
  projectId: string
  activeChapterId?: string | null
  onInsertDraft?: (content: string) => void
  selectedText?: string | null
  onDiscussComplete?: () => void
  onSwitchToWorldTab?: () => void
  onOpenAIConfig?: () => void
}

export function AIChatPanel({
  projectId,
  activeChapterId = null,
  onInsertDraft,
  selectedText,
  onDiscussComplete,
  onSwitchToWorldTab,
  onOpenAIConfig,
}: AIChatPanelProps) {
  // ── Conversation management ──────────────────────────────────────
  const { conversations, loading: conversationsLoading, remove: removeConversation } = useConversations(projectId)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<'chat' | 'draft' | 'rewrite'>('chat')

  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const ensureConversation = useCallback(async () => {
    const id = crypto.randomUUID()
    await db.table('conversations').add({
      id, projectId, title: '对话', messageCount: 0,
      createdAt: Date.now(), updatedAt: Date.now(),
    })
    setActiveConversationId(id)
    return id
  }, [db, projectId])

  useEffect(() => {
    if (conversationsLoading) return
    if (conversations.length === 0) {
      if (!activeConversationId) {
        void ensureConversation().catch(console.error)
      }
      return
    }
    const hasActiveConversation = activeConversationId
      ? conversations.some((conversation) => conversation.id === activeConversationId)
      : false
    if (!hasActiveConversation) {
      setActiveConversationId(conversations[0].id)
    }
  }, [activeConversationId, conversations, conversationsLoading, ensureConversation])

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null

  // ── AI Chat ───────────────────────────────────────────────────────
  const {
    messages, loading, sendMessage, cancelStream,
    appendDirectionAdjustment,
    appendDraftTurn,
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
  const { charter, save: saveCharter } = useProjectCharter(projectId)

  const visibleSuggestions = filterDismissed(suggestions)
  const isConversationEmpty = messages.every(message => !message.content.trim())
  const [directionConfirmation, setDirectionConfirmation] = useState<DirectionConfirmationDraft | null>(null)
  const [isGeneratingDirectionConfirmation, setIsGeneratingDirectionConfirmation] = useState(false)
  const confirmationKeyRef = useRef<string | null>(null)
  const dismissedConfirmationKeyRef = useRef<string | null>(null)

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

  useEffect(() => {
    if (loading || isGeneratingDirectionConfirmation) {
      return
    }
    if (!aiConfig.apiKey || !activeConversationId) {
      return
    }
    if (!charter || charter.oneLinePremise.trim() || charter.storyPromise.trim() || charter.themes.length > 0) {
      return
    }

    const nonEmptyMessages = messages.filter(message => message.content.trim())
    const userMessages = nonEmptyMessages.filter(message => message.role === 'user')
    const assistantMessages = nonEmptyMessages.filter(message => message.role === 'assistant')
    if (userMessages.length < 2 || assistantMessages.length < 2) {
      return
    }

    const confirmationWindow = nonEmptyMessages.slice(-4)
    const confirmationKey = confirmationWindow.map(message => message.id).join(':')
    if (!confirmationKey || confirmationKey === confirmationKeyRef.current || confirmationKey === dismissedConfirmationKeyRef.current) {
      return
    }

    let cancelled = false
    confirmationKeyRef.current = confirmationKey
    setIsGeneratingDirectionConfirmation(true)

    void (async () => {
      try {
        const draft = await generateDirectionConfirmation(
          {
            provider: aiConfig.provider,
            apiKey: aiConfig.apiKey,
            baseUrl: aiConfig.baseUrl,
            model: aiConfig.model,
          },
          confirmationWindow.map(message => ({
            role: message.role,
            content: message.content,
          }))
        )

        if (!cancelled) {
          setDirectionConfirmation(draft)
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('[AIChatPanel] direction confirmation failed:', error)
        }
      } finally {
        if (!cancelled) {
          setIsGeneratingDirectionConfirmation(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    aiConfig.apiKey,
    aiConfig.baseUrl,
    aiConfig.model,
    aiConfig.provider,
    charter,
    activeConversationId,
    isGeneratingDirectionConfirmation,
    loading,
    messages,
  ])

  // ── Input handling ────────────────────────────────────────────────
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    if (!overrideText) setInput('')

    const result = await sendMessage(text)
    if (!result.success && result.needsConfig) {
      setChatError(result.message)
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
    const allEntries: WorldEntry[] = [
      ...entriesByType.character,
      ...entriesByType.location,
      ...entriesByType.rule,
      ...entriesByType.timeline,
    ]
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
    if (id !== activeConversationId) {
      return
    }

    const remainingConversations = conversations.filter((conversation) => conversation.id !== id)
    if (remainingConversations.length > 0) {
      setActiveConversationId(remainingConversations[0].id)
      return
    }

    await ensureConversation()
  }

  const handleSaveModel = async (model: string) => {
    await saveAIConfig({ model })
  }

  const handleDismissError = () => setChatError(null)

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    setPanelMode('chat')
    setDrawerOpen(false)
  }

  const handleAcceptDraft = async (
    draft: string,
    meta: { applyMode: DraftApplyMode; chapterTitle?: string; outline: string }
  ) => {
    onInsertDraft?.(draft)
    await appendDraftTurn({
      draft,
      outline: meta.outline,
      chapterTitle: meta.chapterTitle,
    })
    showToast('草稿已插入正文')
    setPanelMode('chat')
  }

  const handleOpenAIConfig = () => {
    onOpenAIConfig?.()
  }

  const handleAcceptDirectionConfirmation = async () => {
    if (!directionConfirmation) {
      return
    }

    await saveCharter({
      oneLinePremise: directionConfirmation.oneLinePremise,
      storyPromise: directionConfirmation.storyPromise,
      themes: directionConfirmation.themes,
    })
    setDirectionConfirmation(null)
  }

  const handleContinueTalking = () => {
    dismissedConfirmationKeyRef.current = confirmationKeyRef.current
    setDirectionConfirmation(null)
    setInput(current => current.trim() ? current : '我再补一句：')
  }

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
            本章助手
          </span>
          <span className="mt-1 truncate text-[11px] leading-none text-muted-foreground">
            {activeChapterId
              ? '围绕当前章节协作：对话、起草、改写。'
              : activeConversation?.displayTitle ?? activeConversation?.title ?? '先选一个章节，再让助手围绕本章协作'}
          </span>
        </div>
        {activeChapterId ? (
          <div className="inline-flex rounded-sm border border-border surface-1 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={panelMode === 'chat' ? 'subtle' : 'ghost'}
              className="h-7 px-2.5"
              onClick={() => setPanelMode('chat')}
              aria-pressed={panelMode === 'chat'}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              对话
            </Button>
            <Button
              type="button"
              size="sm"
              variant={panelMode === 'draft' ? 'subtle' : 'ghost'}
              className="h-7 px-2.5"
              onClick={() => setPanelMode('draft')}
              aria-pressed={panelMode === 'draft'}
            >
              <PenLine className="h-3.5 w-3.5" />
              起草
            </Button>
            <Button
              type="button"
              size="sm"
              variant={panelMode === 'rewrite' ? 'subtle' : 'ghost'}
              className="h-7 px-2.5"
              onClick={() => setPanelMode('rewrite')}
              aria-pressed={panelMode === 'rewrite'}
            >
              <Wand2 className="h-3.5 w-3.5" />
              改写
            </Button>
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span
              className={loading
                ? 'h-1.5 w-1.5 rounded-[2px] bg-primary animate-caret'
                : 'h-1.5 w-1.5 rounded-[2px] bg-[hsl(var(--success))]'}
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

      {charter && (
        <AIUnderstandingPanel
          charter={{
            oneLinePremise: charter.oneLinePremise,
            storyPromise: charter.storyPromise,
            themes: charter.themes,
            aiUnderstanding: charter.aiUnderstanding,
          }}
          onSave={async (updates) => {
            await saveCharter(updates)
            await appendDirectionAdjustment(updates)
            showToast('好，我按这个记下了')
          }}
        />
      )}

      {panelMode === 'draft' ? (
        <ChapterDraftPanel
          projectId={projectId}
          activeChapterId={activeChapterId}
          config={aiConfig}
          worldEntries={[
            ...entriesByType.character,
            ...entriesByType.location,
            ...entriesByType.rule,
            ...entriesByType.timeline,
          ]}
          onAcceptDraft={handleAcceptDraft}
          onOpenAIConfig={handleOpenAIConfig}
        />
      ) : panelMode === 'rewrite' ? (
        <div className="flex-1 px-4 py-4">
          <div className="rounded-[var(--radius-panel)] border border-border bg-[hsl(var(--surface-1))] px-4 py-4">
            <div className="text-[14px] font-semibold text-foreground">改写功能即将开放</div>
            <p className="mt-1 text-[12px] leading-[1.6] text-muted-foreground">
              后续会在这里提供改写、扩写和续写。
            </p>
          </div>
        </div>
      ) : (
        <>
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

          {directionConfirmation && (
            <DirectionConfirmationCard
              oneLinePremise={directionConfirmation.oneLinePremise}
              storyPromise={directionConfirmation.storyPromise}
              themes={directionConfirmation.themes}
              onAccept={() => void handleAcceptDirectionConfirmation()}
              onContinueTalking={handleContinueTalking}
            />
          )}

          {/* ── Chat input ───────────────────────────────────── */}
          <ChatInput
            input={input}
            loading={loading}
            chatError={chatError}
            aiConfig={aiConfig}
            placeholder={
              isConversationEmpty
                ? '你想写一个什么故事，或者想要什么感觉？'
                : '与墨客聊聊你的故事…'
            }
            onInputChange={setInput}
            onKeyDown={handleKeyDown}
            onSend={() => void handleSend()}
            onCancel={cancelStream}
            onSaveModel={handleSaveModel}
            onDismissError={handleDismissError}
            onOpenAIConfig={handleOpenAIConfig}
          />
        </>
      )}

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
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
      />
    </div>
  )
}
