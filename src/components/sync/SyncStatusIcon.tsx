'use client'

import { Check, RefreshCw, WifiOff } from 'lucide-react'
import { useSync } from '@/lib/hooks/useSync'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SyncStatusIcon() {
  const { status, lastSynced, isOnline } = useSync()

  if (!isOnline) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-destructive">
            <WifiOff />
          </Button>
        </TooltipTrigger>
        <TooltipContent>离线模式</TooltipContent>
      </Tooltip>
    )
  }

  if (status === 'syncing') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-primary">
            <RefreshCw className="animate-spin" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>同步中…</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-[hsl(var(--success))]">
          <Check />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        已同步 {lastSynced ? new Date(lastSynced).toLocaleTimeString() : ''}
      </TooltipContent>
    </Tooltip>
  )
}
