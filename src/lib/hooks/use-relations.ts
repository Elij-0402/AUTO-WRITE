'use client'

import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { metaDb } from '../db/meta-db'
import type { Relation, RelationCategory } from '../types'
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
    await addRelationQuery(db, projectId, sourceEntryId, targetEntryId, category, description, sourceToTargetLabel)
    await updateProjectTimestamp()
  }, [db, projectId, updateProjectTimestamp])

  const deleteRelation = useCallback(async (id: string): Promise<void> => {
    await deleteRelationQuery(db, id)
    await updateProjectTimestamp()
  }, [db, updateProjectTimestamp])

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
