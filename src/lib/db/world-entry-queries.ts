import type { WorldEntry, WorldEntryType } from '../types'
import type { InkForgeProjectDB } from './project-db'

/** Default names per entry type per D-15 */
const DEFAULT_NAMES: Record<WorldEntryType, string> = {
  character: '未命名角色',
  faction: '未命名势力',
  location: '未命名地点',
  rule: '未命名规则',
  secret: '未命名秘密',
  event: '未命名事件',
  timeline: '未命名时间线',
}

function compareWorldEntries(a: WorldEntry, b: WorldEntry): number {
  const isChronologicalType = a.type === b.type && (a.type === 'event' || a.type === 'timeline')

  if (isChronologicalType) {
    const aHasTimeOrder = a.timeOrder != null
    const bHasTimeOrder = b.timeOrder != null

    if (aHasTimeOrder && bHasTimeOrder && a.timeOrder !== b.timeOrder) {
      const aTimeOrder = a.timeOrder ?? Number.MAX_SAFE_INTEGER
      const bTimeOrder = b.timeOrder ?? Number.MAX_SAFE_INTEGER
      return aTimeOrder - bTimeOrder
    }

    if (aHasTimeOrder !== bHasTimeOrder) {
      return aHasTimeOrder ? -1 : 1
    }
  }

  return a.name.localeCompare(b.name, 'zh-CN')
}

/**
 * Get all non-deleted world entries for a project, optionally filtered by type.
 * Per D-10: sorted alphabetically by name (localeCompare for Chinese pinyin).
 * Event/timeline entries sort by timeOrder first, then fallback to name.
 */
export async function getWorldEntries(
  db: InkForgeProjectDB,
  projectId: string,
  type?: WorldEntryType
): Promise<WorldEntry[]> {
  const entries = await db.worldEntries
    .filter(entry =>
      entry.projectId === projectId &&
      entry.deletedAt === null &&
      (type === undefined || entry.type === type)
    )
    .toArray()

  return entries.sort(compareWorldEntries)
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

  const entries = await db.worldEntries
    .filter(entry =>
      entry.projectId === projectId &&
      entry.deletedAt === null &&
      (type === undefined || entry.type === type) &&
      (
        entry.name.toLowerCase().includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    )
    .toArray()

  return entries.sort(compareWorldEntries)
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

/**
 * Search entries by keyword matching against name and core fields.
 * Per D-11: searches name + type-specific core fields (personality, appearance, etc).
 * Used by context injection for relevance matching.
 */
export async function queryEntriesByKeyword(
  db: InkForgeProjectDB,
  keyword: string,
  projectId: string
): Promise<WorldEntry[]> {
  const lowerKeyword = keyword.toLowerCase()

  const entries = await db.worldEntries
    .filter(entry => {
      if (entry.projectId !== projectId || entry.deletedAt !== null) {
        return false
      }

      // Name match
      const nameMatch = entry.name.toLowerCase().includes(lowerKeyword)
      if (nameMatch) return true

      // Core fields based on type
      if (entry.type === 'character') {
        return Boolean(
          entry.personality?.toLowerCase().includes(lowerKeyword) ||
          entry.appearance?.toLowerCase().includes(lowerKeyword) ||
          entry.background?.toLowerCase().includes(lowerKeyword) ||
          entry.alias?.toLowerCase().includes(lowerKeyword)
        )
      }
      if (entry.type === 'location') {
        return Boolean(
          entry.description?.toLowerCase().includes(lowerKeyword) ||
          entry.features?.toLowerCase().includes(lowerKeyword)
        )
      }
      if (entry.type === 'faction') {
        return Boolean(
          entry.factionRole?.toLowerCase().includes(lowerKeyword) ||
          entry.factionGoal?.toLowerCase().includes(lowerKeyword) ||
          entry.factionStyle?.toLowerCase().includes(lowerKeyword)
        )
      }
      if (entry.type === 'rule') {
        return Boolean(
          entry.content?.toLowerCase().includes(lowerKeyword) ||
          entry.scope?.toLowerCase().includes(lowerKeyword)
        )
      }
      if (entry.type === 'secret') {
        return Boolean(
          entry.secretContent?.toLowerCase().includes(lowerKeyword) ||
          entry.secretScope?.toLowerCase().includes(lowerKeyword) ||
          entry.revealCondition?.toLowerCase().includes(lowerKeyword)
        )
      }
      if (entry.type === 'event') {
        return Boolean(
          entry.eventDescription?.toLowerCase().includes(lowerKeyword) ||
          entry.eventImpact?.toLowerCase().includes(lowerKeyword) ||
          entry.timePoint?.toLowerCase().includes(lowerKeyword)
        )
      }
      if (entry.type === 'timeline') {
        return Boolean(
          entry.eventDescription?.toLowerCase().includes(lowerKeyword) ||
          entry.timePoint?.toLowerCase().includes(lowerKeyword)
        )
      }
      return false
    })
    .toArray()

  return entries.sort(compareWorldEntries)
}

/**
 * Get all entries grouped by type for context injection.
 * Used by use-context-injection hook to get entriesByType structure.
 */
export async function getEntriesByTypeForContext(
  db: InkForgeProjectDB,
  projectId: string
): Promise<{
  character: WorldEntry[]
  faction: WorldEntry[]
  location: WorldEntry[]
  rule: WorldEntry[]
  secret: WorldEntry[]
  event: WorldEntry[]
  timeline: WorldEntry[]
}> {
  const entries = await db.worldEntries
    .filter(entry => entry.projectId === projectId && entry.deletedAt === null)
    .toArray()

  return {
    character: entries.filter(e => e.type === 'character').sort(compareWorldEntries),
    faction: entries.filter(e => e.type === 'faction').sort(compareWorldEntries),
    location: entries.filter(e => e.type === 'location').sort(compareWorldEntries),
    rule: entries.filter(e => e.type === 'rule').sort(compareWorldEntries),
    secret: entries.filter(e => e.type === 'secret').sort(compareWorldEntries),
    event: entries.filter(e => e.type === 'event').sort(compareWorldEntries),
    timeline: entries.filter(e => e.type === 'timeline').sort(compareWorldEntries),
  }
}
