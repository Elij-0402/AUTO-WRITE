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
import { Send, Loader2 } from 'lucide-react'
import type { WorldEntry, WorldEntryType } from '@/lib/types'
import type { Suggestion, RelationshipSuggestion, NewEntrySuggestion } from '@/lib/ai/suggestion-parser'

interface AIChatPanelProps {
  projectId: string
  onInsertDraft?: (content: string) => void
  /** Selected text from editor for discussion per D-08 */
  selectedText?: string | null
  /** Callback when discussion is complete (text sent or cleared) */
  onDiscussComplete?: () => void
  /** Callback to switch to world bible tab */
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Dialog state for new entry adoption per D-10
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false)
  const [prefillEntry, setPrefillEntry] = useState<{ type: WorldEntryType; data: NewEntryPrefillData } | null>(null)

  // Dialog state for duplicate entry per D-22
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [existingEntry, setExistingEntry] = useState<WorldEntry | null>(null)
  const [duplicateEntryName, setDuplicateEntryName] = useState('')

  // Toast state (simple inline approach - could be replaced with a toast library)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filter suggestions through dismissed
  const visibleSuggestions = filterDismissed(suggestions)

  // Reset dismissed suggestions when conversation changes
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
      // Clear selected text after sending per D-08
      onDiscussComplete?.()
    } catch (err) {
      console.error('Failed to send message:', err)
      alert(err instanceof Error ? err.message : '发送失败')
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

  // Find entry ID by name from entriesByType
  const findEntryIdByName = (name: string): string | null => {
    for (const [type, entries] of Object.entries(entriesByType)) {
      const found = entries.find(e => e.name === name || name.includes(e.name))
      if (found) return found.id
    }
    return null
  }

  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle adopting a relationship suggestion per D-09
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

  // Handle adopting a new entry suggestion per D-10
  const handleAdoptNewEntry = (suggestion: NewEntrySuggestion) => {
    const prefillData: NewEntryPrefillData = {
      name: suggestion.suggestedName,
      ...suggestion.extractedFields
    }
    setPrefillEntry({ type: suggestion.entryType, data: prefillData })
    setNewEntryDialogOpen(true)
  }

  // Handle dismiss per D-17
  const handleDismiss = (suggestion: Suggestion) => {
    dismiss(suggestion)
    dismissSuggestion(suggestion)
  }

  // Handle saving new entry from dialog
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

  // Handle checking for duplicate entry names per D-22
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

  // Handle linking to existing entry
  const handleLinkExisting = (entry: WorldEntry) => {
    // For now, just show a toast - could open relation creation dialog
    showToast(`已选择关联到「${entry.name}」`)
  }

  // Handle creating new when duplicate exists
  const handleCreateNew = () => {
    setDuplicateDialogOpen(false)
    // Continue with creation
  }

  // Handle ignoring a contradiction
  const handleIgnoreContradiction = (index: number) => {
    clearContradiction(index)
  }

  // Handle intentional contradiction (adds exemption and clears)
  const handleIntentionalContradiction = async (contradiction: Contradiction, index: number) => {
    await addExemption(contradiction.entryName, contradiction.entryType)
    clearContradiction(index)
    showToast('已记录为有意为之')
  }

  // Handle fixing world entry (switch to world tab)
  const handleFixWorldEntry = () => {
    onSwitchToWorldTab?.()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-900">
      {/* Toast notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-stone-800 text-white text-sm rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-stone-400 dark:text-stone-500">
            <div className="text-center">
              <p className="text-lg mb-1">AI 聊天</p>
              <p className="text-sm text-stone-300 dark:text-stone-600">配置 AI 设置后开始对话</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg: ChatMessage) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onInsertDraft={handleInsertDraft}
              />
            ))}

            {/* Render suggestions after AI messages */}
            {visibleSuggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-stone-400 dark:text-stone-500 mb-2">
                  💡 AI 建议
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

            {/* Render consistency warnings after AI messages */}
            {contradictions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-stone-400 dark:text-stone-500 mb-2">
                  ⚠️ 矛盾检测
                </div>
                {isCheckingConsistency && (
                  <div className="flex items-center gap-2 text-stone-400 text-sm mb-2">
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
              <div className="flex justify-start mb-2">
                <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-stone-200 dark:border-stone-800 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={loading}
            rows={1}
            className="flex-1 resize-none rounded-[10px] border border-stone-300 dark:border-stone-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-stone-800 dark:text-white disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-[10px] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Entry Dialog */}
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

      {/* Duplicate Entry Dialog */}
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
