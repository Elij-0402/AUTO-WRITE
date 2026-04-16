/**
 * Hybrid semantic+keyword retrieval. Drop-in replacement for the pure
 * keyword matcher in use-context-injection, with better recall on Chinese
 * queries because it captures anaphoric mentions ("那把剑", "师父") that the
 * substring matcher used to miss.
 *
 * The caller must supply the list of active entries (so we don't re-fetch
 * from Dexie) plus a DB handle for the vector index.
 */

import type { WorldEntry } from '../types/world-entry'
import type { RagDB } from './types'
import type { Embedder } from './embedder'
import { indexWorldEntries } from './indexer'
import { searchByVector } from './vector-store'
import {
  extractKeywords,
  findRelevantEntries as keywordFindRelevantEntries,
  type EntriesByType,
} from '../hooks/use-context-injection'
import { reciprocalRankFusion, type RankedId } from './hybrid-search'

export interface HybridSearchParams {
  db: RagDB
  projectId: string
  embedder: Embedder
  query: string
  entries: WorldEntry[]
  entriesByType: EntriesByType
  topK?: number
  /** Pass to skip reindexing (e.g. indexer already ran this session). */
  skipReindex?: boolean
}

export async function searchRelevantEntries(
  params: HybridSearchParams
): Promise<WorldEntry[]> {
  const topK = params.topK ?? 12
  const { db, embedder, query, entries, entriesByType } = params

  if (!params.skipReindex) {
    await indexWorldEntries(db, {
      projectId: params.projectId,
      entries,
      embedder,
    })
  }

  const byId = new Map(entries.filter(e => !e.deletedAt).map(e => [e.id, e]))

  // Semantic lane
  const [queryVec] = await embedder.embed([query])
  const semanticHits = await searchByVector(db, queryVec, {
    embedderId: embedder.id,
    sourceTypes: ['worldEntry'],
    topK: Math.max(topK * 2, 20),
    minScore: 0.05,
  })
  const semanticRanked: RankedId[] = semanticHits.map(h => ({
    id: h.embedding.sourceId,
    score: h.score,
  }))

  // Keyword lane (existing matcher)
  const keywords = extractKeywords(query)
  const keywordMatches = keywordFindRelevantEntries(keywords, entriesByType)
  const keywordRanked: RankedId[] = keywordMatches.map(entry => ({
    id: entry.id,
    score: 1,
  }))

  const fused = reciprocalRankFusion({
    lists: [semanticRanked, keywordRanked],
    weights: [1.5, 1.0],
    topK,
  })

  return fused
    .map(r => byId.get(r.id))
    .filter((e): e is WorldEntry => Boolean(e))
}
