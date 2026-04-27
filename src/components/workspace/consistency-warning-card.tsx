'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorldEntryType } from '@/lib/types'

export interface Contradiction {
  entryName: string
  entryType: WorldEntryType
  description: string
}

export interface ConsistencyWarningCardProps {
  contradiction: Contradiction
  onIgnore: () => void
  onIntentional: () => void
  onFixWorldEntry: () => void
}

const TYPE_LABEL: Record<WorldEntryType, string> = {
  character: '角色',
  faction: '势力',
  location: '地点',
  rule: '规则',
  secret: '秘密',
  event: '事件',
  timeline: '时间线',
}

export function ConsistencyWarningCard({
  contradiction,
  onIgnore,
  onIntentional,
  onFixWorldEntry,
}: ConsistencyWarningCardProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleIgnore = () => {
    setDismissed(true)
    onIgnore()
  }
  const handleIntentional = () => {
    setDismissed(true)
    onIntentional()
  }

  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-card)] surface-2 film-edge p-3 pl-4 animate-fade-up',
        dismissed && 'opacity-40'
      )}
    >
      <div
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[hsl(var(--accent-coral))]/75"
      />
      <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent-coral))]">
        <AlertTriangle className="w-3 h-3" />
        <span>一致性警告</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="font-medium text-[13px] text-foreground">
          {contradiction.entryName}
        </span>
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
          {TYPE_LABEL[contradiction.entryType]}
        </span>
      </div>
      <p className="text-[12.5px] leading-[1.7] text-foreground/85 mb-2.5">
        {contradiction.description}
      </p>
      <div className="flex justify-end gap-2 flex-wrap">
        <Button size="sm" variant="ghost" onClick={handleIgnore} disabled={dismissed}>
          忽略
        </Button>
        <Button size="sm" variant="ghost" onClick={handleIntentional} disabled={dismissed}>
          有意为之
        </Button>
        <Button size="sm" onClick={onFixWorldEntry} disabled={dismissed}>
          去修改
        </Button>
      </div>
    </div>
  )
}
