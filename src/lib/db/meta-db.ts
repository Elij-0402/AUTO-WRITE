import Dexie, { type Table } from 'dexie'
import type { ProjectMeta } from '../types'
import type { AIProvider } from './project-db'
import type { UiExperimentFlags } from '../ai/ui-flags'

/**
 * Global AI config — single row keyed by 'config'. Lives in meta-db so the
 * user configures once and every project inherits (BYOK single-user).
 * Previously per-project (see project-db.ts aiConfig table); migrated on
 * first mount by use-ai-config.ts.
 */
export interface GlobalAIConfig {
  id: 'config'
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model?: string
  availableModels?: string[]
  uiFlags?: UiExperimentFlags
}

/**
 * InkForge shared metadata database.
 * Stores project index entries for the dashboard listing, and the global
 * AI config (moved from per-project DB in v2).
 * Per D-19: this is the shared metadata database, separate from per-project databases.
 */
export class InkForgeMetaDB extends Dexie {
  projectIndex!: Table<ProjectMeta, string>
  aiConfig!: Table<GlobalAIConfig, 'config'>

  constructor() {
    super('inkforge-meta')
    this.version(1).stores({
      projectIndex: 'id, title, updatedAt, deletedAt',
    })
    this.version(2).stores({
      projectIndex: 'id, title, updatedAt, deletedAt',
      aiConfig: '&id',
    })
  }
}

/** Singleton instance of the metadata database */
export const metaDb = new InkForgeMetaDB()
