import { createClient } from '@/lib/supabase/client'
import { getPendingChanges, markSynced, incrementRetry, setLastSyncAt, clearSyncedItems } from './sync-queue'
import type { SyncQueueItem } from './sync-queue'
import { resolveConflict } from './conflict-resolver'
import { metaDb } from '@/lib/db/meta-db'
import { createProjectDB } from '@/lib/db/project-db'
import { mapCloudToLocal, mapLocalToCloud, type TableName } from './field-mapping'

/**
 * Supabase table mapping from local table names to cloud table names.
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

// Reverse map: cloud table name -> local table name
const CLOUD_TO_LOCAL: Record<string, string> = {
  project_index: 'projectIndex',
  chapters: 'chapters',
  world_entries: 'worldEntries',
  relations: 'relations',
  messages: 'messages',
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

    // Prepare data for upsert — field-mapping owns the cloud-wire shape.
    const upsertData = mapLocalToCloud(
      item.table as TableName,
      item.data,
      item.userId,
      item.localUpdatedAt
    )

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
    // Physically remove synced rows. markSynced only flips a flag, so without
    // this call the queue grows forever (one row per local write, never GC'd).
    await clearSyncedItems()
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
 * Per D-33: Last-Write-Wins conflict resolution.
 */
export async function performInitialSync(
  userId: string,
  onProgress?: (percent: number) => void
): Promise<{ merged: number; errors: number }> {
  const supabase = createClient()
  
  // First, push any pending local changes
  await flushSyncQueue()
  
  // Then pull cloud data
  const cloudTables = ['project_index', 'chapters', 'world_entries', 'relations']
  let merged = 0
  let errors = 0

  for (let i = 0; i < cloudTables.length; i++) {
    const cloudTable = cloudTables[i]
    const localTable = CLOUD_TO_LOCAL[cloudTable]
    
    // Fetch user's cloud data for this table
    const { data, error } = await supabase
      .from(cloudTable)
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error(`Initial sync fetch error for ${cloudTable}:`, error)
      errors++
      continue
    }

    if (!data || data.length === 0) {
      // Report progress even if no data
      if (onProgress) {
        const percent = Math.round(((i + 1) / cloudTables.length) * 100)
        onProgress(percent)
      }
      continue
    }

    // Merge into local IndexedDB based on table type
    if (cloudTable === 'project_index') {
      // Write to metaDb.projectIndex
      for (const record of data) {
        try {
          const local = mapCloudToLocal('projectIndex', record) as Record<string, unknown>
          await metaDb.projectIndex.put({
            id: local.id as string,
            title: local.title as string,
            genre: (local.genre as string) ?? '',
            synopsis: (local.synopsis as string) ?? '',
            coverImageId: (local.coverImageId as string | null) ?? null,
            wordCount: (local.wordCount as number) ?? 0,
            todayWordCount: (local.todayWordCount as number) ?? 0,
            todayDate: (local.todayDate as string) ?? new Date().toISOString().split('T')[0],
            createdAt: new Date(local.createdAt as string | number),
            updatedAt: new Date(local.updatedAt as string | number),
            deletedAt: local.deletedAt ? new Date(local.deletedAt as string | number) : null,
          })
          merged++
        } catch (e) {
          console.error(`Error writing project ${record.id} to local DB:`, e)
        }
      }
    } else {
      // Per-project tables: group by projectId and write to appropriate project DB
      const projectIds = [...new Set(data.map(r => r.projectId).filter(Boolean))]

      for (const projectId of projectIds) {
        try {
          const projectDb = createProjectDB(projectId)

          for (const record of data) {
            if (record.projectId !== projectId) continue

            try {
              if (cloudTable === 'chapters') {
                const local = mapCloudToLocal('chapters', record) as Record<string, unknown>
                await projectDb.chapters.put({
                  id: local.id as string,
                  projectId: local.projectId as string,
                  title: local.title as string,
                  content: (local.content as object) ?? {},
                  order: (local.order as number) ?? 0,
                  wordCount: (local.wordCount as number) ?? 0,
                  status: (local.status as 'draft' | 'completed') ?? 'draft',
                  outlineStatus: (local.outlineStatus as 'not_started' | 'in_progress' | 'completed') ?? 'not_started',
                  outlineSummary: (local.outlineSummary as string) ?? '',
                  outlineTargetWordCount: (local.outlineTargetWordCount as number | null) ?? null,
                  createdAt: new Date(local.createdAt as string | number),
                  updatedAt: new Date(local.updatedAt as string | number),
                  deletedAt: local.deletedAt ? new Date(local.deletedAt as string | number) : null,
                })
              } else if (cloudTable === 'world_entries') {
                const local = mapCloudToLocal('worldEntries', record) as Record<string, unknown>
                await projectDb.worldEntries.put({
                  id: local.id as string,
                  projectId: local.projectId as string,
                  type: local.type,
                  name: local.name as string,
                  alias: local.alias,
                  appearance: local.appearance,
                  personality: local.personality,
                  background: local.background,
                  description: local.description,
                  features: local.features,
                  content: local.content,
                  scope: local.scope,
                  timePoint: local.timePoint,
                  eventDescription: local.eventDescription,
                  tags: (local.tags as string[]) ?? [],
                  createdAt: new Date(local.createdAt as string | number),
                  updatedAt: new Date(local.updatedAt as string | number),
                  deletedAt: local.deletedAt ? new Date(local.deletedAt as string | number) : null,
                } as Parameters<typeof projectDb.worldEntries.put>[0])
              } else if (cloudTable === 'relations') {
                const local = mapCloudToLocal('relations', record) as Record<string, unknown>
                await projectDb.relations.put({
                  id: local.id as string,
                  projectId: local.projectId as string,
                  sourceEntryId: local.sourceEntryId as string,
                  targetEntryId: local.targetEntryId as string,
                  category: local.category,
                  description: (local.description as string) ?? '',
                  sourceToTargetLabel: (local.sourceToTargetLabel as string) ?? '',
                  createdAt: new Date(local.createdAt as string | number),
                  deletedAt: local.deletedAt ? new Date(local.deletedAt as string | number) : null,
                } as Parameters<typeof projectDb.relations.put>[0])
              }
              merged++
            } catch (e) {
              console.error(`Error writing ${cloudTable} record ${record.id}:`, e)
            }
          }
        } catch (e) {
          console.error(`Error opening project DB ${projectId}:`, e)
          errors++
        }
      }
    }

    // Report progress (D-43: Initial sync show progress bar)
    if (onProgress) {
      const percent = Math.round(((i + 1) / cloudTables.length) * 100)
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
 * An item is eligible to retry only after BASE_RETRY_DELAY * 2^retryCount ms
 * have passed since its last failed attempt (tracked via lastRetryAt).
 */
export async function retryFailedSync(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingChanges()
  const now = Date.now()
  const eligible = pending.filter(p => {
    if (p.retryCount === 0 || p.retryCount >= MAX_RETRIES) return false
    const delay = BASE_RETRY_DELAY * Math.pow(2, p.retryCount)
    const lastRetryAt = p.lastRetryAt ?? 0
    return now - lastRetryAt >= delay
  })

  if (eligible.length === 0) {
    return { synced: 0, failed: 0 }
  }

  // flushSyncQueue reads the pending queue itself and will pick up the
  // eligible items (plus any brand-new ones) in this pass. Calling it once
  // is enough; the previous loop-per-item implementation was redundant.
  return flushSyncQueue()
}
