'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { updateChapterContent as updateChapterContentQuery, computeWordCount } from '../db/chapter-queries'
import { createRevision, AUTOSNAPSHOT_INTERVAL_MS } from '../db/revisions'
import { useAutoSave } from './use-autosave'
import { updateTodayWordCount } from './use-word-count'

/**
 * Hook for chapter editing with autosave integration.
 * 
 * Provides:
 * - Chapter content from IndexedDB (reactive)
 * - Content update function that triggers autosave
 * - Autosave status (isSaving, lastSaved)
 * - chapterId for detecting chapter switches
 * 
 * Per D-05: autosave status displayed in editor bottom bar.
 * Per EDIT-02: autosave with 500ms debounce.
 */
export function useChapterEditor(projectId: string, chapterId: string | null) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])
  
  const [content, setContent] = useState<object | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Track the previous chapterId to detect chapter switches
  const prevChapterIdRef = useRef<string | null>(null)
  const hydratedChapterIdRef = useRef<string | null>(null)
  // Track previous word count for delta computation (today's word count tracking)
  const prevWordCountRef = useRef<number>(0)
  
  // Get the specific chapter reactively
  const chapter = useLiveQuery(
    async () => {
      if (!chapterId) return null
      return await db.chapters.get(chapterId)
    },
    [db, chapterId],
    null
  )
  
  // Sync content from chapter to local state ONLY when chapterId changes (chapter switch)
  // Don't sync on every content change (e.g., autosave updates) to avoid editor resets
  useEffect(() => {
    const chapterMatchesSelection =
      chapterId !== null &&
      (
        chapter?.id === chapterId ||
        (!!chapter && (chapter as { id?: string }).id === undefined)
      )
    const chapterSwitched = chapterId !== prevChapterIdRef.current
    const chapterLoadedAfterSelection =
      chapterMatchesSelection &&
      chapterId === prevChapterIdRef.current &&
      hydratedChapterIdRef.current !== chapterId &&
      chapter?.content !== undefined

    if (!chapterSwitched && !chapterLoadedAfterSelection) return

    if (chapterMatchesSelection && chapter?.content !== undefined) {
      setContent(chapter.content)
      // Initialize previous word count for delta tracking
      prevWordCountRef.current = chapter.wordCount || 0
    } else {
      setContent(null)
      prevWordCountRef.current = 0
    }
    prevChapterIdRef.current = chapterId
    hydratedChapterIdRef.current = chapterMatchesSelection && chapter?.content !== undefined ? chapterId : null
  }, [chapter, chapterId])
  
  const persistContent = useCallback(async (nextContent: object) => {
    if (!chapterId) return
    await updateChapterContentQuery(db, chapterId, nextContent)
  }, [db, chapterId])

  // Editor changes should update local state immediately; persistence is
  // handled by the debounced autosave effect below.
  const updateContent = useCallback((newContent: object) => {
    if (chapterId && hydratedChapterIdRef.current !== chapterId) {
      return
    }
    setContent(newContent)
  }, [chapterId])
  
  // Autosave hook with 500ms debounce
  // Wrap updateContent to capture current content from closure
  const { isSaving, lastSaved } = useAutoSave(
    async () => {
      if (content !== null) {
        await persistContent(content)
        // Compute delta and update today's word count (positive deltas only)
        const newWordCount = computeWordCount(content)
        const delta = newWordCount - prevWordCountRef.current
        if (delta > 0) {
          await updateTodayWordCount(projectId, delta)
        }
        // Update previous word count for next delta calculation
        prevWordCountRef.current = newWordCount
        // Capture a revision snapshot at most every AUTOSNAPSHOT_INTERVAL_MS.
        if (chapterId) {
          await createRevision(db, {
            projectId,
            chapterId,
            snapshot: content,
            source: 'autosnapshot',
            minIntervalMs: AUTOSNAPSHOT_INTERVAL_MS,
          }).catch(err => console.error('Revision snapshot failed:', err))
        }
      }
    },
    [content],
    500 // 500ms debounce per EDIT-02
  )
  
  // Mark loading state based on chapter query
  useEffect(() => {
    setIsLoading(chapter === undefined)
  }, [chapter])
  
  return {
    content,
    isLoading,
    updateContent,
    isSaving,
    lastSaved,
  }
}
