'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Send, Loader2, Lightbulb, AlertTriangle, Bot, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import type { WorldEntry, WorldEntryType } from '@/lib/types'
import type { Suggestion, RelationshipSuggestion, NewEntrySuggestion } from '@/lib/ai/suggestion-parser'

interface AIChatPanelProps {
  projectId: string
  onInsertDraft?: (content: string) => void
  selectedText?: string | null
  onDiscussComplete?: () => void
  onSwitchToWorldTab?: () => void
}

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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false)
  const [prefillEntry, setPrefillEntry] = useState<{ type: WorldEntryType; data: NewEntryPrefillData } | null>(null)

  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [existingEntry, setExistingEntry] = useState<WorldEntry | null>(null)
  const [duplicateEntryName, setDuplicateEntryName] = useState('')

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  const visibleSuggestions = filterDismissed(suggestions)

  useEffect(() => {
    if (messages.length === 0) {
      reset()
      clearSuggestions()
    }
  }, [messages.length, reset, clearSuggestions])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
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

  const handleInsertDraft = (draftId: string, content: string) => {
    onInsertDraft?.(content)
  }

  const findEntryIdByName = (name: string): string | null => {
    for (const [type, entries] of Object.entries(entriesByType)) {
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background relative">
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-foreground text-background text-xs rounded-md shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="h-10 border-b flex items-center px-3">
        <Bot className="h-4 w-4 text-muted-foreground mr-2" />
        <span className="text-sm font-medium">AI 助手</span>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-muted-foreground p-6">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                <Bot className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">开始与 AI 对话</p>
              <p className="text-xs text-muted-foreground">配置 AI 设置后开始对话</p>
            </div>
          </div>
        ) : (
          <div className="px-3 divide-y divide-border/60">
            {messages.map((msg: ChatMessage) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onInsertDraft={handleInsertDraft}
              />
            ))}

            {visibleSuggestions.length > 0 && (
              <div className="py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Lightbulb className="w-3 h-3" />
                  <span>AI 建议</span>
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
              <div className="py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>矛盾检测</span>
                </div>
                {isCheckingConsistency && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>检测矛盾中...</span>
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
              <div className="py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-sm">AI 正在思考...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t p-3 space-y-2">
        {chatError && (
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-destructive/10 text-destructive text-sm">
            <span>{chatError}</span>
            <button onClick={() => setChatError(null)} className="ml-2 hover:opacity-70">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            disabled={loading}
            rows={1}
            className="flex-1 resize-none min-h-[36px] max-h-[120px] text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="flex-shrink-0 h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
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
