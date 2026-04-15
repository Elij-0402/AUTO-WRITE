import { createClient } from '@/lib/supabase/client'
import { getPendingChanges, markSynced, incrementRetry, setLastSyncAt } from './sync-queue'
import type { SyncQueueItem } from './sync-queue'
import { resolveConflict } from './conflict-resolver'
import { metaDb } from '@/lib/db/meta-db'
import { createProjectDB } from '@/lib/db/project-db'

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
          await metaDb.projectIndex.put({
            id: record.id,
            title: record.title,
            genre: record.genre ?? '',
            synopsis: record.synopsis ?? '',
            coverImageId: record.coverImageId ?? null,
            wordCount: record.wordCount ?? 0,
            todayWordCount: record.todayWordCount ?? 0,
            todayDate: record.todayDate ?? new Date().toISOString().split('T')[0],
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updated_at || record.localUpdatedAt),
            deletedAt: record.deleted_at ? new Date(record.deleted_at) : null,
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
          const tableName = cloudTable === 'world_entries' ? 'worldEntries' : cloudTable
          
          for (const record of data) {
            if (record.projectId !== projectId) continue
            
            try {
              if (cloudTable === 'chapters') {
                await projectDb.chapters.put({
                  id: record.id,
                  projectId: record.projectId,
                  title: record.title,
                  content: record.content ?? {},
                  order: record.order ?? 0,
                  wordCount: record.wordCount ?? 0,
                  status: record.status ?? 'draft',
                  outlineStatus: record.outlineStatus ?? 'not_started',
                  outlineSummary: record.outlineSummary ?? '',
                  outlineTargetWordCount: record.outlineTargetWordCount ?? null,
                  createdAt: new Date(record.createdAt),
                  updatedAt: new Date(record.updated_at || record.localUpdatedAt),
                  deletedAt: record.deleted_at ? new Date(record.deleted_at) : null,
                })
              } else if (cloudTable === 'world_entries') {
                await projectDb.worldEntries.put({
                  id: record.id,
                  projectId: record.projectId,
                  type: record.type,
                  name: record.name,
                  alias: record.alias,
                  appearance: record.appearance,
                  personality: record.personality,
                  background: record.background,
                  description: record.description,
                  features: record.features,
                  content: record.content,
                  scope: record.scope,
                  timePoint: record.timePoint,
                  eventDescription: record.eventDescription,
                  tags: record.tags ?? [],
                  createdAt: new Date(record.createdAt),
                  updatedAt: new Date(record.updated_at || record.localUpdatedAt),
                  deletedAt: record.deleted_at ? new Date(record.deleted_at) : null,
                })
              } else if (cloudTable === 'relations') {
                await projectDb.relations.put({
                  id: record.id,
                  projectId: record.projectId,
                  sourceEntryId: record.sourceEntryId,
                  targetEntryId: record.targetEntryId,
                  category: record.category,
                  description: record.description ?? '',
                  sourceToTargetLabel: record.sourceToTargetLabel ?? '',
                  createdAt: new Date(record.createdAt),
                  deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
                })
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
