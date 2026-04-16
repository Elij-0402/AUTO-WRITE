'use client'

import { useState } from 'react'
import { Check, RefreshCw, WifiOff } from 'lucide-react'
import { useSync } from '@/lib/hooks/useSync'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SyncStatusIcon() {
  const { status, lastSynced, retry, isOnline } = useSync()

  if (!isOnline) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600">
            <WifiOff className="h-4 w-4" />
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>同步中...</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
          <Check className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        已同步 {lastSynced ? new Date(lastSynced).toLocaleTimeString() : ''}
      </TooltipContent>
    </Tooltip>
  )
}
