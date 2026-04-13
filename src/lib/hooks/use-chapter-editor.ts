'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
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
 * 
 * Per D-05: autosave status displayed in editor bottom bar.
 * Per EDIT-02: autosave with 500ms debounce.
 */
export function useChapterEditor(projectId: string, chapterId: string | null) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])
  
  const [content, setContent] = useState<object | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get the specific chapter reactively
  const chapter = useLiveQuery(
    async () => {
      if (!chapterId) return null
      return await db.chapters.get(chapterId)
    },
    [db, chapterId],
    null
  )
  
  // Sync content from chapter to local state when chapter changes
  useEffect(() => {
    if (chapter?.content !== undefined) {
      setContent(chapter.content)
    } else {
      setContent(null)
    }
  }, [chapter?.content])
  
  // Update function that will be called by autosave
  const updateContent = useCallback(async (newContent: object) => {
    if (!chapterId) return
    await updateChapterContentQuery(db, chapterId, newContent)
  }, [db, chapterId])
  
  // Autosave hook with 500ms debounce
  const { isSaving, lastSaved } = useAutoSave(
    updateContent,
    [content], // Trigger on content change
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
