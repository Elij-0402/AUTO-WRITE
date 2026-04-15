'use client'

import { createClient } from '@/lib/supabase/client'
import { getLastSyncAt } from '@/lib/sync/sync-queue'
import { useEffect, useState } from 'react'

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline'

interface UseSyncReturn {
  status: SyncStatus
  lastSynced: number | null
  isOnline: boolean
  setStatus: (status: SyncStatus) => void
  setLastSynced: (timestamp: number) => void
  retry: () => Promise<void>
}

export function useSync(): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [lastSynced, setLastSynced] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Load last sync timestamp
    getLastSyncAt().then(ts => setLastSynced(ts))

    // Monitor online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setStatus('offline')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for auth changes to update sync state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setStatus('syncing')
      } else if (event === 'SIGNED_OUT') {
        setStatus('synced')
        setLastSynced(null)
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      subscription.unsubscribe()
    }
  }, [supabase])

  async function retry() {
    setStatus('syncing')
    const { flushSyncQueue } = await import('@/lib/sync/sync-engine')
    const result = await flushSyncQueue()
    if (result.failed === 0) {
      setStatus('synced')
      setLastSynced(Date.now())
    } else {
      setStatus('error')
    }
  }

  return { status, lastSynced, isOnline, setStatus, setLastSynced, retry }
}