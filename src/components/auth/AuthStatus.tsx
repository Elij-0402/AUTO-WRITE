'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { AuthDropdown } from './AuthDropdown'
import { SyncStatusIcon } from '@/components/sync/SyncStatusIcon'

export function AuthStatus() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="w-8" />
  }

  if (!user) {
    return null // Should not Render for unauthenticated users (protected routes)
  }

  return (
    <div className="flex items-center gap-4">
      <SyncStatusIcon />
      <AuthDropdown userEmail={user.email || ''} />
    </div>
  )
}
