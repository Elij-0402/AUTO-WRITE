'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import type { Relation } from '../types'

/** Returns every non-deleted relation in the project — used by the analysis panel. */
export function useAllRelations(projectId: string): Relation[] {
  const db = useMemo(() => createProjectDB(projectId), [projectId])
  const relations = useLiveQuery(
    () => db.relations.filter(r => !r.deletedAt).toArray(),
    [db],
    [] as Relation[]
  )
  return relations ?? []
}
