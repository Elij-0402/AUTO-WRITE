import { describe, it, expect } from 'vitest'
import { enqueueChange, markFailed, markSynced, clearSyncedItems, type SyncQueueItem } from './sync-queue'

async function readAll(): Promise<SyncQueueItem[]> {
  const { openDB } = await import('idb')
  const db = await openDB('inkforge-sync-queue', 1)
  const all = (await db.getAll('queue')) as SyncQueueItem[]
  db.close()
  return all
}

describe('sync-queue', () => {
  it('markFailed sets failed=true on items', async () => {
    await enqueueChange({
      table: 'chapters',
      operation: 'update',
      data: { id: 'fail-test-x' },
      localUpdatedAt: Date.now(),
      userId: 'u1',
    })
    const items = await readAll()
    const item = items.find(i => (i.data as { id: string }).id === 'fail-test-x')!
    expect(item).toBeDefined()
    expect(item.failed).toBeUndefined()

    await markFailed([item.id])

    const refreshed = await readAll()
    const marked = refreshed.find(i => i.id === item.id)!
    expect(marked.failed).toBe(true)
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
