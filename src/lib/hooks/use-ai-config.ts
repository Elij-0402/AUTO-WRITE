import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'

export interface AIConfig {
  id: 'config'
  apiKey: string
  baseUrl: string
  model?: string
}

const DEFAULT_CONFIG: AIConfig = {
  id: 'config',
  apiKey: '',
  baseUrl: '',
  model: 'gpt-4'
}

export function useAIConfig(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const liveConfig = useLiveQuery(
    () => db.table('aiConfig').get('config') as Promise<AIConfig | undefined>,
    [db]
  )

  const config = liveConfig ?? DEFAULT_CONFIG
  const loading = liveConfig === undefined

  const saveConfig = useCallback(async (newConfig: Partial<AIConfig>) => {
    if (!projectId) return DEFAULT_CONFIG
    const updated = { ...config, ...newConfig, id: 'config' as const }
    await db.table('aiConfig').put(updated)
    return updated
  }, [config, projectId, db])

  const clearConfig = useCallback(async () => {
    if (!projectId) return
    await db.table('aiConfig').delete('config')
  }, [projectId, db])

  return { config, loading, saveConfig, clearConfig }
}
