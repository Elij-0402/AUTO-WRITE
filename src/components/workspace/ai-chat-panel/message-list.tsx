'use client'

import type { RefObject } from 'react'
import { Feather, ArrowDown, Lightbulb, AlertTriangle, Loader2 } from 'lucide-react'
import type { ChatMessage, PartialContradiction } from '@/lib/hooks/use-ai-chat'
import type { Suggestion } from '@/lib/ai/suggestion-parser'
import { MessageBubble } from '../message-bubble'
import { RelationshipSuggestionCard, NewEntrySuggestionCard } from '../suggestion-card'
import { ConsistencyWarningCard } from '../consistency-warning-card'

const STARTER_PROMPTS = [
  { label: '推敲人物动机', prompt: '帮我推敲这章主角的动机是否合理，能否再深一层？' },
  { label: '设计情节冲突', prompt: '基于当前设定，为接下来的情节构思三种可能的冲突走向。' },
  { label: '检查设定一致性', prompt: '对照世界观百科，检查本章是否有与设定冲突的地方。' },
  { label: '优化场景描写', prompt: '这段场景描写略显平淡，请给出更有画面感的改写思路。' }
] as const

interface MessageListProps {
  messages: ChatMessage[]
  loading: boolean
  contradictions: PartialContradiction[]
  isCheckingConsistency: boolean
  projectId: string
  showScrollPill: boolean
  visibleSuggestions: Suggestion[]
  onSendMessage: (text: string) => void
  onInsertDraft: (draftId: string, content: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdoptRelationship: (suggestion: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDismiss: (suggestion: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdoptNewEntry: (suggestion: any) => void
  onIgnoreContradiction: (index: number) => void
  onIntentionalContradiction: (contradiction: PartialContradiction, index: number) => void
  onFixWorldEntry: () => void
  scrollToBottom: (behavior?: ScrollBehavior) => void
  messagesContainerRef: RefObject<HTMLDivElement | null>
  onScroll: () => void
}

export function MessageList({
  messages,
  loading,
  contradictions,
  isCheckingConsistency,
  projectId,
  showScrollPill,
  visibleSuggestions,
  onSendMessage,
  onInsertDraft,
  onAdoptRelationship,
  onDismiss,
  onAdoptNewEntry,
  onIgnoreContradiction,
  onIntentionalContradiction,
  onFixWorldEntry,
  scrollToBottom,
  messagesContainerRef,
  onScroll,
}: MessageListProps) {
  const isEmpty = messages.every(m => !m.content.trim())

  return (
    <div
      ref={messagesContainerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden relative"
    >
      {isEmpty ? (
        <EmptyState onSendMessage={onSendMessage} />
      ) : (
        <div className="px-1 pb-2">
          {messages.map((msg: ChatMessage) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              projectId={projectId}
              onInsertDraft={onInsertDraft}
            />
          ))}

          {visibleSuggestions.length > 0 && (
            <SuggestionsSection
              suggestions={visibleSuggestions}
              onAdoptRelationship={onAdoptRelationship}
              onDismiss={onDismiss}
              onAdoptNewEntry={onAdoptNewEntry}
            />
          )}

          {contradictions.length > 0 && (
            <ContradictionsSection
              contradictions={contradictions}
              isCheckingConsistency={isCheckingConsistency}
              onIgnore={onIgnoreContradiction}
              onIntentional={onIntentionalContradiction}
              onFixWorldEntry={onFixWorldEntry}
            />
          )}

          {loading && <LoadingIndicator />}
        </div>
      )}

      {showScrollPill && (
        <button
          onClick={() => scrollToBottom('smooth')}
        className="sticky bottom-3 left-1/2 ml-[-52px] z-20 inline-flex items-center gap-1 px-2.5 py-1 bg-[hsl(var(--surface-1))] border border-border rounded-full elev-sm text-[12px] text-foreground/80 hover:bg-[hsl(var(--surface-2))] transition-colors animate-fade-up"
          aria-label="跳到最新"
        >
          <ArrowDown className="w-3 h-3 text-primary" />
          <span>跳到最新</span>
        </button>
      )}
    </div>
  )
}

function EmptyState({ onSendMessage }: { onSendMessage: (text: string) => void }) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-[280px] w-full space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Feather className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-[18px] font-semibold text-foreground">墨客</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              与 AI 聊聊你的故事
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {STARTER_PROMPTS.map((starter, i) => (
            <button
              key={starter.label}
              onClick={() => onSendMessage(starter.prompt)}
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
  )
}

function SuggestionsSection({
  suggestions,
  onAdoptRelationship,
  onDismiss,
  onAdoptNewEntry,
}: {
  suggestions: Suggestion[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdoptRelationship: (s: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDismiss: (s: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdoptNewEntry: (s: any) => void
}) {
  return (
    <div className="mx-2 my-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--accent-violet))] px-1">
        <Lightbulb className="w-3.5 h-3.5" />
        <span>墨客建议</span>
      </div>
      {suggestions.map((suggestion, idx) =>
        suggestion.type === 'relationship' ? (
          <RelationshipSuggestionCard
            key={`${suggestion.entry1Name}-${suggestion.entry2Name}-${idx}`}
            entry1Name={suggestion.entry1Name}
            entry2Name={suggestion.entry2Name}
            relationshipType={suggestion.relationshipType}
            bidirectionalDescription={suggestion.bidirectionalDescription}
            onAdopt={() => onAdoptRelationship(suggestion)}
            onDismiss={() => onDismiss(suggestion)}
          />
        ) : (
          <NewEntrySuggestionCard
            key={`${suggestion.suggestedName}-${idx}`}
            entryType={suggestion.entryType}
            suggestedName={suggestion.suggestedName}
            description={suggestion.description}
            onAdopt={() => onAdoptNewEntry(suggestion)}
            onDismiss={() => onDismiss(suggestion)}
          />
        )
      )}
    </div>
  )
}

function ContradictionsSection({
  contradictions,
  isCheckingConsistency,
  onIgnore,
  onIntentional,
  onFixWorldEntry,
}: {
  contradictions: PartialContradiction[]
  isCheckingConsistency: boolean
  onIgnore: (index: number) => void
  onIntentional: (c: PartialContradiction, i: number) => void
  onFixWorldEntry: () => void
}) {
  return (
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
          onIgnore={() => onIgnore(idx)}
          onIntentional={() => onIntentional(contradiction, idx)}
          onFixWorldEntry={onFixWorldEntry}
        />
      ))}
    </div>
  )
}

function LoadingIndicator() {
  return (
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
  )
}
