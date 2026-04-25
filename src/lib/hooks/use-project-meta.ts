'use client'

import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaDb } from '../db/meta-db'
import { createProjectDB } from '../db/project-db'

export function useProjectMeta(projectId: string) {
  const projectDb = useMemo(() => createProjectDB(projectId), [projectId])

  const metaProject = useLiveQuery(
    async () => (await metaDb.projectIndex.get(projectId)) ?? null,
    [projectId]
  )

  const mirroredProject = useLiveQuery(
    async () => (await projectDb.projects.get(projectId)) ?? null,
    [projectDb, projectId]
  )

  useEffect(() => {
    if (metaProject && !mirroredProject) {
      void projectDb.projects.put(metaProject)
    }
  }, [metaProject, mirroredProject, projectDb])

  useEffect(() => {
    if (!metaProject && mirroredProject) {
      void metaDb.projectIndex.put(mirroredProject)
    }
  }, [metaProject, mirroredProject])

  return {
    project: metaProject ?? mirroredProject ?? null,
    loading: metaProject === undefined || mirroredProject === undefined,
  }
}
