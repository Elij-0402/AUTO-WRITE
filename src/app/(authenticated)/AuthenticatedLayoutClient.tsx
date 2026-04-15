'use client'

import { SyncManager } from '@/components/sync/SyncManager'
import { SyncProgress } from '@/components/sync/SyncProgress'
import { useSyncExternalStore } from 'react'

// Client-only mounted check using useSyncExternalStore (compiler-safe)
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function AuthenticatedLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const mounted = useMounted()

  if (!mounted) {
    return <>{children}</>
  }

  // Only show SyncProgress once per browser session
  const hasSynced = sessionStorage.getItem('inkforge_initial_sync_done')

  return (
    <>
      {children}
      {!hasSynced && <SyncProgress />}
      <SyncManager />
    </>
  )
}
