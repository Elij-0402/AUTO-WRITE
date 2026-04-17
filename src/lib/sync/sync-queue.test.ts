import { describe, it, expect } from 'vitest'
import { enqueueChange, incrementRetry, markSynced, clearSyncedItems, type SyncQueueItem } from './sync-queue'

async function readAll(): Promise<SyncQueueItem[]> {
  const { openDB } = await import('idb')
  const db = await openDB('inkforge-sync-queue', 1)
  const all = (await db.getAll('queue')) as SyncQueueItem[]
  db.close()
  return all
}

describe('sync-queue', () => {
  it('incrementRetry stamps lastRetryAt on each bump', async () => {
    await enqueueChange({
      table: 'chapters',
      operation: 'update',
      data: { id: 'retry-test-x' },
      localUpdatedAt: Date.now(),
      userId: 'u1',
    })
    const items = await readAll()
    const item = items.find(i => (i.data as { id: string }).id === 'retry-test-x')!
    expect(item).toBeDefined()
    expect(item.lastRetryAt).toBeUndefined()

    const before = Date.now()
    await incrementRetry([item.id])
    const after = Date.now()

    const refreshed = await readAll()
    const bumped = refreshed.find(i => i.id === item.id)!
    expect(bumped.retryCount).toBe(1)
    expect(bumped.lastRetryAt).toBeDefined()
    expect(bumped.lastRetryAt!).toBeGreaterThanOrEqual(before)
    expect(bumped.lastRetryAt!).toBeLessThanOrEqual(after)
  })

  it('clearSyncedItems removes synced rows and leaves pending ones', async () => {
    await enqueueChange({
      table: 'chapters',
      operation: 'update',
      data: { id: 'purge-synced' },
      localUpdatedAt: Date.now(),
      userId: 'u1',
    })
    await enqueueChange({
      table: 'chapters',
      operation: 'update',
      data: { id: 'keep-pending' },
      localUpdatedAt: Date.now(),
      userId: 'u1',
    })

    const all = await readAll()
    const toSync = all.find(i => (i.data as { id: string }).id === 'purge-synced')!
    await markSynced([toSync.id])
    await clearSyncedItems()

    const remaining = await readAll()
    expect(remaining.some(i => (i.data as { id: string }).id === 'purge-synced')).toBe(false)
    expect(remaining.some(i => (i.data as { id: string }).id === 'keep-pending')).toBe(true)
  })
})
