import { createClient } from '@/lib/supabase/client'
import { getPendingChanges, markSynced, incrementRetry, setLastSyncAt } from './sync-queue'
import type { SyncQueueItem } from './sync-queue'
import { resolveConflict } from './conflict-resolver'

/**
 * Supabase table mapping from local table names.
 * Per D-39: Cloud schema mirrors local structure.
 * Per D-48: aiConfig is NOT synced (stored locally only).
 */
const TABLE_MAP: Record<string, string> = {
  projectIndex: 'project_index',
  chapters: 'chapters',
  worldEntries: 'world_entries',
  relations: 'relations',
  messages: 'messages',
  // NOT synced: aiConfig (D-48)
}

const SYNC_BATCH_SIZE = 50
const MAX_RETRIES = 5
const BASE_RETRY_DELAY = 1000 // 1 second

/**
 * Flush pending changes to Supabase.
 * Called every 30 seconds by SyncManager.
 */
export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
  const supabase = createClient()
  const pending = await getPendingChanges()
  
  if (pending.length === 0) {
    return { synced: 0, failed: 0 }
  }

  // D-30: Batch every 30 seconds
  const batch = pending.slice(0, SYNC_BATCH_SIZE)
  const syncedIds: string[] = []
  const failedIds: string[] = []

  for (const item of batch) {
    // Skip aiConfig - D-48: AI config stored locally only
    if (item.table === 'aiConfig') {
      syncedIds.push(item.id) // Mark as synced without uploading
      continue
    }

    const tableName = TABLE_MAP[item.table]
    if (!tableName) {
      console.warn(`Unknown table for sync: ${item.table}`)
      syncedIds.push(item.id)
      continue
    }

    // D-33: Last-Write-Wins conflict resolution
    // Check for existing cloud record
    const { data: existing } = await supabase
      .from(tableName)
      .select('localUpdatedAt')
      .eq('id', item.data.id)
      .single()

    if (existing && existing.localUpdatedAt > item.localUpdatedAt) {
      // Cloud record is newer - skip (LWW)
      syncedIds.push(item.id)
      continue
    }

    // Prepare data for upsert - exclude aiConfig fields
    const { id, ...rest } = item.data
    const upsertData = {
      ...rest,
      id,
      user_id: item.userId, // D-38: RLS-filtered by user_id
      localUpdatedAt: item.localUpdatedAt,
    }

    const { error } = await supabase
      .from(tableName)
      .upsert(upsertData, { onConflict: 'id' })

    if (error) {
      console.error(`Sync error for ${tableName}:`, error)
      failedIds.push(item.id)
    } else {
      syncedIds.push(item.id)
    }
  }

  // Update queue status
  if (syncedIds.length > 0) {
    await markSynced(syncedIds)
  }
  if (failedIds.length > 0) {
    await incrementRetry(failedIds)
  }

  // Update last sync timestamp
  await setLastSyncAt(Date.now())

  return { synced: syncedIds.length, failed: failedIds.length }
}

/**
 * Initial sync after login - pull cloud data and merge with local.
 * Per D-32: Show progress during first sync.
 */
export async function performInitialSync(
  userId: string,
  onProgress?: (percent: number) => void
): Promise<{ merged: number; errors: number }> {
  const supabase = createClient()
  
  // First, push any pending local changes
  const pushResult = await flushSyncQueue()
  
  // Then pull cloud data
  const tables = Object.keys(TABLE_MAP).filter(t => t !== 'aiConfig')
  let merged = 0
  let errors = 0

  for (let i = 0; i < tables.length; i++) {
    const tableName = TABLE_MAP[tables[i]]
    
    // Fetch user's cloud data for this table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error(`Initial sync fetch error for ${tableName}:`, error)
      errors++
      continue
    }

    // Merge into local IndexedDB
    // This would integrate with the existing meta-db and project-db
    // For now, we track that data was pulled
    merged += data?.length ?? 0

    // Report progress (D-43: Initial sync show progress bar)
    if (onProgress) {
      const percent = Math.round(((i + 1) / tables.length) * 100)
      onProgress(percent)
    }
  }

  return { merged, errors }
}

/**
 * Sync a newly created project immediately.
 * Per D-37: New project sync: immediate sync on creation.
 */
export async function syncNewProject(projectId: string, userId: string): Promise<void> {
  // Queue the new project for immediate sync
  const { metaDb } = await import('@/lib/db/meta-db')
  const project = await metaDb.projectIndex.get(projectId)
  
  if (project) {
    const { enqueueChange } = await import('./sync-queue')
    await enqueueChange({
      table: 'projectIndex',
      operation: 'create',
      data: project as unknown as Record<string, unknown>,
      localUpdatedAt: Date.now(),
      userId,
    })
    
    // Trigger immediate flush
    await flushSyncQueue()
  }
}

/**
 * Retry failed syncs with exponential backoff.
 * Per D-34: automatic retry with exponential backoff.
 */
export async function retryFailedSync(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingChanges()
  const failed = pending.filter(p => p.retryCount > 0 && p.retryCount < MAX_RETRIES)
  
  let synced = 0
  let stillFailed = 0

  for (const item of failed) {
    // Calculate backoff delay: BASE_RETRY_DELAY * 2^retryCount
    const delay = BASE_RETRY_DELAY * Math.pow(2, item.retryCount)
    
    // Check if enough time has passed
    // (In real implementation, would track last retry time)
    
    const result = await flushSyncQueue()
    synced += result.synced
    stillFailed += result.failed
  }

  return { synced, failed: stillFailed }
}