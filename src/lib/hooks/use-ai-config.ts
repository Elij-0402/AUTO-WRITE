import { useState, useEffect, useCallback } from 'react'
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
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(!!projectId)

  // Load config on mount or projectId change
  useEffect(() => {
    if (!projectId) return

    let cancelled = false
    setLoading(true)
    const db = createProjectDB(projectId)
    db.table('aiConfig').get('config').then(found => {
      if (cancelled) return
      if (found) {
        setConfig(found as AIConfig)
      } else {
        setConfig(DEFAULT_CONFIG)
      }
      setLoading(false)
    }).catch(err => {
      if (cancelled) return
      console.error('Failed to load AI config:', err)
      setConfig(DEFAULT_CONFIG)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [projectId])

  const saveConfig = useCallback(async (newConfig: Partial<AIConfig>) => {
    if (!projectId) return DEFAULT_CONFIG
    const db = createProjectDB(projectId)
    const updated = { ...config, ...newConfig, id: 'config' as const }
    await db.table('aiConfig').put(updated)
    setConfig(updated)
    return updated
  }, [config, projectId])

  const clearConfig = useCallback(async () => {
    if (!projectId) return
    const db = createProjectDB(projectId)
    await db.table('aiConfig').delete('config')
    setConfig(DEFAULT_CONFIG)
  }, [projectId])

  return { config, loading, saveConfig, clearConfig }
}
