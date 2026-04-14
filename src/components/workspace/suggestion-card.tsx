'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { WorldEntryType } from '@/lib/types'

/**
 * Type badge colors per UI-SPEC:
 * - character = blue
 * - location = green
 * - rule = purple
 * - timeline = amber
 */
const TYPE_BADGE_COLORS: Record<WorldEntryType, { bg: string; text: string; border: string }> = {
  character: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-l-blue-500'
  },
  location: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-l-green-500'
  },
  rule: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-l-purple-500'
  },
  timeline: {
    bg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-l-amber-500'
  }
}

const TYPE_LABELS: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间线'
}

/**
 * Relationship suggestion card for displaying relationship suggestions in chat.
 * Per D-13, D-23: Includes bidirectional description.
 * Per D-09: Auto-create relationship on adopt.
 */
export interface RelationshipSuggestionCardProps {
  entry1Name: string
  entry2Name: string
  relationshipType: string
  /** D-13, D-23: Bidirectional description */
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
    <div
      className={`
        border border-l-4 border-l-blue-500 rounded-lg p-3 
        bg-zinc-50 dark:bg-zinc-800
        ${dismissed ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* Header with entry names */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{entry1Name}</span>
        <span className="text-zinc-400">—</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{entry2Name}</span>
      </div>

      {/* Relationship type badge */}
      <div className="mb-2">
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">
          {relationshipType}
        </span>
      </div>

      {/* Bidirectional description per D-13, D-23 */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
        {bidirectionalDescription}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={onAdopt}
          disabled={dismissed}
        >
          采纳
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDismiss}
          disabled={dismissed}
        >
          暂不
        </Button>
      </div>
    </div>
  )
}

/**
 * New entry suggestion card for suggesting new world bible entries.
 * Per D-10: Opens pre-filled entry form on adopt.
 * Per D-14: AI infers entry type, user confirms in form.
 * Per D-18-21: Type-specific pre-fill fields.
 */
export interface NewEntrySuggestionCardProps {
  entryType: WorldEntryType
  suggestedName: string
  /** AI-extracted preview description */
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
  
  const colors = TYPE_BADGE_COLORS[entryType]

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss()
  }

  return (
    <div
      className={`
        border border-l-4 rounded-lg p-3 
        bg-zinc-50 dark:bg-zinc-800
        ${colors.border}
        ${dismissed ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* Header with type badge and name */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
          {TYPE_LABELS[entryType]}
        </span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{suggestedName}</span>
      </div>

      {/* Description preview */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
        {description}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={onAdopt}
          disabled={dismissed}
        >
          创建条目
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDismiss}
          disabled={dismissed}
        >
          暂不
        </Button>
      </div>
    </div>
  )
}

/**
 * Unified suggestion card that renders either relationship or new entry card.
 * Per D-12: Maximum 3 suggestions per AI response.
 * Per D-17: Dismissed suggestions won't appear again in conversation.
 */
export interface Suggestion {
  id: string
  type: 'relationship' | 'newEntry'
  // Relationship fields
  entry1Name?: string
  entry2Name?: string
  relationshipType?: string
  bidirectionalDescription?: string
  // New entry fields
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
