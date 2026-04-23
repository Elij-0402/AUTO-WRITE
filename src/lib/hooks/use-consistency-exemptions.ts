'use client'

import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB, type ConsistencyExemption } from '../db/project-db'

/**
 * Hook for managing consistency exemptions.
 * These allow users to suppress specific contradiction warnings.
 */
export function useConsistencyExemptions(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  // Reactive query: all exemptions for this project
  const exemptions = useLiveQuery(
    () => db.consistencyExemptions.where('projectId').equals(projectId).toArray(),
    [db, projectId],
    [] as ConsistencyExemption[]
  )

  /**
   * Add a new exemption for a contradiction.
   * @param entryId - The world entry ID that the contradiction relates to
   * @param type - Type or description of the contradiction
   * @param note - Optional note explaining why this was exempted
   */
  const addExemption = useCallback(async (entryId: string, type: string, note?: string): Promise<string> => {
    // Create exemption key by combining entryId and type
    const exemptionKey = `${entryId}:${type}`
    const id = crypto.randomUUID()

    const exemption: ConsistencyExemption = {
      id,
      projectId,
      exemptionKey,
      createdAt: Date.now(),
      note
    }

    await db.consistencyExemptions.add(exemption)
    return id
  }, [db, projectId])

  /**
   * Remove an exemption by ID.
   */
  const removeExemption = useCallback(async (id: string): Promise<void> => {
    await db.consistencyExemptions.delete(id)
  }, [db])

  /**
   * Revoke an exemption by entryName + entryType.
   * Deletes the exemption record AND sets exempted=false on all matching contradiction rows.
   */
  const revokeExemption = useCallback(async (entryName: string, entryType: string): Promise<void> => {
    const exemptionKey = `${entryName}:${entryType}`

    // Find the exemption record to get its id
    const exemption = await db.consistencyExemptions
      .where('projectId')
      .equals(projectId)
      .toArray()
      .then(rows => rows.find(e => e.exemptionKey === exemptionKey))

    if (exemption) {
      await db.consistencyExemptions.delete(exemption.id)
    }

    // Unmark all matching contradiction rows concurrently
    const rows = await db.contradictions
      .where('[projectId+entryName]')
      .equals([projectId, entryName])
      .toArray()

    const matchingRows = rows.filter(row => row.entryType === entryType && row.exempted)
    await Promise.all(matchingRows.map(row => db.contradictions.update(row.id, { exempted: false })))
  }, [db, projectId])

  /**
   * Check if a specific contradiction is exempted.
   */
  const isExempted = useCallback((entryId: string, type: string): boolean => {
    if (!exemptions) return false
    const exemptionKey = `${entryId}:${type}`
    return exemptions.some(e => e.exemptionKey === exemptionKey)
  }, [exemptions])

  return {
    exemptions,
    addExemption,
    removeExemption,
    revokeExemption,
    isExempted,
    loading: exemptions === undefined
  }
}