import { useCallback, useMemo, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaDb } from '../db/meta-db'
import { createProjectDB } from '../db/project-db'
import type { AIProvider } from '../db/project-db'
import type { UiExperimentFlags } from '../ai/ui-flags'
import { resolveUiFlags } from '../ai/ui-flags'

export type { AIProvider } from '../db/project-db'
export type { UiExperimentFlags } from '../ai/ui-flags'

export interface AIConfig {
  id: 'config'
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model?: string
  availableModels?: string[]
  uiFlags?: UiExperimentFlags
}

const DEFAULT_CONFIG: AIConfig = {
  id: 'config',
  provider: 'anthropic',
  apiKey: '',
  baseUrl: '',
  model: 'claude-sonnet-4-5',
  availableModels: []
}

const MIGRATION_FLAG = 'inkforge-aiconfig-migrated-v2'

/**
 * useAIConfig — returns the **global** AI config.
 *
 * Lives in meta-db (since v2) so one config covers all projects. Before v2
 * it was per-project; a one-shot migration copies the current project's
 * legacy config into meta-db on first call.
 *
 * `projectId` is optional and kept for backwards-compat with callers that
 * pass it. It's used only by the migration to locate an existing legacy
 * config. Pass omitted when you just want the global config.
 */
export function useAIConfig(projectId?: string) {
  const liveConfig = useLiveQuery(
    () => metaDb.aiConfig.get('config') as Promise<AIConfig | undefined>,
    []
  )

  const migrationAttemptedRef = useRef(false)

  // One-shot migration: per-project aiConfig → meta-db aiConfig.
  // Runs once per browser; uses localStorage flag to avoid repeat work.
  useEffect(() => {
    if (migrationAttemptedRef.current) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem(MIGRATION_FLAG) === 'true') return
    // If global already has a config, nothing to migrate.
    if (liveConfig) {
      localStorage.setItem(MIGRATION_FLAG, 'true')
      migrationAttemptedRef.current = true
      return
    }
    // Wait until we know meta-db is empty (liveConfig resolved to undefined,
    // not still loading). useLiveQuery returns undefined for both cases,
    // so we just try once per mount guarded by the ref.
    migrationAttemptedRef.current = true

    const attemptMigration = async () => {
      try {
        // Fast path: if caller provided the current project, check its
        // legacy aiConfig table first.
        if (projectId) {
          const projectDb = createProjectDB(projectId)
          const legacy = await projectDb
            .table('aiConfig')
            .get('config') as AIConfig | undefined
          if (legacy && legacy.apiKey) {
            await metaDb.aiConfig.put({ ...legacy, id: 'config' })
            localStorage.setItem(MIGRATION_FLAG, 'true')
            return
          }
        }
        // Slow path: scan all projects for any existing aiConfig.
        const allProjects = await metaDb.projectIndex.toArray()
        for (const proj of allProjects) {
          if (!proj.id) continue
          try {
            const projectDb = createProjectDB(proj.id)
            const legacy = await projectDb
              .table('aiConfig')
              .get('config') as AIConfig | undefined
            if (legacy && legacy.apiKey) {
              await metaDb.aiConfig.put({ ...legacy, id: 'config' })
              break
            }
          } catch {
            // ignore broken project-db entries
          }
        }
      } catch {
        // migration is best-effort — user can always re-enter
      } finally {
        localStorage.setItem(MIGRATION_FLAG, 'true')
      }
    }

    attemptMigration()
  }, [projectId, liveConfig])

  const config: AIConfig = useMemo(
    () =>
      liveConfig
        ? { ...DEFAULT_CONFIG, ...liveConfig, provider: liveConfig.provider ?? 'anthropic' }
        : DEFAULT_CONFIG,
    [liveConfig]
  )
  const loading = liveConfig === undefined

  const uiFlags = useMemo(
    () => resolveUiFlags(config.uiFlags),
    [config.uiFlags]
  )

  const saveConfig = useCallback(async (newConfig: Partial<AIConfig>) => {
    const updated = { ...config, ...newConfig, id: 'config' as const }
    await metaDb.aiConfig.put(updated)
    return updated
  }, [config])

  const clearConfig = useCallback(async () => {
    await metaDb.aiConfig.delete('config')
  }, [])

  return { config, loading, saveConfig, clearConfig, uiFlags }
}
