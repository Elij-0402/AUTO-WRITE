import Dexie, { type Table } from 'dexie'
import type { ProjectMeta } from '../types'

/**
 * InkForge shared metadata database.
 * Stores project index entries for the dashboard listing.
 * Per D-19: this is the shared metadata database, separate from per-project databases.
 */
export class InkForgeMetaDB extends Dexie {
  projectIndex!: Table<ProjectMeta, string>

  constructor() {
    super('inkforge-meta')
    this.version(1).stores({
      projectIndex: 'id, title, updatedAt, deletedAt',
    })
  }
}

/** Singleton instance of the metadata database */
export const metaDb = new InkForgeMetaDB()
