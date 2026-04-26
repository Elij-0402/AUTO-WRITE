import type { WorldEntryType } from '@/lib/types'
import type { ChatMessage } from '@/lib/hooks/use-ai-chat'
import type { Suggestion, RelationshipSuggestion, NewEntrySuggestion } from '@/lib/ai/suggestion-parser'

export type { ChatMessage }

export interface MessageBubbleProps {
  message: ChatMessage
  projectId: string
  onInsertDraft: (draftId: string, content: string) => void
}

export type { Suggestion, RelationshipSuggestion, NewEntrySuggestion }

export interface PrefillEntry {
  type: WorldEntryType
  data: {
    name: string
    [key: string]: unknown
  }
  sourceSuggestion: NewEntrySuggestion
}
