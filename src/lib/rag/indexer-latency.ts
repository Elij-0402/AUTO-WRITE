/**
 * In-memory ring buffer of the last indexer runs. Used by the T8 dev-stats
 * panel to show recent indexer freshness + latency without adding a new DB
 * table. Resets on page reload — observability only, never a data source.
 *
 * Per CEO-8A: surface indexer latency histogram; per plan: "indexer 最近 20
 * 次 latency".
 */

export type IndexerKind = 'worldEntry' | 'chapterChunk'

export interface IndexerLatencyEntry {
  projectId: string
  kind: IndexerKind
  ms: number
  added: number
  skipped: number
  removed: number
  at: number
}

const MAX_ENTRIES = 20
const buffer: IndexerLatencyEntry[] = []
const listeners = new Set<() => void>()
const snapshots = new Map<string, IndexerLatencyEntry[]>()

export function recordIndexerLatency(entry: IndexerLatencyEntry): void {
  buffer.push(entry)
  if (buffer.length > MAX_ENTRIES) buffer.shift()
  snapshots.clear()
  for (const listener of listeners) {
    listener()
  }
}

export function getRecentIndexerLatency(projectId: string): IndexerLatencyEntry[] {
  const cached = snapshots.get(projectId)
  if (cached) return cached
  const data = buffer.filter((e) => e.projectId === projectId)
  snapshots.set(projectId, data)
  return data
}

export function subscribeIndexerLatency(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Tests only — clears the buffer and listeners. */
export function __resetIndexerLatency(): void {
  buffer.length = 0
  listeners.clear()
  snapshots.clear()
}
