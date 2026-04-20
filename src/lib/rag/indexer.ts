/**
 * Incremental indexer for world entries and chapters.
 *
 * World-entry path (pre-v0.3): content-signature matching — if the stable
 * textual signature of an entry hasn't changed since its last embedding,
 * skip. Strictly better than timestamp-based ("re-saved but unchanged"
 * stays skipped). The `lastIndexedAt` field on Embedding is kept
 * observability-only — surfaced in the T8 dev-stats panel, never used
 * for incremental decisions.
 *
 * Chapter path (v0.3 T7): chapter content (ProseMirror JSON) → plain text
 * → chunks of CHAPTER_CHUNK_TARGET chars. Each chunk is an embedding row
 * with sourceType='chapterChunk' and chunkIndex set. A chapter's chunk set
 * is re-derived on each pass; chunks whose (chapterId, chunkIndex) signature
 * matches an existing embedding are skipped; stale chunks past the new
 * chunk count are cleaned up.
 */

import type { WorldEntry } from '../types/world-entry'
import type { Chapter } from '../types/chapter'
import type { RagDB, Embedding } from './types'
import type { Embedder } from './embedder'
import { formatEntryForContext } from '../hooks/use-context-injection'
import { extractPlainText } from '../analysis/content-hash'
import {
  putEmbeddings,
  deleteEmbeddingsBySource,
  listEmbeddings,
} from './vector-store'
import { recordIndexerLatency } from './indexer-latency'

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

export interface IndexWorldEntriesParams {
  projectId: string
  entries: WorldEntry[]
  embedder: Embedder
}

export async function indexWorldEntries(
  db: RagDB,
  params: IndexWorldEntriesParams
): Promise<{ added: number; skipped: number; removed: number }> {
  const t0 = nowMs()
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
    const now = new Date()
    const embeddings: Embedding[] = needsEmbed.map((entry, i) => ({
      id: `${params.embedder.id}:worldEntry:${entry.id}`,
      projectId: params.projectId,
      sourceType: 'worldEntry',
      sourceId: entry.id,
      text: texts[i],
      vector: vectors[i],
      embedderId: params.embedder.id,
      updatedAt: now,
      lastIndexedAt: now,
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

  const result = { added, skipped, removed: stale.length }
  recordIndexerLatency({
    projectId: params.projectId,
    kind: 'worldEntry',
    ms: nowMs() - t0,
    added: result.added,
    skipped: result.skipped,
    removed: result.removed,
    at: Date.now(),
  })
  return result
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

// --- Chapter indexing (T7 v0.3) --------------------------------------------

/**
 * Target size of a chapter chunk, measured in characters (CJK chars count
 * as one). ~800 keeps embeddings focused enough for retrieval while bounding
 * vector storage growth. Chunks may overshoot slightly to avoid mid-sentence
 * cuts; the boundary-safe splitter below picks paragraph breaks first.
 */
export const CHAPTER_CHUNK_TARGET = 800

export interface IndexChaptersParams {
  projectId: string
  chapters: Chapter[]
  embedder: Embedder
}

export interface ChapterChunk {
  chapterId: string
  chunkIndex: number
  text: string
}

/**
 * Break a chapter's plain text into ~CHAPTER_CHUNK_TARGET-char chunks.
 * Prefer paragraph boundaries; fall back to character slicing for a
 * single runaway paragraph. Empty input produces zero chunks.
 *
 * Exported for unit tests.
 */
export function chunkChapterText(text: string, target = CHAPTER_CHUNK_TARGET): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  const paragraphs = trimmed.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean)
  const chunks: string[] = []
  let buf = ''
  const flush = () => {
    if (buf) {
      chunks.push(buf)
      buf = ''
    }
  }
  for (const p of paragraphs) {
    if (p.length >= target * 2) {
      // Runaway paragraph — char-slice.
      flush()
      for (let i = 0; i < p.length; i += target) {
        chunks.push(p.slice(i, i + target))
      }
      continue
    }
    if (buf.length === 0) {
      buf = p
    } else if (buf.length + 1 + p.length <= target * 1.25) {
      buf += '\n\n' + p
    } else {
      flush()
      buf = p
    }
  }
  flush()
  return chunks
}

export async function indexChapters(
  db: RagDB,
  params: IndexChaptersParams
): Promise<{ added: number; skipped: number; removed: number }> {
  const t0 = nowMs()
  const existing = await listEmbeddings(db, {
    sourceType: 'chapterChunk',
    embedderId: params.embedder.id,
  })
  // Index existing chunks by (chapterId, chunkIndex) via the embedding id
  // pattern used at write time below.
  const existingById = new Map(existing.map(e => [e.id, e]))

  const active = params.chapters.filter(c => !c.deletedAt)
  const desiredChunks: Array<{ chunk: ChapterChunk; id: string }> = []
  for (const chapter of active) {
    const plain = extractPlainText(chapter.content)
    const chunks = chunkChapterText(plain)
    chunks.forEach((text, chunkIndex) => {
      desiredChunks.push({
        chunk: { chapterId: chapter.id, chunkIndex, text },
        id: `${params.embedder.id}:chapterChunk:${chapter.id}:${chunkIndex}`,
      })
    })
  }

  const desiredIds = new Set(desiredChunks.map(d => d.id))
  const needsEmbed: typeof desiredChunks = []
  let skipped = 0

  for (const desired of desiredChunks) {
    const prev = existingById.get(desired.id)
    if (!prev || decodeText(prev.text) !== desired.chunk.text) {
      needsEmbed.push(desired)
    } else {
      skipped++
    }
  }

  let added = 0
  if (needsEmbed.length > 0) {
    const vectors = await params.embedder.embed(needsEmbed.map(d => d.chunk.text))
    const now = new Date()
    const embeddings: Embedding[] = needsEmbed.map((d, i) => ({
      id: d.id,
      projectId: params.projectId,
      sourceType: 'chapterChunk',
      sourceId: d.chunk.chapterId,
      chunkIndex: d.chunk.chunkIndex,
      text: d.chunk.text,
      vector: vectors[i],
      embedderId: params.embedder.id,
      updatedAt: now,
      lastIndexedAt: now,
    }))
    await putEmbeddings(db, embeddings)
    added = embeddings.length
  }

  // Remove stale chunks: embeddings whose id is not in the new desired set.
  // Covers deleted chapters AND chapters whose chunk count shrank.
  const stale = existing.filter(e => !desiredIds.has(e.id))
  for (const s of stale) {
    await db.table('embeddings').delete(s.id)
  }

  const result = { added, skipped, removed: stale.length }
  recordIndexerLatency({
    projectId: params.projectId,
    kind: 'chapterChunk',
    ms: nowMs() - t0,
    added: result.added,
    skipped: result.skipped,
    removed: result.removed,
    at: Date.now(),
  })
  return result
}
