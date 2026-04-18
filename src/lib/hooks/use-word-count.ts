'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { metaDb } from '../db/meta-db'
import { getChapters } from '../db/chapter-queries'

/**
 * Get total word count for all chapters in a project.
 * Recalculates when chapters change via reactive Dexie query.
 * Per D-34: total word count displayed in project top bar.
 */
export function useTotalWordCount(projectId: string): number {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const chapters = useLiveQuery(
    () => getChapters(db),
    [db],
    [] // default to empty array while loading
  )

  if (!chapters || chapters.length === 0) {
    return 0
  }

  return chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
}

/**
 * Get today's writing word count.
 * Reads from project metadata (todayWordCount field).
 * Per D-35, D-36: tracks incremental changes per natural day.
 * When chapter content changes, the caller should call updateTodayWordCount.
 */
export function useTodayWordCount(projectId: string): number {
  const project = useLiveQuery(
    () => metaDb.projectIndex.get(projectId),
    [projectId]
  )

  if (!project) {
    return 0
  }

  // Check if we need to reset for a new day
  const today = new Date().toISOString().split('T')[0]
  if (project.todayDate !== today) {
    // New day - this will be handled by the component that calls updateTodayWordCount
    return 0
  }

  return project.todayWordCount
}

/**
 * Update today's word count in project metadata.
 * Call this when chapter content changes to track daily writing progress.
 * Per D-35, D-36: increments todayWordCount by delta, resets if new day.
 */
export async function updateTodayWordCount(
  projectId: string,
  delta: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const project = await metaDb.projectIndex.get(projectId)

  if (!project) {
    return
  }

  if (project.todayDate !== today) {
    // New day - reset to delta
    await metaDb.projectIndex.update(projectId, {
      todayWordCount: Math.max(0, delta),
      todayDate: today,
      updatedAt: new Date(),
    })
  } else {
    // Same day - increment
    await metaDb.projectIndex.update(projectId, {
      todayWordCount: Math.max(0, project.todayWordCount + delta),
      updatedAt: new Date(),
    })
  }
}
