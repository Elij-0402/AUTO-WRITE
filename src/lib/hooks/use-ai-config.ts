import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import type { AIProvider } from '../db/project-db'

export type { AIProvider } from '../db/project-db'

export interface AIConfig {
  id: 'config'
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model?: string
  availableModels?: string[]
}

const DEFAULT_CONFIG: AIConfig = {
  id: 'config',
  provider: 'anthropic',
  apiKey: '',
  baseUrl: '',
  model: 'claude-sonnet-4-5',
  availableModels: []
}

export function useAIConfig(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const liveConfig = useLiveQuery(
    () => db.table('aiConfig').get('config') as Promise<AIConfig | undefined>,
    [db]
  )

  const config: AIConfig = useMemo(
    () =>
      liveConfig
        ? { ...DEFAULT_CONFIG, ...liveConfig, provider: liveConfig.provider ?? 'openai-compatible' }
        : DEFAULT_CONFIG,
    [liveConfig]
  )
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
