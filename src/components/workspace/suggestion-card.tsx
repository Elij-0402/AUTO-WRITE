'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WorldEntryType } from '@/lib/types'

const TYPE_LABELS: Record<WorldEntryType, string> = {
  character: '角色',
  faction: '势力',
  location: '地点',
  rule: '规则',
  secret: '秘密',
  event: '事件',
  timeline: '时间线',
}

const TYPE_VARIANT: Record<WorldEntryType, 'amber' | 'jade' | 'violet' | 'secondary'> = {
  character: 'amber',
  faction: 'jade',
  location: 'jade',
  rule: 'violet',
  secret: 'violet',
  event: 'amber',
  timeline: 'secondary',
}

export interface RelationshipSuggestionCardProps {
  entry1Name: string
  entry2Name: string
  relationshipType: string
  bidirectionalDescription: string
  sourceLabel?: string
  onAdopt: () => void
  onDismiss: () => void
}

export function RelationshipSuggestionCard({
  entry1Name,
  entry2Name,
  relationshipType,
  bidirectionalDescription,
  sourceLabel,
  onAdopt,
  onDismiss,
}: RelationshipSuggestionCardProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss()
  }

  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-card)] surface-2 film-edge p-3 pl-4 animate-fade-up',
        dismissed && 'opacity-40'
      )}
    >
      <div
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[hsl(var(--accent-violet))]/70"
      />
      <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent-violet))]/85">
        <Sparkles className="w-3 h-3" />
        <span>关联建议</span>
        <button
          onClick={handleDismiss}
          disabled={dismissed}
          className="ml-auto p-0.5 rounded hover:bg-[hsl(var(--surface-3))] text-muted-foreground/60 hover:text-foreground"
          aria-label="驳回"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center flex-wrap gap-2 text-[13px] mb-2">
        <span className="font-medium text-foreground">{entry1Name}</span>
        <Badge variant="violet">{relationshipType}</Badge>
        <span className="font-medium text-foreground">{entry2Name}</span>
      </div>
      {sourceLabel ? (
        <p className="mb-2 text-[11px] text-muted-foreground">{sourceLabel}</p>
      ) : null}
      <p className="text-[12.5px] leading-[1.7] text-muted-foreground mb-2.5">
        {bidirectionalDescription}
      </p>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="subtle" onClick={handleDismiss} disabled={dismissed}>
          暂不
        </Button>
        <Button size="sm" onClick={onAdopt} disabled={dismissed}>
          采纳
        </Button>
      </div>
    </div>
  )
}

export interface NewEntrySuggestionCardProps {
  entryType: WorldEntryType
  suggestedName: string
  description: string
  sourceLabel?: string
  onAdopt: () => void
  onDismiss: () => void
}

export function NewEntrySuggestionCard({
  entryType,
  suggestedName,
  description,
  sourceLabel,
  onAdopt,
  onDismiss,
}: NewEntrySuggestionCardProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss()
  }

  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-card)] surface-2 film-edge p-3 pl-4 animate-fade-up',
        dismissed && 'opacity-40'
      )}
    >
      <div
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[hsl(var(--accent-violet))]/70"
      />
      <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent-violet))]/85">
        <Sparkles className="w-3 h-3" />
        <span>新条目建议</span>
        <button
          onClick={handleDismiss}
          disabled={dismissed}
          className="ml-auto p-0.5 rounded hover:bg-[hsl(var(--surface-3))] text-muted-foreground/60 hover:text-foreground"
          aria-label="驳回"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={TYPE_VARIANT[entryType]}>{TYPE_LABELS[entryType]}</Badge>
        <span className="font-medium text-[13px] text-foreground">{suggestedName}</span>
      </div>
      {sourceLabel ? (
        <p className="mb-2 text-[11px] text-muted-foreground">{sourceLabel}</p>
      ) : null}
      <p className="text-[12.5px] leading-[1.7] text-muted-foreground mb-2.5">
        {description}
      </p>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="subtle" onClick={handleDismiss} disabled={dismissed}>
          暂不
        </Button>
        <Button size="sm" onClick={onAdopt} disabled={dismissed}>
          创建条目
        </Button>
      </div>
    </div>
  )
}

export interface Suggestion {
  id: string
  type: 'relationship' | 'newEntry'
  entry1Name?: string
  entry2Name?: string
  relationshipType?: string
  bidirectionalDescription?: string
  entryType?: WorldEntryType
  suggestedName?: string
  description?: string
}

export interface SuggestionCardProps {
  suggestion: Suggestion
  onAdopt: (suggestion: Suggestion) => void
  onDismiss: (suggestionId: string) => void
}

export function SuggestionCard({ suggestion, onAdopt, onDismiss }: SuggestionCardProps) {
  if (suggestion.type === 'relationship') {
    return (
      <RelationshipSuggestionCard
        entry1Name={suggestion.entry1Name!}
        entry2Name={suggestion.entry2Name!}
        relationshipType={suggestion.relationshipType!}
        bidirectionalDescription={suggestion.bidirectionalDescription!}
        onAdopt={() => onAdopt(suggestion)}
        onDismiss={() => onDismiss(suggestion.id)}
      />
    )
  }

  return (
    <NewEntrySuggestionCard
      entryType={suggestion.entryType!}
      suggestedName={suggestion.suggestedName!}
      description={suggestion.description!}
      onAdopt={() => onAdopt(suggestion)}
      onDismiss={() => onDismiss(suggestion.id)}
    />
  )
}
