'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  createStoryTracker,
  getUnresolvedStoryTrackerCounts,
  listStoryTrackers,
  resolveStoryTracker,
  type StoryTrackerOverviewCounts,
} from '../db/story-tracker-queries'
import { createProjectDB } from '../db/project-db'
import type { CreateStoryTrackerInput, StoryTracker } from '../types'

const EMPTY_COUNTS: StoryTrackerOverviewCounts = {
  unresolvedTrackers: 0,
  unresolvedStates: 0,
}

const EMPTY_TRACKERS: StoryTracker[] = []

export function useStoryTrackerCounts(projectId: string): StoryTrackerOverviewCounts {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  return useLiveQuery(
    () => getUnresolvedStoryTrackerCounts(projectId),
    [db, projectId],
    EMPTY_COUNTS
  ) ?? EMPTY_COUNTS
}

export function useStoryTrackers(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const trackers = useLiveQuery(
    () => listStoryTrackers(projectId),
    [db, projectId],
    null
  )

  return {
    trackers: trackers ?? EMPTY_TRACKERS,
    loading: trackers === null,
    create: (input: CreateStoryTrackerInput) => createStoryTracker(projectId, input),
    resolve: (trackerId: string) => resolveStoryTracker(projectId, trackerId),
  }
}
