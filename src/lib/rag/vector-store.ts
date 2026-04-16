/**
 * Vector store over the per-project Dexie `embeddings` table.
 *
 * We store Float32Array directly — IndexedDB supports typed arrays — so there
 * is no JSON serialization cost. For collections up to ~5k vectors an in-JS
 * linear scan with cosine similarity is fast enough (~5ms on a laptop).
 * Beyond that threshold we'd want an approximate index (HNSW/IVF); not here.
 */

import type { RagDB, Embedding } from './types'
import { cosineSimilarity } from './embedder'

export interface VectorSearchHit {
  embedding: Embedding
  score: number
}

export async function putEmbedding(
  db: RagDB,
  embedding: Embedding
): Promise<void> {
  await db.table('embeddings').put(embedding)
}

export async function putEmbeddings(
  db: RagDB,
  embeddings: Embedding[]
): Promise<void> {
  if (embeddings.length === 0) return
  await db.table('embeddings').bulkPut(embeddings)
}

export async function deleteEmbeddingsBySource(
  db: RagDB,
  sourceType: Embedding['sourceType'],
  sourceId: string
): Promise<void> {
  await db
    .table('embeddings')
    .where({ sourceType, sourceId })
    .delete()
}

export async function listEmbeddings(
  db: RagDB,
  filter?: { sourceType?: Embedding['sourceType']; embedderId?: string }
): Promise<Embedding[]> {
  const table = db.table('embeddings')
  const rows: Embedding[] = filter?.sourceType
    ? await table.where({ sourceType: filter.sourceType }).toArray()
    : await table.toArray()
  if (filter?.embedderId) {
    return rows.filter(r => r.embedderId === filter.embedderId)
  }
  return rows
}

export async function searchByVector(
  db: RagDB,
  queryVec: Float32Array,
  options?: {
    topK?: number
    embedderId?: string
    sourceTypes?: ReadonlyArray<Embedding['sourceType']>
    /** Hard cutoff — hits below this are dropped. */
    minScore?: number
  }
): Promise<VectorSearchHit[]> {
  const topK = options?.topK ?? 20
  const minScore = options?.minScore ?? 0

  const candidates = await listEmbeddings(db, {
    embedderId: options?.embedderId,
  })

  const filtered = options?.sourceTypes
    ? candidates.filter(c => options.sourceTypes!.includes(c.sourceType))
    : candidates

  const scored: VectorSearchHit[] = []
  for (const emb of filtered) {
    const score = cosineSimilarity(queryVec, emb.vector)
    if (score >= minScore) scored.push({ embedding: emb, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}
