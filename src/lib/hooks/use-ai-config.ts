import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaDb } from '../db/meta-db'
import type { AIProvider } from '../ai/providers/types'

export type { AIProvider } from '../ai/providers/types'

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

/**
 * useAIConfig — returns the global AI config from meta-db.
 */
export function useAIConfig() {
  const liveConfig = useLiveQuery(
    () => metaDb.aiConfig.get('config') as Promise<AIConfig | undefined>,
    []
  )

  const config: AIConfig = useMemo(
    () =>
      liveConfig
        ? { ...DEFAULT_CONFIG, ...liveConfig, provider: liveConfig.provider ?? 'anthropic' }
        : DEFAULT_CONFIG,
    [liveConfig]
  )
  const loading = liveConfig === undefined

  const saveConfig = useCallback(async (newConfig: Partial<AIConfig>) => {
    const updated = { ...config, ...newConfig, id: 'config' as const }
    await metaDb.aiConfig.put(updated)
    return updated
  }, [config])

  const clearConfig = useCallback(async () => {
    await metaDb.aiConfig.delete('config')
  }, [])

  return { config, loading, saveConfig, clearConfig }
}
