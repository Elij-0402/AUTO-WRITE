export type StoryTrackerKind =
  | 'character_state'
  | 'relationship_state'
  | 'world_state'
  | 'open_promise'
  | 'foreshadow'
  | 'consequence'

export type StoryTrackerStatus = 'active' | 'resolved' | 'archived'

export interface StoryTracker {
  id: string
  projectId: string
  kind: StoryTrackerKind
  title: string
  summary: string
  subjectEntryIds: string[]
  relatedEntryIds: string[]
  linkedTimelineEntryId?: string
  status: StoryTrackerStatus
  createdAt: number
  updatedAt: number
  resolvedAt?: number
  deletedAt: number | null
}

export interface CreateStoryTrackerInput {
  kind: StoryTrackerKind
  title: string
  summary: string
  subjectEntryIds: string[]
  relatedEntryIds: string[]
  linkedTimelineEntryId?: string
}
