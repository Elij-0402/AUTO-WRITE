import type { InkForgeProjectDB } from './project-db'
import type { Revision } from './project-db'
import { computeWordCount } from './chapter-queries'

export type { Revision } from './project-db'

export const MAX_REVISIONS_PER_CHAPTER = 50
/** Minimum interval between automatic snapshots for the same chapter. */
export const AUTOSNAPSHOT_INTERVAL_MS = 5 * 60 * 1000

export interface CreateRevisionParams {
  projectId: string
  chapterId: string
  snapshot: object
  source: Revision['source']
  label?: string
  /** If set, skip snapshot when the previous revision is younger than this (ms). */
  minIntervalMs?: number
}

/**
 * Create a revision for a chapter, with throttling and pruning.
 *
 * - If `minIntervalMs` is set and the last revision for this chapter is
 *   younger than that, this is a no-op (returns null).
 * - After insert, prunes oldest entries beyond MAX_REVISIONS_PER_CHAPTER.
 *
 * Returns the inserted revision id or null when skipped.
 */
export async function createRevision(
  db: InkForgeProjectDB,
  params: CreateRevisionParams
): Promise<string | null> {
  if (params.minIntervalMs) {
    const latest = await db.revisions
      .where({ chapterId: params.chapterId })
      .reverse()
      .sortBy('createdAt')
    if (latest[0] && Date.now() - latest[0].createdAt.getTime() < params.minIntervalMs) {
      return null
    }
  }

  const id = crypto.randomUUID()
  const revision: Revision = {
    id,
    projectId: params.projectId,
    chapterId: params.chapterId,
    snapshot: params.snapshot,
    wordCount: computeWordCount(params.snapshot),
    createdAt: new Date(),
    source: params.source,
    label: params.label,
  }
  await db.revisions.add(revision)
  await pruneRevisions(db, params.chapterId)
  return id
}

export async function listRevisions(
  db: InkForgeProjectDB,
  chapterId: string
): Promise<Revision[]> {
  const rows = await db.revisions.where({ chapterId }).sortBy('createdAt')
  return rows.reverse() // newest first
}

export async function getRevision(
  db: InkForgeProjectDB,
  id: string
): Promise<Revision | undefined> {
  return db.revisions.get(id)
}

export async function deleteRevision(
  db: InkForgeProjectDB,
  id: string
): Promise<void> {
  await db.revisions.delete(id)
}

export async function labelRevision(
  db: InkForgeProjectDB,
  id: string,
  label: string
): Promise<void> {
  await db.revisions.update(id, { label })
}

/** Remove oldest autosnapshots beyond MAX_REVISIONS_PER_CHAPTER. Manual and
 * labelled revisions are kept preferentially. */
export async function pruneRevisions(
  db: InkForgeProjectDB,
  chapterId: string,
  limit: number = MAX_REVISIONS_PER_CHAPTER
): Promise<number> {
  const all = await db.revisions.where({ chapterId }).sortBy('createdAt')
  if (all.length <= limit) return 0

  // Sort such that the most-droppable come first.
  // Priority to keep: labelled > manual > ai-draft > autosnapshot.
  const rank = (r: Revision): number => {
    if (r.label) return 3
    if (r.source === 'manual') return 2
    if (r.source === 'ai-draft') return 1
    return 0
  }

  const droppable = [...all].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  const excess = all.length - limit
  const toDelete = droppable.slice(0, excess)
  await db.revisions.bulkDelete(toDelete.map(r => r.id))
  return toDelete.length
}
