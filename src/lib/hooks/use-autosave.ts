'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Auto-save hook per D-21.
 * - Debounces content changes before save
 * - Saves immediately on chapter switch (component unmount)
 * - Saves immediately on window blur (visibilitychange)
 *
 * @param saveFn The function to call for saving
 * @param deps Dependency array — changes trigger debounced save
 * @param debounceMs Debounce delay in milliseconds (default 500)
 */
export function useAutoSave(
  saveFn: () => Promise<void>,
  deps: unknown[],
  debounceMs: number = 500
): { isSaving: boolean; lastSaved: Date | null } {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveFnRef = useRef(saveFn)
  const isFirstRun = useRef(true)

  // Keep saveFn ref up to date
  useEffect(() => {
    saveFnRef.current = saveFn
  }, [saveFn])

  const doSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await saveFnRef.current()
      setLastSaved(new Date())
    } catch (err) {
      // Per T-01-08: log save failures with actionable message
      console.error('Auto-save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Debounce on deps change — skip the initial mount so we don't write the
  // just-loaded content back to disk before the user has edited anything.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      doSave()
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [deps, debounceMs, doSave])

  // Save on window blur (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Clear any pending debounce and save immediately
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        doSave()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [doSave])

  // Save on unmount (chapter switch)
  useEffect(() => {
    return () => {
      // Clear any pending debounce and save immediately on unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      // We can't use async in cleanup, but we fire and forget
      saveFnRef.current().catch((err) => {
        console.error('Auto-save on unmount failed:', err)
      })
    }
  }, [])

  return { isSaving, lastSaved }
}