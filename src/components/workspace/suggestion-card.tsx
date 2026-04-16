'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WorldEntryType } from '@/lib/types'

const TYPE_LABELS: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间线'
}

export interface RelationshipSuggestionCardProps {
  entry1Name: string
  entry2Name: string
  relationshipType: string
  bidirectionalDescription: string
  onAdopt: () => void
  onDismiss: () => void
}

export function RelationshipSuggestionCard({
  entry1Name,
  entry2Name,
  relationshipType,
  bidirectionalDescription,
  onAdopt,
  onDismiss
}: RelationshipSuggestionCardProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss()
  }

  return (
    <Card className={cn('shadow-none', dismissed && 'opacity-50')}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{entry1Name}</span>
          <span className="text-muted-foreground">—</span>
          <span className="font-semibold">{entry2Name}</span>
        </div>

        <Badge variant="secondary" className="text-[11px]">
          {relationshipType}
        </Badge>

        <p className="text-sm text-muted-foreground">
          {bidirectionalDescription}
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={onAdopt}
            disabled={dismissed}
          >
            采纳
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={dismissed}
          >
            暂不
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export interface NewEntrySuggestionCardProps {
  entryType: WorldEntryType
  suggestedName: string
  description: string
  onAdopt: () => void
  onDismiss: () => void
}

export function NewEntrySuggestionCard({
  entryType,
  suggestedName,
  description,
  onAdopt,
  onDismiss
}: NewEntrySuggestionCardProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss()
  }

  return (
    <Card className={cn('shadow-none', dismissed && 'opacity-50')}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">
            {TYPE_LABELS[entryType]}
          </Badge>
          <span className="font-semibold text-sm">{suggestedName}</span>
        </div>

        <p className="text-sm text-muted-foreground">
          {description}
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={onAdopt}
            disabled={dismissed}
          >
            创建条目
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={dismissed}
          >
            暂不
          </Button>
        </div>
      </CardContent>
    </Card>
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
