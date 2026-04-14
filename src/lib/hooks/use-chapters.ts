'use client'

import { useCallback, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB, type InkForgeProjectDB } from '../db/project-db'
import { metaDb } from '../db/meta-db'
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

  const updateProjectTimestamp = useCallback(async () => {
    await metaDb.projectIndex.update(projectId, { updatedAt: new Date() })
  }, [projectId])

  const addChapter = useCallback(async (title: string): Promise<string> => {
    const id = await addChapterQuery(db, projectId, title)
    await updateProjectTimestamp()
    return id
  }, [db, projectId, updateProjectTimestamp])

  const reorderChapters = useCallback(async (chapterIds: string[]): Promise<void> => {
    await reorderChaptersQuery(db, chapterIds)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

  const renameChapter = useCallback(async (id: string, title: string): Promise<void> => {
    await renameChapterQuery(db, id, title)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

  const softDeleteChapter = useCallback(async (id: string): Promise<void> => {
    await softDeleteChapterQuery(db, id)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

  const duplicateChapter = useCallback(async (id: string): Promise<string> => {
    const newId = await duplicateChapterQuery(db, id)
    await updateProjectTimestamp()
    return newId
  }, [db, updateProjectTimestamp])

  const updateChapterContent = useCallback(async (id: string, content: object): Promise<void> => {
    await updateChapterContentQuery(db, id, content)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

  const updateChapterStatus = useCallback(async (id: string, status: ChapterStatus): Promise<void> => {
    await updateChapterStatusQuery(db, id, status)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

  const updateOutlineFields = useCallback(async (
    id: string,
    fields: { outlineSummary?: string; outlineTargetWordCount?: number | null; outlineStatus?: OutlineStatus }
  ): Promise<void> => {
    await updateOutlineFieldsQuery(db, id, fields)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

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