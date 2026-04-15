'use client'

import { useState } from 'react'
import { useSync } from '@/lib/hooks/useSync'

/**
 * Sync status icon for Dashboard top-right.
 * D-41: ✓ synced, ↻ syncing, ⚠ offline
 * D-42: Clickable - shows details / manual retry option
 */
export function SyncStatusIcon() {
  const { status, lastSynced, retry, isOnline } = useSync()
  const [showDetails, setShowDetails] = useState(false)

  if (!isOnline) {
    return (
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        title="离线模式"
      >
        <span className="text-lg" title="离线">⚠</span>
      </button>
    )
  }

  if (status === 'syncing') {
    return (
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
        title="同步中..."
      >
        <span className="animate-spin" title="同步中">↻</span>
      </button>
    )
  }

  // Default: synced
  return (
    <button
      onClick={() => setShowDetails(!showDetails)}
      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
      title={`已同步: ${lastSynced ? new Date(lastSynced).toLocaleTimeString() : '未知'}`}
    >
      <span title="已同步">✓</span>
    </button>
  )
}