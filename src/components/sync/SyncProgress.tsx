'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { performInitialSync } from '@/lib/sync/sync-engine'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SyncProgress() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing')
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    async function runInitialSync() {
      try {
        const result = await performInitialSync(user?.id || '', setProgress)
        setStatus(result.errors > 0 ? 'error' : 'done')
        sessionStorage.setItem('inkforge_initial_sync_done', 'true')
      } catch {
        setStatus('error')
      }
    }

    runInitialSync()
  }, [user])

  if (status === 'done') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">同步完成</h3>
            <p className="text-muted-foreground text-sm">正在跳转...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">同步遇到问题</h3>
            <p className="text-muted-foreground text-sm mb-4">部分数据未能同步，将在下次连接时重试</p>
            <Button onClick={() => window.location.reload()}>
              继续
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="max-w-sm w-full mx-4">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">首次同步</h3>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-sm">{progress}%</p>
          <p className="text-muted-foreground text-xs mt-2">正在同步您的项目数据...</p>
        </CardContent>
      </Card>
    </div>
  )
}
