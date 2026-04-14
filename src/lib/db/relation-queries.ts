import type { Relation, RelationCategory } from '../types'
import type { InkForgeProjectDB } from './project-db'

/**
 * Get all non-deleted relations for an entry (bidirectional per D-22).
 * Returns relations where entry is source OR target.
 */
export async function getRelationsForEntry(
  db: InkForgeProjectDB,
  entryId: string
): Promise<Relation[]> {
  const relations = await db.relations
    .filter(r =>
      (r.sourceEntryId === entryId || r.targetEntryId === entryId) &&
      r.deletedAt === null
    )
    .toArray()

  return relations
}

/**
 * Add a new relation between two entries with NanoID.
 * Per D-22: bidirectional — if A links to B, B's view shows the relationship.
 * Per D-29: sourceToTargetLabel is directional from source to target.
 * Per D-23: category is 'character_relation' or 'general', description is free text.
 */
export async function addRelation(
  db: InkForgeProjectDB,
  projectId: string,
  sourceEntryId: string,
  targetEntryId: string,
  category: RelationCategory,
  description: string,
  sourceToTargetLabel: string
): Promise<string> {
  const { nanoid } = await import('nanoid')
  const id = nanoid()

  const relation: Relation = {
    id,
    projectId,
    sourceEntryId,
    targetEntryId,
    category,
    description,
    sourceToTargetLabel,
    createdAt: new Date(),
    deletedAt: null,
  }

  await db.relations.add(relation)
  return id
}

/**
 * Soft-delete a relation by setting deletedAt.
 */
export async function deleteRelation(
  db: InkForgeProjectDB,
  id: string
): Promise<void> {
  await db.relations.update(id, { deletedAt: new Date() })
}

/**
 * Get count of non-deleted relations for an entry (for D-17 delete confirmation).
 * Counts relations where entry is source OR target.
 */
export async function getRelationCount(
  db: InkForgeProjectDB,
  entryId: string
): Promise<number> {
  const relations = await db.relations
    .filter(r =>
      (r.sourceEntryId === entryId || r.targetEntryId === entryId) &&
      r.deletedAt === null
    )
    .count()

  return relations
}