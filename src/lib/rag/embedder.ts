/**
 * Pluggable embedder interface + default implementation.
 *
 * The default "hash-gram" embedder is a pure-JS feature-hashing encoder over
 * character n-grams (1,2,3-grams). It's not a neural model, but for Chinese
 * text it already beats the substring keyword matcher we're replacing, and
 * it has zero bundle/runtime cost (no model download, no worker).
 *
 * Design notes:
 *  - Hashing trick avoids vocabulary maintenance; vectors are fixed-size.
 *  - L2-normalized so cosine similarity reduces to a dot product.
 *  - Deterministic across runs — we can persist vectors in IndexedDB.
 *
 * Future: swap in a BGE/multilingual-e5 embedder via @xenova/transformers
 * when the project needs higher recall; the Embedder interface is stable.
 */

export interface Embedder {
  readonly dim: number
  /** Identifier used to namespace persisted vectors; change = reindex. */
  readonly id: string
  embed(texts: string[]): Promise<Float32Array[]>
}

export const DEFAULT_DIM = 256

export class HashGramEmbedder implements Embedder {
  readonly dim: number
  readonly id: string
  private readonly ngramSizes: readonly number[]

  constructor(options?: { dim?: number; ngramSizes?: readonly number[] }) {
    this.dim = options?.dim ?? DEFAULT_DIM
    this.ngramSizes = options?.ngramSizes ?? [1, 2, 3]
    this.id = `hash-gram:${this.ngramSizes.join(',')}:${this.dim}`
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    return texts.map(text => embedOne(text, this.dim, this.ngramSizes))
  }
}

function embedOne(text: string, dim: number, ngramSizes: readonly number[]): Float32Array {
  const vec = new Float32Array(dim)
  if (!text) return vec
  const cleaned = normalize(text)

  for (const n of ngramSizes) {
    for (let i = 0; i + n <= cleaned.length; i++) {
      const gram = cleaned.slice(i, i + n)
      const h = stableHash(gram) % dim
      const sign = stableHash(`${gram}#sign`) & 1 ? 1 : -1
      vec[h] += sign
    }
  }

  return l2Normalize(vec)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s，。！？、；：""''【】《》（）()\[\],.;:!?]/g, '')
}

/** FNV-1a 32-bit hash — stable across runs, good enough for bucketing. */
export function stableHash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function l2Normalize(vec: Float32Array): Float32Array {
  let sumSq = 0
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i]
  if (sumSq === 0) return vec
  const inv = 1 / Math.sqrt(sumSq)
  for (let i = 0; i < vec.length; i++) vec[i] *= inv
  return vec
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  // vectors are L2-normalized so dot product = cosine similarity
  return dot
}
