'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAIChat, ChatMessage, type Contradiction } from '@/lib/hooks/use-ai-chat'
import { createProjectDB } from '@/lib/db/project-db'
import { useDismissedSuggestions } from '@/lib/hooks/use-dismissed-suggestions'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useRelations } from '@/lib/hooks/use-relations'
import { MessageBubble } from './message-bubble'
import { RelationshipSuggestionCard, NewEntrySuggestionCard } from './suggestion-card'
import { ConsistencyWarningCard } from './consistency-warning-card'
import { NewEntryDialog, type NewEntryPrefillData } from './new-entry-dialog'
import { DuplicateEntryDialog } from './duplicate-entry-dialog'
import { Send, Loader2, Lightbulb, AlertTriangle, Feather, X, ArrowDown, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { WorldEntry, WorldEntryType } from '@/lib/types'
import type { Suggestion, RelationshipSuggestion, NewEntrySuggestion } from '@/lib/ai/suggestion-parser'

interface AIChatPanelProps {
  projectId: string
  onInsertDraft?: (content: string) => void
  selectedText?: string | null
  onDiscussComplete?: () => void
  onSwitchToWorldTab?: () => void
}

const STARTER_PROMPTS = [
  { label: '推敲人物动机', prompt: '帮我推敲这章主角的动机是否合理，能否再深一层？' },
  { label: '设计情节冲突', prompt: '基于当前设定，为接下来的情节构思三种可能的冲突走向。' },
  { label: '检查设定一致性', prompt: '对照世界观百科，检查本章是否有与设定冲突的地方。' },
  { label: '优化场景描写', prompt: '这段场景描写略显平淡，请给出更有画面感的改写思路。' }
] as const

const CHAR_LIMIT = 4000

export function AIChatPanel({ projectId, onInsertDraft, selectedText, onDiscussComplete, onSwitchToWorldTab }: AIChatPanelProps) {
  const {
    messages,
    loading,
    sendMessage,
    suggestions,
    dismissSuggestion,
    clearSuggestions,
    contradictions,
    isCheckingConsistency,
    addExemption,
    clearContradiction
  } = useAIChat(projectId, { selectedText: selectedText || undefined })

  const { entriesByType, addEntry } = useWorldEntries(projectId)
  const { addRelation } = useRelations(projectId)
  const { dismiss, filterDismissed, reset } = useDismissedSuggestions()

  const [input, setInput] = useState('')
  const [chatError, setChatError] = useState<string | null>(null)
  const [showScrollPill, setShowScrollPill] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false)
  const [prefillEntry, setPrefillEntry] = useState<{ type: WorldEntryType; data: NewEntryPrefillData } | null>(null)

  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [existingEntry, setExistingEntry] = useState<WorldEntry | null>(null)
  const [duplicateEntryName, setDuplicateEntryName] = useState('')

  const [toastMessage, setToastMessage] = useState<string | null>(null)

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

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    if (!overrideText) setInput('')
    try {
      await sendMessage(text)
      onDiscussComplete?.()
    } catch (err) {
      console.error('Failed to send message:', err)
      setChatError(err instanceof Error ? err.message : '发送失败')
    }
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
    setPrefillEntry({ type: suggestion.entryType, data: prefillData })
    setNewEntryDialogOpen(true)
  }

  const handleDismiss = (suggestion: Suggestion) => {
    dismiss(suggestion)
    dismissSuggestion(suggestion)
  }

  const handleSaveNewEntry = async (entry: Partial<WorldEntry>) => {
    if (!prefillEntry) return
    try {
      await addEntry(prefillEntry.type, entry.name)
      dismiss(prefillEntry as unknown as Suggestion)
      dismissSuggestion(prefillEntry as unknown as Suggestion)
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

  const handleCreateNew = () => {
    setDuplicateDialogOpen(false)
  }

  const handleIgnoreContradiction = (index: number) => {
    clearContradiction(index)
  }

  const handleIntentionalContradiction = async (contradiction: Contradiction, index: number) => {
    await addExemption(contradiction.entryName, contradiction.entryType)
    clearContradiction(index)
    showToast('已记录为有意为之')
  }

  const handleFixWorldEntry = () => {
    onSwitchToWorldTab?.()
  }

  const isEmpty = messages.length === 0
  const charCount = input.length
  const overLimit = charCount > CHAR_LIMIT

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background relative">
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-foreground text-background text-xs rounded-md shadow-lg animate-fade-up">
          {toastMessage}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <div className="surface-elevated h-12 flex items-center gap-2.5 px-3.5 relative">
        <div className="relative flex-shrink-0">
          <div
            aria-hidden
            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center"
          >
            <Feather className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-display text-[15px] tracking-wider text-foreground leading-none">
            墨客
          </span>
          <span className="text-[10px] text-muted-foreground/80 tracking-wide leading-none mt-1">
            AI · 写作伙伴
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {messages.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70 tabular-nums tracking-wider">
              {messages.length} 条对话
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              aria-hidden
              className={loading
                ? 'h-1.5 w-1.5 rounded-full bg-primary animate-inkwell-breathe'
                : 'h-1.5 w-1.5 rounded-full bg-primary/70'}
            />
            {loading ? '思索中' : '就绪'}
          </span>
        </div>
        <div
          aria-hidden
          className="absolute left-3.5 right-3.5 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        />
      </div>

      {/* ── Selected-text indicator ────────────────────────── */}
      {selectedText && (
        <div className="flex items-start gap-2 px-3.5 py-2 bg-primary/5 border-b border-primary/10 animate-fade-up">
          <Quote className="w-3 h-3 text-primary/70 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted-foreground/80 tracking-wide mb-0.5">已选中文本</div>
            <div className="text-[11px] text-foreground/70 line-clamp-2 leading-snug">
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
          <div className="h-full flex items-center justify-center p-6 bg-amber-vignette">
            <div className="max-w-[260px] w-full space-y-5">
              {/* Quill ornament */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-primary/15 blur-xl"
                  />
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-background via-card to-primary/10 border border-primary/25 flex items-center justify-center shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.5)]">
                    <Feather className="h-6 w-6 text-primary" strokeWidth={1.8} />
                  </div>
                </div>
                <div
                  aria-hidden
                  className="w-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                />
                <div className="text-center space-y-1.5">
                  <p className="font-display text-xl tracking-[0.08em] text-foreground">
                    墨落生花
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    提笔之前，不妨先与墨客聊一聊
                  </p>
                </div>
              </div>

              {/* Starter chips */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 text-center mb-2">
                  · 试试这样开始 ·
                </div>
                {STARTER_PROMPTS.map((starter, i) => (
                  <button
                    key={starter.label}
                    onClick={() => handleSend(starter.prompt)}
                    className="group w-full text-left px-3 py-2 rounded-md bg-card/50 hover:bg-card border border-border/60 hover:border-primary/30 transition-all duration-200 animate-message-enter hover:translate-x-0.5"
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-primary/70 font-mono tabular-nums">
                        0{i + 1}
                      </span>
                      <span className="text-[12.5px] text-foreground/85 group-hover:text-foreground transition-colors">
                        {starter.label}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
                        →
                      </span>
                    </div>
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
                onInsertDraft={handleInsertDraft}
              />
            ))}

            {visibleSuggestions.length > 0 && (
              <div className="mx-2 my-3 p-3 rounded-lg bg-primary/[0.03] border border-primary/10 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-primary/70 mb-1">
                  <Lightbulb className="w-3 h-3" />
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
              <div className="mx-2 my-3 p-3 rounded-lg bg-destructive/[0.04] border border-destructive/15 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-destructive/80 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>矛盾检测</span>
                </div>
                {isCheckingConsistency && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
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
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
                    <Feather className="w-3 h-3 text-primary" strokeWidth={2.2} />
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1.5 pt-1">
                  <span className="font-display text-[13px] tracking-wide text-primary/90 leading-none">墨客</span>
                  <div className="flex items-center gap-1 h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ink-drop" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ink-drop" style={{ animationDelay: '160ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ink-drop" style={{ animationDelay: '320ms' }} />
                    <span className="ml-2 text-[11px] text-muted-foreground/80 italic">笔尖正在蘸墨…</span>
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
            className="sticky bottom-3 left-1/2 ml-[-52px] z-20 inline-flex items-center gap-1 px-2.5 py-1 bg-card/90 backdrop-blur-md border border-border/70 rounded-full shadow-md text-[11px] text-foreground/80 hover:bg-card hover:border-primary/30 transition-all animate-fade-up"
            aria-label="跳到最新"
          >
            <ArrowDown className="w-3 h-3 text-primary" />
            <span>跳到最新</span>
          </button>
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────── */}
      <div className="surface-elevated border-t p-2.5 space-y-2">
        {chatError && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs animate-fade-up">
            <span>{chatError}</span>
            <button onClick={() => setChatError(null)} className="ml-2 hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div
          className={`relative rounded-lg border transition-all duration-200 ${
            inputFocused
              ? 'border-primary/40 bg-background shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]'
              : 'border-border/70 bg-background/50'
          } ${overLimit ? 'border-destructive/50' : ''}`}
        >
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
            className="resize-none min-h-[56px] max-h-[140px] text-[13px] leading-relaxed bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2.5 pr-12"
          />

          {/* Send button — floating bottom-right of textarea */}
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading || overLimit}
            size="icon"
            className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary/85 hover:from-primary hover:to-primary disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.5)] transition-all active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
          </Button>

          {/* Meta row — inside border, below textarea */}
          <div className="flex items-center justify-between px-2.5 pb-1.5 text-[10px] text-muted-foreground/60 tracking-wide">
            <div className="flex items-center gap-1.5">
              <kbd className="inline-flex items-center px-1 py-px rounded border border-border/70 bg-muted/40 font-mono text-[9px] leading-none">
                Enter
              </kbd>
              <span>发送</span>
              <span className="text-muted-foreground/30">·</span>
              <kbd className="inline-flex items-center px-1 py-px rounded border border-border/70 bg-muted/40 font-mono text-[9px] leading-none">
                Shift+Enter
              </kbd>
              <span>换行</span>
            </div>
            {charCount > 0 && (
              <span className={`tabular-nums ${overLimit ? 'text-destructive' : charCount > CHAR_LIMIT * 0.8 ? 'text-primary/80' : ''}`}>
                {charCount}{overLimit && ` / ${CHAR_LIMIT}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {prefillEntry && (
        <NewEntryDialog
          open={newEntryDialogOpen}
          onClose={() => setNewEntryDialogOpen(false)}
          entryType={prefillEntry.type}
          prefillData={prefillEntry.data}
          onSave={handleSaveNewEntry}
          onCheckDuplicate={handleCheckDuplicate}
          onLinkExisting={handleLinkExisting}
          onCreateNew={handleCreateNew}
        />
      )}

      {existingEntry && (
        <DuplicateEntryDialog
          open={duplicateDialogOpen}
          onClose={() => setDuplicateDialogOpen(false)}
          entryName={duplicateEntryName}
          existingEntry={existingEntry}
          onLinkExisting={handleLinkExisting}
          onCreateNew={handleCreateNew}
        />
      )}
    </div>
  )
}
