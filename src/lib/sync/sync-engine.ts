import { createClient } from '@/lib/supabase/client'
import { getPendingChanges, getRetryableItems, markSynced, markFailed, setLastSyncAt, clearSyncedItems } from './sync-queue'
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
  conversations: 'conversations',
  // NOT synced: aiConfig (D-48)
}

const SYNC_BATCH_SIZE = 50

/**
 * Flush pending changes to Supabase.
 * Called every 30 seconds by SyncManager.
 *
 * Drains up to `maxDurationMs` worth of pending items in batches, so a user
 * who comes back online with hundreds of queued edits doesn't wait 30s per 50
 * changes to catch up.
 */
export async function flushSyncQueue(
  maxDurationMs: number = 10_000
): Promise<{ synced: number; failed: number }> {
  const supabase = createClient()
  const start = Date.now()
  let totalSynced = 0
  let totalFailed = 0

  while (Date.now() - start < maxDurationMs) {
    const pending = [...await getPendingChanges(), ...await getRetryableItems()]
    if (pending.length === 0) break

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

    if (syncedIds.length > 0) {
      await markSynced(syncedIds)
      await clearSyncedItems()
    }
    if (failedIds.length > 0) {
      await markFailed(failedIds)
    }

    totalSynced += syncedIds.length
    totalFailed += failedIds.length

    // If the whole batch failed, don't spin — let retry-with-backoff kick in.
    if (syncedIds.length === 0) break
  }

  await setLastSyncAt(Date.now())
  return { synced: totalSynced, failed: totalFailed }
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
  const cloudTables = ['project_index', 'chapters', 'world_entries', 'relations', 'messages', 'conversations']
  let merged = 0
  let errors = 0

  for (let i = 0; i < cloudTables.length; i++) {
    const cloudTable = cloudTables[i]

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
              } else if (cloudTable === 'conversations') {
                const local = mapCloudToLocal('conversations', record) as Record<string, unknown>
                await projectDb.conversations.put({
                  id: local.id as string,
                  projectId: local.projectId as string,
                  title: (local.title as string) ?? '对话',
                  createdAt: Number(local.createdAt ?? Date.now()),
                  updatedAt: Number(local.updatedAt ?? Date.now()),
                  messageCount: Number(local.messageCount ?? 0),
                  rollingSummary: local.rollingSummary as string | undefined,
                  summarizedUpTo: local.summarizedUpTo as number | undefined,
                })
              } else if (cloudTable === 'messages') {
                const local = mapCloudToLocal('messages', record) as Record<string, unknown>
                await projectDb.messages.put({
                  id: local.id as string,
                  projectId: local.projectId as string,
                  conversationId: local.conversationId as string,
                  role: local.role as 'user' | 'assistant',
                  content: local.content as string,
                  timestamp: Number(local.timestamp ?? local.createdAt ?? Date.now()),
                  hasDraft: local.hasDraft as boolean | undefined,
                  draftId: local.draftId as string | undefined,
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
