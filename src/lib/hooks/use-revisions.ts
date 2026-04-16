'use client'

import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import {
  createRevision,
  deleteRevision,
  labelRevision,
  type Revision,
} from '../db/revisions'

export type { Revision }

export function useRevisions(projectId: string, chapterId: string | null) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const revisions = useLiveQuery(
    async () => {
      if (!chapterId) return []
      const rows = await db.revisions.where({ chapterId }).sortBy('createdAt')
      return rows.reverse()
    },
    [db, chapterId],
    []
  )

  const snapshot = useCallback(
    async (content: object, source: Revision['source'] = 'manual', label?: string) => {
      if (!chapterId) return null
      return createRevision(db, {
        projectId,
        chapterId,
        snapshot: content,
        source,
        label,
      })
    },
    [db, projectId, chapterId]
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteRevision(db, id)
    },
    [db]
  )

  const rename = useCallback(
    async (id: string, label: string) => {
      await labelRevision(db, id, label)
    },
    [db]
  )

  return { revisions: revisions ?? [], snapshot, remove, rename }
}
