import { nanoid } from 'nanoid'
import type { CreateStoryTrackerInput, StoryTracker, StoryTrackerKind } from '../types'
import { createProjectDB } from './project-db'

const UNRESOLVED_TRACKER_KINDS = new Set<StoryTrackerKind>([
  'open_promise',
  'foreshadow',
  'consequence',
])

const UNRESOLVED_STATE_KINDS = new Set<StoryTrackerKind>([
  'character_state',
  'relationship_state',
  'world_state',
])

export interface StoryTrackerOverviewCounts {
  unresolvedTrackers: number
  unresolvedStates: number
}

export async function createStoryTracker(
  projectId: string,
  input: CreateStoryTrackerInput
): Promise<StoryTracker> {
  const now = Date.now()
  const tracker: StoryTracker = {
    id: nanoid(),
    projectId,
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    subjectEntryIds: input.subjectEntryIds,
    relatedEntryIds: input.relatedEntryIds,
    linkedTimelineEntryId: input.linkedTimelineEntryId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await createProjectDB(projectId).storyTrackers.add(tracker)
  return tracker
}

export async function listStoryTrackersByKind(
  projectId: string,
  kind: StoryTrackerKind
): Promise<StoryTracker[]> {
  const rows = await createProjectDB(projectId).storyTrackers
    .where('[projectId+kind]')
    .equals([projectId, kind])
    .filter(row => row.deletedAt === null)
    .toArray()

  return rows.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function listStoryTrackers(projectId: string): Promise<StoryTracker[]> {
  const rows = await createProjectDB(projectId).storyTrackers
    .where('projectId')
    .equals(projectId)
    .filter(row => row.deletedAt === null)
    .toArray()

  return rows.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function resolveStoryTracker(projectId: string, trackerId: string): Promise<void> {
  const now = Date.now()
  await createProjectDB(projectId).storyTrackers.update(trackerId, {
    status: 'resolved',
    updatedAt: now,
    resolvedAt: now,
  })
}

export async function getUnresolvedStoryTrackerCounts(
  projectId: string
): Promise<StoryTrackerOverviewCounts> {
  const rows = await createProjectDB(projectId).storyTrackers
    .where('[projectId+status]')
    .equals([projectId, 'active'])
    .filter(row => row.deletedAt === null)
    .toArray()

  return rows.reduce<StoryTrackerOverviewCounts>(
    (counts, row) => {
      if (UNRESOLVED_TRACKER_KINDS.has(row.kind)) {
        counts.unresolvedTrackers += 1
      }
      if (UNRESOLVED_STATE_KINDS.has(row.kind)) {
        counts.unresolvedStates += 1
      }
      return counts
    },
    { unresolvedTrackers: 0, unresolvedStates: 0 }
  )
}
