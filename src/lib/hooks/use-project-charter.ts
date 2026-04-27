'use client'

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  getProjectCharterSnapshot,
  saveProjectCharter,
} from '../db/project-charter-queries'
import type { ProjectCharter, ProjectCharterUpdate } from '../types'

export function useProjectCharter(projectId: string) {
  const charter = useLiveQuery(
    async (): Promise<ProjectCharter> => getProjectCharterSnapshot(projectId),
    [projectId]
  )

  const save = useCallback(
    async (updates: ProjectCharterUpdate): Promise<ProjectCharter> => {
      return saveProjectCharter(projectId, updates)
    },
    [projectId]
  )

  return {
    charter: charter ?? null,
    loading: charter === undefined,
    save,
  }
}
