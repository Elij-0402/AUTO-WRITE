/**
 * Hybrid retrieval: fuse semantic similarity scores with keyword hits using
 * Reciprocal Rank Fusion (RRF). RRF is parameter-light and robust across
 * scoring scales, which matters here because the semantic score is cosine
 * on a hash-gram vector (bounded 0..1) while the keyword score is an
 * unbounded frequency count.
 */

export interface RankedId {
  id: string
  score: number
}

export interface FusionInput {
  /** Ordered best→worst. */
  lists: ReadonlyArray<ReadonlyArray<RankedId>>
  /** RRF constant; 60 is the canonical default from the original paper. */
  k?: number
  /** Optional per-list weights (default: 1 for all). */
  weights?: ReadonlyArray<number>
  /** Cap results. Undefined = return all. */
  topK?: number
}

export function reciprocalRankFusion(input: FusionInput): RankedId[] {
  const k = input.k ?? 60
  const weights = input.weights ?? input.lists.map(() => 1)
  const scores = new Map<string, number>()

  input.lists.forEach((list, listIdx) => {
    const w = weights[listIdx] ?? 1
    list.forEach((entry, rank) => {
      const contribution = w / (k + rank + 1)
      scores.set(entry.id, (scores.get(entry.id) ?? 0) + contribution)
    })
  })

  const merged: RankedId[] = [...scores.entries()].map(([id, score]) => ({ id, score }))
  merged.sort((a, b) => b.score - a.score)
  return input.topK ? merged.slice(0, input.topK) : merged
}
