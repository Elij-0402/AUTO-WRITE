'use client'

import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { metaDb } from '../db/meta-db'
import { enqueueChange } from '../sync/sync-queue'
import { createClient } from '../supabase/client'
import type { WorldEntryType } from '../types'
import {
  getWorldEntries as getWorldEntriesQuery,
  addWorldEntry as addWorldEntryQuery,
  renameWorldEntry as renameWorldEntryQuery,
  updateWorldEntryFields as updateWorldEntryFieldsQuery,
  softDeleteWorldEntry as softDeleteWorldEntryQuery,
  searchWorldEntries as searchWorldEntriesQuery,
  getWorldEntryById as getWorldEntryByIdQuery,
} from '../db/world-entry-queries'

const WORLD_ENTRY_GROUP_TYPES = [
  'character',
  'faction',
  'location',
  'rule',
  'secret',
  'event',
  'timeline',
] as const satisfies readonly WorldEntryType[]

const EMPTY_ENTRIES_BY_TYPE = {
  character: [],
  faction: [],
  location: [],
  rule: [],
  secret: [],
  event: [],
  timeline: [],
}

/**
 * Reactive hook for world bible entry CRUD operations.
 * Per D-09: entries displayed in sidebar grouped by type.
 * Per D-10: sorted alphabetically by name (pinyin for Chinese).
 * Per D-17: soft delete with cascade to relations.
 * Per D-18: auto-save with debounce (via useAutoSave in edit form).
 */
export function useWorldEntries(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  // Reactive query: all non-deleted world entries sorted alphabetically
  const entries = useLiveQuery(
    () => getWorldEntriesQuery(db, projectId),
    [db, projectId],
    [] // default to empty array while loading
  )

  // Computed: group entries by type for D-09 sidebar sections
  const entriesByType = useMemo(() => {
    if (!entries) {
      return EMPTY_ENTRIES_BY_TYPE
    }

    return Object.fromEntries(
      WORLD_ENTRY_GROUP_TYPES.map(type => [
        type,
        entries.filter(entry => entry.type === type),
      ])
    ) as typeof EMPTY_ENTRIES_BY_TYPE
  }, [entries])

  // Helper to get userId for sync
  const getUserId = useCallback(async (): Promise<string | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }, [])

  const updateProjectTimestamp = useCallback(async () => {
    await metaDb.projectIndex.update(projectId, { updatedAt: new Date() })
  }, [projectId])

  const addEntry = useCallback(async (type: WorldEntryType, name?: string): Promise<string> => {
    const id = await addWorldEntryQuery(db, projectId, type, name)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const entry = await db.worldEntries.get(id)
      if (entry) {
        await enqueueChange({
          table: 'worldEntries',
          operation: 'create',
          data: { ...entry, projectId } as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }

    return id
  }, [db, projectId, updateProjectTimestamp, getUserId])

  const renameEntry = useCallback(async (id: string, name: string): Promise<void> => {
    await renameWorldEntryQuery(db, id, name)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const entry = await db.worldEntries.get(id)
      if (entry) {
        await enqueueChange({
          table: 'worldEntries',
          operation: 'update',
          data: { ...entry, projectId } as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }
  }, [db, projectId, updateProjectTimestamp, getUserId])

  const updateEntryFields = useCallback(async (
    id: string,
    fields: Parameters<typeof updateWorldEntryFieldsQuery>[2]
  ): Promise<void> => {
    await updateWorldEntryFieldsQuery(db, id, fields)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const entry = await db.worldEntries.get(id)
      if (entry) {
        await enqueueChange({
          table: 'worldEntries',
          operation: 'update',
          data: { ...entry, projectId } as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }
  }, [db, projectId, updateProjectTimestamp, getUserId])

  const softDeleteEntry = useCallback(async (id: string): Promise<void> => {
    await softDeleteWorldEntryQuery(db, id)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      await enqueueChange({
        table: 'worldEntries',
        operation: 'delete',
        data: { id } as Record<string, unknown>,
        localUpdatedAt: Date.now(),
        userId,
      })
    }
  }, [db, updateProjectTimestamp, getUserId])

  const searchEntries = useCallback(async (query: string, type?: WorldEntryType): Promise<import('../types').WorldEntry[]> => {
    return searchWorldEntriesQuery(db, projectId, query, type)
  }, [db, projectId])

  const getEntryById = useCallback(async (id: string): Promise<import('../types').WorldEntry | undefined> => {
    return getWorldEntryByIdQuery(db, id)
  }, [db])

  return {
    entries,
    entriesByType,
    loading: entries === undefined,
    addEntry,
    renameEntry,
    updateEntryFields,
    softDeleteEntry,
    searchEntries,
    getEntryById,
  }
}
