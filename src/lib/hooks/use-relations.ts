'use client'

import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { metaDb } from '../db/meta-db'
import { enqueueChange } from '../sync/sync-queue'
import { createClient } from '../supabase/client'
import type { RelationCategory } from '../types'
import {
  getRelationsForEntry as getRelationsForEntryQuery,
  addRelation as addRelationQuery,
  deleteRelation as deleteRelationQuery,
  getRelationCount as getRelationCountQuery,
} from '../db/relation-queries'

/**
 * Reactive hook for world bible relation CRUD operations.
 * Per D-22: bidirectional relations where entry is source OR target.
 * Per D-29: sourceToTargetLabel is directional from source to target.
 * Per D-23: category is 'character_relation' or 'general'.
 */
export function useRelations(projectId: string, entryId?: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  // Reactive query: all non-deleted relations for the entry (bidirectional)
  const relations = useLiveQuery(
    () => entryId ? getRelationsForEntryQuery(db, entryId) : Promise.resolve([]),
    [db, entryId],
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

  const addRelation = useCallback(async (
    sourceEntryId: string,
    targetEntryId: string,
    category: RelationCategory,
    description: string,
    sourceToTargetLabel: string
  ): Promise<void> => {
    const id = await addRelationQuery(db, projectId, sourceEntryId, targetEntryId, category, description, sourceToTargetLabel)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      const relation = await db.relations.get(id)
      if (relation) {
        await enqueueChange({
          table: 'relations',
          operation: 'create',
          data: { ...relation, projectId } as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId,
        })
      }
    }
  }, [db, projectId, updateProjectTimestamp, getUserId])

  const deleteRelation = useCallback(async (id: string): Promise<void> => {
    await deleteRelationQuery(db, id)
    await updateProjectTimestamp()

    // Queue for cloud sync
    const userId = await getUserId()
    if (userId) {
      await enqueueChange({
        table: 'relations',
        operation: 'delete',
        data: { id } as Record<string, unknown>,
        localUpdatedAt: Date.now(),
        userId,
      })
    }
  }, [db, updateProjectTimestamp, getUserId])

  const getRelationCount = useCallback(async (targetEntryId: string): Promise<number> => {
    return getRelationCountQuery(db, targetEntryId)
  }, [db])

  return {
    relations,
    loading: relations === undefined,
    addRelation,
    deleteRelation,
    getRelationCount,
  }
}
