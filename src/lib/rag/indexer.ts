/**
 * Incremental indexer for world entries. Ensures every active entry has an
 * up-to-date embedding and cleans up stale vectors when entries are deleted
 * or the embedder model changes.
 *
 * Chapters are handled in a separate chunked path (not yet — small scope
 * here because the highest-value signal for AI chat is still world-entry
 * context; chapter chunking comes as an incremental follow-up).
 */

import type { WorldEntry } from '../types/world-entry'
import type { RagDB, Embedding } from './types'
import type { Embedder } from './embedder'
import { formatEntryForContext } from '../hooks/use-context-injection'
import {
  putEmbeddings,
  deleteEmbeddingsBySource,
  listEmbeddings,
} from './vector-store'

export interface IndexWorldEntriesParams {
  projectId: string
  entries: WorldEntry[]
  embedder: Embedder
}

export async function indexWorldEntries(
  db: RagDB,
  params: IndexWorldEntriesParams
): Promise<{ added: number; skipped: number; removed: number }> {
  const existing = await listEmbeddings(db, {
    sourceType: 'worldEntry',
    embedderId: params.embedder.id,
  })
  const existingByKey = new Map(existing.map(e => [e.sourceId, e]))

  const active = params.entries.filter(e => !e.deletedAt)
  const needsEmbed: WorldEntry[] = []
  let skipped = 0

  for (const entry of active) {
    const prev = existingByKey.get(entry.id)
    const sig = entrySignature(entry)
    if (!prev || decodeText(prev.text) !== sig) {
      needsEmbed.push(entry)
    } else {
      skipped++
    }
  }

  let added = 0
  if (needsEmbed.length > 0) {
    const texts = needsEmbed.map(entrySignature)
    const vectors = await params.embedder.embed(texts)
    const embeddings: Embedding[] = needsEmbed.map((entry, i) => ({
      id: `${params.embedder.id}:worldEntry:${entry.id}`,
      projectId: params.projectId,
      sourceType: 'worldEntry',
      sourceId: entry.id,
      text: texts[i],
      vector: vectors[i],
      embedderId: params.embedder.id,
      updatedAt: new Date(),
    }))
    await putEmbeddings(db, embeddings)
    added = embeddings.length
  }

  // Remove embeddings for entries that no longer exist (deleted or hard-removed).
  const activeIds = new Set(active.map(e => e.id))
  const stale = existing.filter(e => !activeIds.has(e.sourceId))
  for (const s of stale) {
    await deleteEmbeddingsBySource(db, 'worldEntry', s.sourceId)
  }

  return { added, skipped, removed: stale.length }
}

/**
 * Text representation of an entry used for embedding. Deliberately stable so
 * we can detect "no content change → skip re-embed".
 */
export function entrySignature(entry: WorldEntry): string {
  const fields = formatEntryForContext(entry)
  const tags = (entry.tags ?? []).join(',')
  return tags ? `${fields} | 标签: ${tags}` : fields
}

function decodeText(t: string): string {
  return t
}
