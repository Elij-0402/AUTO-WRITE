'use client'

import { createClient } from '@/lib/supabase/client'
import { SyncManager } from '@/components/sync/SyncManager'
import { SyncProgress } from '@/components/sync/SyncProgress'
import { useEffect, useState } from 'react'

export default function AuthenticatedLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [showInitialSync, setShowInitialSync] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Only show SyncProgress once per browser session
    const hasSynced = sessionStorage.getItem('inkforge_initial_sync_done')
    if (!hasSynced) {
      setShowInitialSync(true)
    }
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      {showInitialSync && <SyncProgress />}
      <SyncManager />
    </>
  )
}
