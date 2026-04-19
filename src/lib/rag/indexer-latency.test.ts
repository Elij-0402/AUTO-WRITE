import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordIndexerLatency,
  getRecentIndexerLatency,
  subscribeIndexerLatency,
  __resetIndexerLatency,
} from './indexer-latency'

describe('indexer-latency ring buffer', () => {
  beforeEach(() => {
    __resetIndexerLatency()
  })

  it('records entries and reads them back scoped to project', () => {
    recordIndexerLatency({
      projectId: 'p1',
      kind: 'worldEntry',
      ms: 42,
      added: 3,
      skipped: 0,
      removed: 0,
      at: Date.now(),
    })
    recordIndexerLatency({
      projectId: 'p2',
      kind: 'chapterChunk',
      ms: 88,
      added: 10,
      skipped: 2,
      removed: 0,
      at: Date.now(),
    })
    expect(getRecentIndexerLatency('p1')).toHaveLength(1)
    expect(getRecentIndexerLatency('p2')).toHaveLength(1)
    expect(getRecentIndexerLatency('missing')).toHaveLength(0)
  })

  it('caps the buffer at 20 and drops the oldest', () => {
    for (let i = 0; i < 30; i++) {
      recordIndexerLatency({
        projectId: 'p1',
        kind: 'worldEntry',
        ms: i,
        added: 0,
        skipped: 0,
        removed: 0,
        at: i,
      })
    }
    const all = getRecentIndexerLatency('p1')
    expect(all).toHaveLength(20)
    expect(all[0].ms).toBe(10) // first 10 dropped
    expect(all[all.length - 1].ms).toBe(29)
  })

  it('notifies subscribers on every new entry', () => {
    let calls = 0
    const unsub = subscribeIndexerLatency(() => {
      calls++
    })
    recordIndexerLatency({
      projectId: 'p1',
      kind: 'worldEntry',
      ms: 1,
      added: 0,
      skipped: 0,
      removed: 0,
      at: Date.now(),
    })
    recordIndexerLatency({
      projectId: 'p1',
      kind: 'worldEntry',
      ms: 2,
      added: 0,
      skipped: 0,
      removed: 0,
      at: Date.now(),
    })
    expect(calls).toBe(2)
    unsub()
    recordIndexerLatency({
      projectId: 'p1',
      kind: 'worldEntry',
      ms: 3,
      added: 0,
      skipped: 0,
      removed: 0,
      at: Date.now(),
    })
    expect(calls).toBe(2)
  })
})
