'use client'

import { SyncManager } from '@/components/sync/SyncManager'

export default function AuthenticatedLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <SyncManager />
    </>
  )
}
