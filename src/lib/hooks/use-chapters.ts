'use client'

import { useCallback, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB, type InkForgeProjectDB } from '../db/project-db'
import { metaDb } from '../db/meta-db'
import { enqueueChange } from '../sync/sync-queue'
import { createClient } from '../supabase/client'
import type { ChapterStatus, OutlineStatus } from '../types'
import {
  getChapters,
  addChapter as addChapterQuery,
  reorderChapters as reorderChaptersQuery,
  renameChapter as renameChapterQuery,
  softDeleteChapter as softDeleteChapterQuery,
  duplicateChapter as duplicateChapterQuery,
  updateChapterContent as updateChapterContentQuery,
  updateChapterStatus as updateChapterStatusQuery,
  updateOutlineFields as updateOutlineFieldsQuery,
} from '../db/chapter-queries'

/**
 * Hook for chapter CRUD operations with reactive Dexie queries.
 * Per D-09: chapter sidebar always visible alongside editor.
 * Per D-12: drag-reorder updates order fields atomically.
 * Per D-14: auto-save through useAutoSave hook.
 * Per D-26: NanoID for entity IDs.
 */
export function useChapters(projectId: string) {
  // Use useMemo to avoid recreating the DB instance on every render
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  // Reactive query: all non-deleted chapters sorted by order
  const chapters = useLiveQuery(
    () => getChapters(db),
    [db],
    [] // default to empty array while loading
  )

  // Helper to get userId for sync
  const getUserId = useCallback(async (): Promise<string | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }, [])

  const updateProjectTimestamp = useCallback(async () => {
    await metaDb.projectIndex.update(projectId, { updatedAt: new Date() })
  }, [projectId])

  const addChapter = useCallback(async (title: string): Promise<string> => {
    const id = await addChapterQuery(db, projectId, title)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const chapter = await db.chapters.get(id)
      if (chapter) {
        await enqueueChange({
          table: 'chapters',
          operation: 'create',
          data: chapter as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }

    return id
  }, [db, projectId, updateProjectTimestamp, getUserId])

  const reorderChapters = useCallback(async (chapterIds: string[]): Promise<void> => {
    await reorderChaptersQuery(db, chapterIds)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

  const renameChapter = useCallback(async (id: string, title: string): Promise<void> => {
    await renameChapterQuery(db, id, title)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const chapter = await db.chapters.get(id)
      if (chapter) {
        await enqueueChange({
          table: 'chapters',
          operation: 'update',
          data: chapter as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }
  }, [db, updateProjectTimestamp, getUserId])

  const softDeleteChapter = useCallback(async (id: string): Promise<void> => {
    await softDeleteChapterQuery(db, id)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      await enqueueChange({
        table: 'chapters',
        operation: 'delete',
        data: { id } as Record<string, unknown>,
        localUpdatedAt: Date.now(),
        userId,
      })
    }
  }, [db, updateProjectTimestamp, getUserId])

  const duplicateChapter = useCallback(async (id: string): Promise<string> => {
    const newId = await duplicateChapterQuery(db, id)
    await updateProjectTimestamp()

    // Queue new chapter for cloud sync
    const userId = await getUserId()
    if (userId) {
      const chapter = await db.chapters.get(newId)
      if (chapter) {
        await enqueueChange({
          table: 'chapters',
          operation: 'create',
          data: chapter as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }

    return newId
  }, [db, updateProjectTimestamp, getUserId])

  const updateChapterContent = useCallback(async (id: string, content: object): Promise<void> => {
    await updateChapterContentQuery(db, id, content)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const chapter = await db.chapters.get(id)
      if (chapter) {
        await enqueueChange({
          table: 'chapters',
          operation: 'update',
          data: chapter as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }
  }, [db, updateProjectTimestamp, getUserId])

  const updateChapterStatus = useCallback(async (id: string, status: ChapterStatus): Promise<void> => {
    await updateChapterStatusQuery(db, id, status)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const chapter = await db.chapters.get(id)
      if (chapter) {
        await enqueueChange({
          table: 'chapters',
          operation: 'update',
          data: chapter as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }
  }, [db, updateProjectTimestamp, getUserId])

  const updateOutlineFields = useCallback(async (
    id: string,
    fields: { outlineSummary?: string; outlineTargetWordCount?: number | null; outlineStatus?: OutlineStatus }
  ): Promise<void> => {
    await updateOutlineFieldsQuery(db, id, fields)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const chapter = await db.chapters.get(id)
      if (chapter) {
        await enqueueChange({
          table: 'chapters',
          operation: 'update',
          data: chapter as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }
  }, [db, updateProjectTimestamp, getUserId])

  return {
    db,
    chapters,
    loading: chapters === undefined,
    addChapter,
    reorderChapters,
    renameChapter,
    softDeleteChapter,
    duplicateChapter,
    updateChapterContent,
    updateChapterStatus,
    updateOutlineFields,
  }
}
