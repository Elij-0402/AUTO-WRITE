'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { performInitialSync } from '@/lib/sync/sync-engine'

/**
 * Initial sync progress indicator.
 * D-32: First sync starts immediately after login, show progress
 * D-43: Show progress bar/percentage
 */
export function SyncProgress() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing')
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    async function runInitialSync() {
      try {
        const result = await performInitialSync(user.id, setProgress)
        setStatus(result.errors > 0 ? 'error' : 'done')
        // Mark initial sync as done so we don't show again this session
        sessionStorage.setItem('inkforge_initial_sync_done', 'true')
      } catch {
        setStatus('error')
      }
    }

    runInitialSync()
  }, [user])

  if (status === 'done') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
          <div className="text-green-500 text-4xl mb-2">✓</div>
          <h3 className="text-lg font-semibold mb-2">同步完成</h3>
          <p className="text-gray-600 text-sm">正在跳转...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
          <div className="text-yellow-500 text-4xl mb-2">⚠</div>
          <h3 className="text-lg font-semibold mb-2">同步遇到问题</h3>
          <p className="text-gray-600 text-sm mb-4">部分数据未能同步，将在下次连接时重试</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            继续
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <h3 className="text-lg font-semibold mb-4">首次同步</h3>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-600 text-sm">{progress}%</p>
        <p className="text-gray-500 text-xs mt-2">正在同步您的项目数据...</p>
      </div>
    </div>
  )
}
