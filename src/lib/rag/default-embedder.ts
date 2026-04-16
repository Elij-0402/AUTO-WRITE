/**
 * Cached singleton embedder per-project. The default hash-gram embedder is
 * dirt cheap to construct, but we keep a single instance so its `.id` is
 * stable across calls (important for cache invalidation on schema change).
 */

import { HashGramEmbedder, type Embedder } from './embedder'

let cached: Embedder | null = null

export function getDefaultEmbedder(): Embedder {
  if (!cached) cached = new HashGramEmbedder()
  return cached
}

/** For tests only — resets the cached instance. */
export function __resetEmbedderForTests(): void {
  cached = null
}
