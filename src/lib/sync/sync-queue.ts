import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

/**
 * Sync queue database for tracking local changes pending cloud sync.
 * Per D-29: local-first architecture - all writes go to IndexedDB first,
 * then async sync to cloud.
 */
interface SyncQueueDB extends DBSchema {
  queue: {
    key: string
    value: SyncQueueItem
    indexes: { 'by-table': string; 'by-synced': number }
  }
  meta: {
    key: string
    value: {
      key: string
      lastSyncAt: number
      syncVersion: number
    }
  }
}

export interface SyncQueueItem {
  id: string
  table: string  // 'projectIndex' | 'chapters' | 'worldEntries' | 'relations' | etc.
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  localUpdatedAt: number
  userId: string
  synced: boolean
  retryCount: number
}

let dbPromise: Promise<IDBPDatabase<SyncQueueDB>> | null = null

function getQueueDB(): Promise<IDBPDatabase<SyncQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SyncQueueDB>('inkforge-sync-queue', 1, {
      upgrade(db) {
        const store = db.createObjectStore('queue', { keyPath: 'id' })
        store.createIndex('by-table', 'table')
        store.createIndex('by-synced', 'synced')
        db.createObjectStore('meta', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

/**
 * Add a change to the sync queue.
 * Called after every IndexedDB write.
 */
export async function enqueueChange(item: Omit<SyncQueueItem, 'id' | 'synced' | 'retryCount'>): Promise<void> {
  const db = await getQueueDB()
  const queueItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    synced: false,
    retryCount: 0,
  }
  await db.add('queue', queueItem)
}

/**
 * Get all pending (not-yet-synced) items from the queue.
 */
export async function getPendingChanges(): Promise<SyncQueueItem[]> {
  const db = await getQueueDB()
  return db.getAllFromIndex('queue', 'by-synced', 0)
}

/**
 * Mark items as synced after successful cloud upload.
 */
export async function markSynced(ids: string[]): Promise<void> {
  const db = await getQueueDB()
  const tx = db.transaction('queue', 'readwrite')
  for (const id of ids) {
    const item = await tx.store.get(id)
    if (item) {
      item.synced = true
      await tx.store.put(item)
    }
  }
  await tx.done
}

/**
 * Increment retry count on failed sync items.
 */
export async function incrementRetry(ids: string[]): Promise<void> {
  const db = await getQueueDB()
  const tx = db.transaction('queue', 'readwrite')
  for (const id of ids) {
    const item = await tx.store.get(id)
    if (item) {
      item.retryCount++
      await tx.store.put(item)
    }
  }
  await tx.done
}

/**
 * Get last sync timestamp.
 */
export async function getLastSyncAt(): Promise<number | null> {
  const db = await getQueueDB()
  const meta = await db.get('meta', 'lastSync')
  return meta?.lastSyncAt ?? null
}

/**
 * Update last sync timestamp and version.
 */
export async function setLastSyncAt(timestamp: number): Promise<void> {
  const db = await getQueueDB()
  await db.put('meta', { key: 'lastSync', lastSyncAt: timestamp, syncVersion: Date.now() })
}

/**
 * Clear all synced items from queue (cleanup).
 * Called after successful batch sync.
 */
export async function clearSyncedItems(): Promise<void> {
  const db = await getQueueDB()
  const tx = db.transaction('queue', 'readwrite')
  const index = tx.store.index('by-synced')
  let cursor = await index.openCursor(1) // synced = true
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}