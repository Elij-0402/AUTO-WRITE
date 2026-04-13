'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { updateChapterContent as updateChapterContentQuery } from '../db/chapter-queries'
import { useAutoSave } from './use-autosave'

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
    // Detect chapter switch
    if (chapterId !== prevChapterIdRef.current) {
      // Chapter changed - update content
      if (chapter?.content !== undefined) {
        setContent(chapter.content)
      } else {
        setContent(null)
      }
      prevChapterIdRef.current = chapterId
    }
  }, [chapterId, chapter?.content])
  
  // Update function that will be called by autosave
  // Note: This updates IndexedDB directly, which triggers the chapter query
  // But we DON'T sync back to content state unless chapterId changes
  const updateContent = useCallback(async (newContent: object) => {
    if (!chapterId) return
    await updateChapterContentQuery(db, chapterId, newContent)
  }, [db, chapterId])
  
  // Autosave hook with 500ms debounce
  // Wrap updateContent to capture current content from closure
  const { isSaving, lastSaved } = useAutoSave(
    async () => {
      if (content !== null) {
        await updateContent(content)
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
