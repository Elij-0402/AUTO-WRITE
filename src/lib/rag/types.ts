/**
 * Types shared across RAG modules. Kept free of circular imports with
 * project-db.ts — the DB handle is typed loosely as Dexie so vector-store
 * and indexer can accept any per-project database instance.
 */

import type Dexie from 'dexie'

export interface Embedding {
  id: string
  projectId: string
  sourceType: 'worldEntry' | 'chapter' | 'chapterChunk' | 'outline'
  sourceId: string
  /** For chunked sources, the 0-based chunk index inside the source. */
  chunkIndex?: number
  /** Raw text that was embedded — kept for BM25-style reranking later. */
  text: string
  /** The vector. Float32Array survives IndexedDB round-trip natively. */
  vector: Float32Array
  /** Opaque identifier of the embedder that produced this vector. */
  embedderId: string
  updatedAt: Date
}

/** Loose DB type — we access embeddings only via .table('embeddings'). */
export type RagDB = Dexie
