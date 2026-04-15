'use client'

import { useEffect, useRef } from 'react'
import { flushSyncQueue, retryFailedSync } from '@/lib/sync/sync-engine'
import { useSync } from '@/lib/hooks/useSync'
import { enqueueChange } from '@/lib/sync/sync-queue'

const SYNC_INTERVAL = 30000 // D-30: 30 seconds

/**
 * Sync manager - runs in background, flushes queue every 30 seconds.
 * Per D-31: Sync triggers: 30-second timer + immediate on new project creation.
 */
export function SyncManager() {
  const { setStatus, setLastSynced } = useSync()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // D-34: Listen for network recovery to trigger sync
    const handleOnline = () => {
      // Network recovered - retry failed syncs
      retryFailedSync().then(({ synced }) => {
        if (synced > 0) {
          setLastSynced(Date.now())
        }
      })
    }

    window.addEventListener('online', handleOnline)

    // Start 30-second sync interval
    intervalRef.current = setInterval(async () => {
      if (!navigator.onLine) return

      setStatus('syncing')
      const result = await flushSyncQueue()
      
      if (result.failed === 0) {
        setStatus('synced')
        setLastSynced(Date.now())
      } else {
        setStatus('error')
      }
    }, SYNC_INTERVAL)

    return () => {
      window.removeEventListener('online', handleOnline)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [setStatus, setLastSynced])

  return null // Invisible component
}

/**
 * Hook to trigger immediate sync (e.g., on new project creation).
 * Per D-37: New project sync: immediate sync on creation.
 */
export async function triggerImmediateSync(
  table: string,
  operation: 'create' | 'update' | 'delete',
  data: Record<string, unknown>,
  userId: string
): Promise<void> {
  // D-31: Immediate sync trigger
  await enqueueChange({
    table,
    operation,
    data,
    localUpdatedAt: Date.now(),
    userId,
  })
  
  // Trigger immediate flush
  await flushSyncQueue()
}