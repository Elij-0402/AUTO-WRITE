import Dexie, { type Table } from 'dexie'
import type { Chapter, ProjectMeta } from '../types'

/**
 * Per-project database for InkForge.
 * Per D-19: each project gets its own IndexedDB database for clean isolation.
 * Database name: inkforge-project-{projectId}
 */
export class InkForgeProjectDB extends Dexie {
  projects!: Table<ProjectMeta, string>
  chapters!: Table<Chapter, string>

  constructor(projectId: string) {
    super(`inkforge-project-${projectId}`)
    this.version(1).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
    })
  }
}

/**
 * Factory function to create a per-project database instance.
 * Per D-19: each project gets its own DB for isolation.
 */
export function createProjectDB(projectId: string): InkForgeProjectDB {
  return new InkForgeProjectDB(projectId)
}
