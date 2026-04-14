import type { WorldEntry, WorldEntryType } from '../types'
import type { InkForgeProjectDB } from './project-db'

/** Default names per entry type per D-15 */
const DEFAULT_NAMES: Record<WorldEntryType, string> = {
  character: '未命名角色',
  location: '未命名地点',
  rule: '未命名规则',
  timeline: '未命名时间线',
}

/**
 * Get all non-deleted world entries for a project, optionally filtered by type.
 * Per D-10: sorted alphabetically by name (localeCompare for Chinese pinyin).
 * Per D-12: timeline entries sort same as other types — by name.
 */
export async function getWorldEntries(
  db: InkForgeProjectDB,
  projectId: string,
  type?: WorldEntryType
): Promise<WorldEntry[]> {
  let collection = db.worldEntries
    .filter(entry => entry.projectId === projectId && entry.deletedAt === null)

  if (type) {
    collection = db.worldEntries
      .filter(entry =>
        entry.projectId === projectId &&
        entry.type === type &&
        entry.deletedAt === null
      )
  }

  const entries = await collection.toArray()
  return entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

/**
 * Add a new world entry with NanoID and type-specific defaults.
 * Per D-15: default names are type-specific (未命名角色/未命名地点/未命名规则/未命名时间线).
 * Per D-26: NanoID for entity IDs.
 */
export async function addWorldEntry(
  db: InkForgeProjectDB,
  projectId: string,
  type: WorldEntryType,
  name?: string
): Promise<string> {
  const { nanoid } = await import('nanoid')
  const id = nanoid()
  const now = new Date()

  const entry: WorldEntry = {
    id,
    projectId,
    type,
    name: name ?? DEFAULT_NAMES[type],
    tags: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await db.worldEntries.add(entry)
  return id
}

/**
 * Rename a world entry — update name and updatedAt.
 */
export async function renameWorldEntry(
  db: InkForgeProjectDB,
  id: string,
  name: string
): Promise<void> {
  await db.worldEntries.update(id, { name, updatedAt: new Date() })
}

/**
 * Partial update of world entry fields, sets updatedAt.
 * Per D-14: direct edit mode, all type-specific fields updatable.
 */
export async function updateWorldEntryFields(
  db: InkForgeProjectDB,
  id: string,
  fields: Partial<Omit<WorldEntry, 'id' | 'projectId' | 'type' | 'createdAt' | 'deletedAt'>>
): Promise<void> {
  await db.worldEntries.update(id, { ...fields, updatedAt: new Date() })
}

/**
 * Soft-delete a world entry — per D-17: sets deletedAt.
 * ALSO cascades to delete all relations where this entry is source OR target.
 * Per T-04-04: uses Dexie transaction for atomic cascade delete.
 */
export async function softDeleteWorldEntry(
  db: InkForgeProjectDB,
  id: string
): Promise<void> {
  const now = new Date()

  // Soft delete the entry
  await db.worldEntries.update(id, { deletedAt: now, updatedAt: now })

  // Cascade: soft-delete all relations referencing this entry
  await db.transaction('rw', db.relations, async () => {
    const relations = await db.relations
      .filter(r =>
        (r.sourceEntryId === id || r.targetEntryId === id) &&
        r.deletedAt === null
      )
      .toArray()

    for (const relation of relations) {
      await db.relations.update(relation.id, { deletedAt: now })
    }
  })
}

/**
 * Search world entries by name (case-insensitive contains) AND tags (any tag contains query).
 * Per D-11: searches by name and tags, optionally filters by type.
 * Per D-07: duplicate names are fine, so search returns all matches.
 */
export async function searchWorldEntries(
  db: InkForgeProjectDB,
  projectId: string,
  query: string,
  type?: WorldEntryType
): Promise<WorldEntry[]> {
  const lowerQuery = query.toLowerCase()

  let collection = db.worldEntries
    .filter(entry =>
      entry.projectId === projectId &&
      entry.deletedAt === null &&
      (
        entry.name.toLowerCase().includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    )

  if (type) {
    collection = db.worldEntries
      .filter(entry =>
        entry.projectId === projectId &&
        entry.type === type &&
        entry.deletedAt === null &&
        (
          entry.name.toLowerCase().includes(lowerQuery) ||
          entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
      )
  }

  const entries = await collection.toArray()
  return entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

/**
 * Get a single world entry by id.
 */
export async function getWorldEntryById(
  db: InkForgeProjectDB,
  id: string
): Promise<WorldEntry | undefined> {
  return db.worldEntries.get(id)
}