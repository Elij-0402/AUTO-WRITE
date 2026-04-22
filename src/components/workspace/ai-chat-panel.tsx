'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAIChat, ChatMessage } from '@/lib/hooks/use-ai-chat'
import { useWizardMode } from '@/lib/hooks/use-wizard-mode'
import { ConsistencyWarningCard, type Contradiction } from './consistency-warning-card'
import { useAIConfig } from '@/lib/hooks/use-ai-config'
import { useConversations } from '@/lib/hooks/use-conversations'
import { createProjectDB } from '@/lib/db/project-db'
import { useDismissedSuggestions } from '@/lib/hooks/use-dismissed-suggestions'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useRelations } from '@/lib/hooks/use-relations'
import { MessageBubble } from './message-bubble'
import { RelationshipSuggestionCard, NewEntrySuggestionCard } from './suggestion-card'
import { NewEntryDialog, type NewEntryPrefillData } from './new-entry-dialog'
import { ConversationDrawer } from './conversation-drawer'
import { Send, Loader2, Lightbulb, AlertTriangle, Feather, X, ArrowDown, Quote, Square, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { WorldEntry, WorldEntryType } from '@/lib/types'
import type { Suggestion, RelationshipSuggestion, NewEntrySuggestion } from '@/lib/ai/suggestion-parser'

type PrefillEntry = {
  type: WorldEntryType
  data: NewEntryPrefillData
  sourceSuggestion: NewEntrySuggestion
}

interface AIChatPanelProps {
  projectId: string
  onInsertDraft?: (content: string) => void
  selectedText?: string | null
  onDiscussComplete?: () => void
  onSwitchToWorldTab?: () => void
  wizardModeActive?: boolean
  onWizardModeComplete?: () => void
}

const STARTER_PROMPTS = [
  { label: '推敲人物动机', prompt: '帮我推敲这章主角的动机是否合理，能否再深一层？' },
  { label: '设计情节冲突', prompt: '基于当前设定，为接下来的情节构思三种可能的冲突走向。' },
  { label: '检查设定一致性', prompt: '对照世界观百科，检查本章是否有与设定冲突的地方。' },
  { label: '优化场景描写', prompt: '这段场景描写略显平淡，请给出更有画面感的改写思路。' }
] as const

const CHAR_LIMIT = 4000

export function AIChatPanel({ projectId, onInsertDraft, selectedText, onDiscussComplete, onSwitchToWorldTab, wizardModeActive, onWizardModeComplete }: AIChatPanelProps) {
  const { conversations, remove: removeConversation } = useConversations(projectId)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Always use the single conversation (conversations[0]).
  // Auto-create if none exist yet (user-triggered session management removed).
  const db = useMemo(() => createProjectDB(projectId), [projectId])
  const activeConversationId = conversations[0]?.id ?? null

  // Auto-create the single default conversation if list is empty
  useEffect(() => {
    if (!conversations.length && activeConversationId === null) {
      const id = crypto.randomUUID()
      db.table('conversations').add({
        id,
        projectId,
        title: '对话',
        messageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).catch(console.error)
    }
  }, [conversations.length, activeConversationId, db, projectId])

  const activeConversation = conversations[0] ?? null

  const {
    messages,
    loading,
    sendMessage,
    cancelStream,
    suggestions,
    dismissSuggestion,
    clearSuggestions,
    contradictions,
    isCheckingConsistency,
    addExemption,
    clearContradiction,
    cacheHint,
  } = useAIChat(projectId, activeConversationId, { selectedText: selectedText || undefined })

  // Wizard mode
  const {
    state: wizardState,
    options: wizardOptions,
    result: wizardResult,
    error: wizardError,
    triggerWizardMode,
    selectOption,
    cancel: cancelWizard,
    reset: resetWizard,
  } = useWizardMode({
    projectId,
    conversationId: activeConversationId,
    selectedText,
  })

  // Trigger wizard mode when externally activated
  useEffect(() => {
    if (wizardModeActive && wizardState === 'idle') {
      void triggerWizardMode()
    }
  }, [wizardModeActive, wizardState, triggerWizardMode])

  // Notify parent when wizard mode completes
  useEffect(() => {
    if ((wizardState === 'done' || wizardState === 'error') && wizardModeActive) {
      onWizardModeComplete?.()
    }
  }, [wizardState, wizardModeActive, onWizardModeComplete])

  const { entriesByType, addEntry, updateEntryFields } = useWorldEntries(projectId)
  const { addRelation } = useRelations(projectId)
  const { dismiss, filterDismissed, reset } = useDismissedSuggestions()
  const { config: aiConfig, saveConfig: saveAIConfig } = useAIConfig()

  const handleDeleteConversation = useCallback(async (id: string) => {
    await removeConversation(id)
  }, [removeConversation])

  const [input, setInput] = useState('')
  const [chatError, setChatError] = useState<string | null>(null)
  const [showScrollPill, setShowScrollPill] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false)
  const [prefillEntry, setPrefillEntry] = useState<PrefillEntry | null>(null)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [cacheHintVisible, setCacheHintVisible] = useState(false)
  const cacheHintShown = useRef(false)

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

  const visibleSuggestions = filterDismissed(suggestions)

  useEffect(() => {
    if (messages.length === 0) {
      reset()
      clearSuggestions()
    }
  }, [messages.length, reset, clearSuggestions])

  // Surface cache TTL savings hint once per session.
  useEffect(() => {
    if (cacheHint && !cacheHintShown.current) {
      cacheHintShown.current = true
      setCacheHintVisible(true)
      setTimeout(() => setCacheHintVisible(false), 3000)
    }
  }, [cacheHint])

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    if (!overrideText) setInput('')

    const result = await sendMessage(text)
    if (!result.success && result.needsConfig) {
      // Open config dialog - the panel has no prop for this, so show a toast message
      // instructing the user to configure their API key
      showToast('请先在设置中配置 API 密钥')
      return
    }
    onDiscussComplete?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInsertDraft = (_draftId: string, content: string) => {
    onInsertDraft?.(content)
  }

  const findEntryIdByName = (name: string): string | null => {
    for (const [, entries] of Object.entries(entriesByType)) {
      const found = entries.find(e => e.name === name || name.includes(e.name))
      if (found) return found.id
    }
    return null
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAdoptRelationship = async (suggestion: RelationshipSuggestion) => {
    const entry1Id = findEntryIdByName(suggestion.entry1Name)
    const entry2Id = findEntryIdByName(suggestion.entry2Name)

    if (!entry1Id || !entry2Id) {
      showToast('未找到相关条目，无法创建关联')
      return
    }

    try {
      await addRelation(
        entry1Id,
        entry2Id,
        'character_relation',
        suggestion.relationshipType,
        suggestion.bidirectionalDescription
      )
      dismiss(suggestion)
      dismissSuggestion(suggestion)
      showToast('已建立关联')
    } catch (err) {
      console.error('Failed to create relation:', err)
      showToast('创建关联失败')
    }
  }

  const handleAdoptNewEntry = (suggestion: NewEntrySuggestion) => {
    const prefillData: NewEntryPrefillData = {
      name: suggestion.suggestedName,
      ...suggestion.extractedFields
    }
    setPrefillEntry({ type: suggestion.entryType, data: prefillData, sourceSuggestion: suggestion })
    setNewEntryDialogOpen(true)
  }

  const handleDismiss = (suggestion: Suggestion) => {
    dismiss(suggestion)
    dismissSuggestion(suggestion)
  }

  const handleSaveNewEntry = async (entry: Partial<WorldEntry>) => {
    if (!prefillEntry) return
    try {
      const newId = await addEntry(prefillEntry.type, entry.name)
      // Persist additional fields the user edited in the dialog. addEntry only
      // took the name; the rest (description, background, features, …) would
      // otherwise be silently dropped.
      const { name, ...rest } = entry
      void name
      const editable = rest as Parameters<typeof updateEntryFields>[1]
      if (Object.keys(editable).length > 0) {
        await updateEntryFields(newId, editable)
      }
      dismiss(prefillEntry.sourceSuggestion)
      dismissSuggestion(prefillEntry.sourceSuggestion)
      showToast(`已创建${prefillEntry.type === 'character' ? '角色' : prefillEntry.type === 'location' ? '地点' : prefillEntry.type === 'rule' ? '规则' : '时间线'}：「${entry.name}」`)
    } catch (err) {
      console.error('Failed to create entry:', err)
      showToast('创建条目失败')
    }
  }

  const handleCheckDuplicate = async (name: string): Promise<WorldEntry | null> => {
    const allEntries = [
      ...entriesByType.character,
      ...entriesByType.location,
      ...entriesByType.rule,
      ...entriesByType.timeline
    ]
    const existing = allEntries.find(e => e.name === name)
    if (existing) {
      const db = createProjectDB(projectId)
      const entry = await db.table('worldEntries').get(existing.id)
      return entry || null
    }
    return null
  }

  const handleLinkExisting = (entry: WorldEntry) => {
    showToast(`已选择关联到「${entry.name}」`)
  }

  const handleIgnoreContradiction = (index: number) => {
    clearContradiction(index)
  }

const handleIntentionalContradiction = async (contradiction: Contradiction, _index: number) => {
    await addExemption(contradiction.entryName, contradiction.entryType)
    // Also mark the most recent non-exempted row as exempted so the dashboard
    // reflects the decision immediately (CEO-4C: multiple rows per entry possible).
    const db = createProjectDB(projectId)
    const rows = await db.contradictions
      .where('[projectId+entryName]')
      .equals([projectId, contradiction.entryName])
      .and(r => !r.exempted)
      .sortBy('createdAt')
    const latest = rows[rows.length - 1]
    if (latest) {
      await db.contradictions.update(latest.id, { exempted: true })
    }
    clearContradiction(_index)
    showToast('已记录为有意为之')
  }

  const handleFixWorldEntry = () => {
    onSwitchToWorldTab?.()
  }

  const isEmpty = messages.every(m => !m.content.trim())
  const charCount = input.length
  const overLimit = charCount > CHAR_LIMIT

  return (
    <div className="h-full flex flex-col overflow-hidden surface-0 relative">
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-foreground text-background text-[12px] rounded-[var(--radius-control)] shadow-[var(--shadow-lift-md)] animate-fade-up">
          {toastMessage}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <div className="surface-elevated h-12 flex items-center gap-2 px-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground transition-colors"
          aria-label="对话历史"
          title="对话历史"
        >
          <History className="h-4 w-4" />
        </button>
        <div className="flex flex-col min-w-0 flex-1 px-1">
          <span className="text-[14px] font-semibold text-foreground leading-none truncate" title={activeConversation?.title ?? '墨客'}>
            {activeConversation?.title ?? '墨客'}
          </span>
          <span className="text-[11px] text-muted-foreground leading-none mt-1">
            {activeConversation ? `${activeConversation.messageCount} 条消息` : 'AI 写作伙伴'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span
              aria-hidden
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
            <div className="text-[13px] text-foreground/80 line-clamp-2 leading-snug">
              {selectedText}
            </div>
          </div>
        </div>
      )}

      {/* ── Messages / Empty state ─────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
      >
        {isEmpty ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-[280px] w-full space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Feather className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-[18px] font-semibold text-foreground">
                    墨客
                  </p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    与 AI 聊聊你的故事
                  </p>
                </div>
              </div>

              {/* Starter chips */}
              <div className="space-y-2">
                {STARTER_PROMPTS.map((starter, i) => (
                  <button
                    key={starter.label}
                    onClick={() => handleSend(starter.prompt)}
                    className="group w-full text-left px-3 py-2.5 rounded-[var(--radius-control)] border border-border hover:border-primary/40 hover:bg-primary/[0.03] transition-colors animate-message-enter"
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    <span className="text-[13px] text-foreground/85 group-hover:text-foreground">
                      {starter.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-1 pb-2">
            {messages.map((msg: ChatMessage) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                projectId={projectId}
                onInsertDraft={handleInsertDraft}
              />
            ))}

            {visibleSuggestions.length > 0 && (
              <div className="mx-2 my-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--accent-violet))] px-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>墨客建议</span>
                </div>
                {visibleSuggestions.map((suggestion, idx) => (
                  suggestion.type === 'relationship' ? (
                    <RelationshipSuggestionCard
                      key={`${suggestion.entry1Name}-${suggestion.entry2Name}-${idx}`}
                      entry1Name={suggestion.entry1Name}
                      entry2Name={suggestion.entry2Name}
                      relationshipType={suggestion.relationshipType}
                      bidirectionalDescription={suggestion.bidirectionalDescription}
                      onAdopt={() => handleAdoptRelationship(suggestion)}
                      onDismiss={() => handleDismiss(suggestion)}
                    />
                  ) : (
                    <NewEntrySuggestionCard
                      key={`${suggestion.suggestedName}-${idx}`}
                      entryType={suggestion.entryType}
                      suggestedName={suggestion.suggestedName}
                      description={suggestion.description}
                      onAdopt={() => handleAdoptNewEntry(suggestion)}
                      onDismiss={() => handleDismiss(suggestion)}
                    />
                  )
                ))}
              </div>
            )}

            {contradictions.length > 0 && (
              <div className="mx-2 my-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-destructive px-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>矛盾检测</span>
                </div>
                {isCheckingConsistency && (
                  <div className="flex items-center gap-2 text-muted-foreground text-[12px] px-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>检测矛盾中…</span>
                  </div>
                )}
                {contradictions.map((contradiction, idx) => (
                  <ConsistencyWarningCard
                    key={`${contradiction.entryName}-${contradiction.entryType}-${idx}`}
                    contradiction={contradiction}
                    onIgnore={() => handleIgnoreContradiction(idx)}
                    onIntentional={() => handleIntentionalContradiction(contradiction, idx)}
                    onFixWorldEntry={handleFixWorldEntry}
                  />
                ))}
              </div>
            )}

            {loading && (
              <div className="flex gap-2.5 py-3 pl-3 pr-1 ink-rail animate-message-enter">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Feather className="w-3 h-3 text-primary" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1.5 pt-1">
                  <span className="text-[13px] font-medium text-primary leading-none">墨客</span>
                  <div className="flex items-center gap-1 h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '160ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '320ms' }} />
                    <span className="ml-2 text-[12px] text-muted-foreground">思考中…</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scroll-to-latest pill */}
        {showScrollPill && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="sticky bottom-3 left-1/2 ml-[-52px] z-20 inline-flex items-center gap-1 px-2.5 py-1 bg-[hsl(var(--surface-1))] border border-border rounded-full shadow-[var(--shadow-lift-md)] text-[12px] text-foreground/80 hover:bg-[hsl(var(--surface-2))] transition-colors animate-fade-up"
            aria-label="跳到最新"
          >
            <ArrowDown className="w-3 h-3 text-primary" />
            <span>跳到最新</span>
          </button>
        )}
      </div>

      {/* ── Wizard Mode Overlay ─────────────────────────────── */}
      {wizardState !== 'idle' && (
        <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-center pt-16 px-4">
          <div
            className="w-full max-w-sm p-4 rounded-[var(--radius-lg)] border border-[hsl(var(--accent))]/30 bg-[hsl(var(--surface-1))]/95 backdrop-blur-sm shadow-[var(--shadow-lift-md)] animate-fade-up"
            role="dialog"
            aria-modal="true"
            aria-label="AI构思搭档"
          >
            {/* Thinking state */}
            {wizardState === 'thinking' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-4 bg-[hsl(var(--accent))] animate-blink" />
                  <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">构思搭档思考中…</span>
                </div>
                <p className="text-[12px] text-[hsl(var(--muted))]">AI正在分析世界观和上下文</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { cancelWizard(); onWizardModeComplete?.() }}
                  className="text-[hsl(var(--muted))]"
                >
                  取消
                </Button>
              </div>
            )}

            {/* Options state */}
            {wizardState === 'options' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-4 bg-[hsl(var(--accent))]" />
                  <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">请选择方向</span>
                </div>
                <div className="space-y-2">
                  {wizardOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => void selectOption(option)}
                      className="w-full text-left p-3 rounded-[var(--radius-md)] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--surface-2))] transition-colors animate-slide-in"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">{option.title}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]">
                          {option.type === 'logical' ? '情理之中' : option.type === 'wild' ? '天马行空' : '自定义'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[hsl(var(--muted))] mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { cancelWizard(); onWizardModeComplete?.() }}
                  className="w-full text-[hsl(var(--muted))] mt-2"
                >
                  取消
                </Button>
              </div>
            )}

            {/* Expanding state */}
            {wizardState === 'expanding' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-4 bg-[hsl(var(--accent))] animate-blink" />
                  <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">展开情节…</span>
                </div>
                <p className="text-[12px] text-[hsl(var(--muted))]">正在生成具体建议</p>
              </div>
            )}

            {/* Done state */}
            {wizardState === 'done' && wizardResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-4 bg-[hsl(var(--accent))]" />
                  <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">情节建议</span>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]">
                  <p className="text-[13px] text-[hsl(var(--foreground))]/90 leading-relaxed whitespace-pre-wrap">
                    {wizardResult}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onInsertDraft?.(wizardResult)
                      resetWizard()
                      onWizardModeComplete?.()
                    }}
                    className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent-dim))]"
                  >
                    插入编辑器
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { resetWizard(); onWizardModeComplete?.() }}
                    className="text-[hsl(var(--muted))]"
                  >
                    关闭
                  </Button>
                </div>
              </div>
            )}

            {/* Error state */}
            {wizardState === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[hsl(var(--danger))]" />
                  <span className="text-[14px] font-medium text-[hsl(var(--danger))]">{wizardError || '发生错误'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { resetWizard(); onWizardModeComplete?.() }}
                  className="text-[hsl(var(--muted))]"
                >
                  关闭
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Input ──────────────────────────────────────────── */}
      <div className="p-3 space-y-2 border-t border-border">
        {chatError && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-control)] bg-destructive/10 border border-destructive/30 text-destructive text-[12px] animate-fade-up">
            <span>{chatError}</span>
            <button onClick={() => setChatError(null)} className="ml-2 hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div
          className={`rounded-[var(--radius-card)] border bg-[hsl(var(--card))] transition-colors ${
            inputFocused
              ? 'border-primary/60'
              : overLimit
                ? 'border-destructive/50'
                : 'border-border'
          }`}
        >
          <div className="flex flex-col">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="与墨客聊聊你的故事…"
              disabled={loading}
              rows={1}
              className="resize-none min-h-[56px] max-h-[140px] text-[14px] leading-relaxed !bg-transparent hover:!bg-transparent focus-visible:!bg-transparent px-3 py-2.5 pr-12 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
            />

            <div className="flex items-center justify-between px-3 pb-2">
              {aiConfig.availableModels && aiConfig.availableModels.length > 0 ? (
                <select
                  value={aiConfig.model || ''}
                  onChange={(e) => { void saveAIConfig({ model: e.target.value }) }}
                  className="max-w-[180px] truncate bg-transparent text-[12px] text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  aria-label="选择模型"
                  title={aiConfig.model || '选择模型'}
                >
                  {aiConfig.availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <span className="text-[12px] text-muted-foreground/70 truncate max-w-[180px]" title={aiConfig.model || ''}>
                  {aiConfig.model || '未设置模型'}
                </span>
              )}
              <div className="flex items-center gap-2">
                {charCount > 0 && (
                  <span className={`tabular-nums text-[11px] ${overLimit ? 'text-destructive' : charCount > CHAR_LIMIT * 0.8 ? 'text-primary/80' : 'text-muted-foreground'}`}>
                    {charCount}{overLimit && ` / ${CHAR_LIMIT}`}
                  </span>
                )}
                <Button
                  onClick={() => loading ? cancelStream() : handleSend()}
                  disabled={!loading && (!input.trim() || overLimit)}
                  size="icon-sm"
                  variant={loading ? 'subtle' : 'default'}
                  aria-label={loading ? '停止生成' : '发送'}
                  className="disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Square className="fill-current" strokeWidth={0} />
                  ) : (
                    <Send strokeWidth={2} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cache TTL savings hint */}
      {cacheHintVisible && cacheHint && (
        <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-foreground text-background text-[12px] rounded-[var(--radius-control)] shadow-[var(--shadow-lift-md)] animate-fade-up">
          已节省约 {cacheHint.tokens.toLocaleString()} tokens（1小时缓存）
        </div>
      )}

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
