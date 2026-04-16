'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

export function ConsistencyWarningCard({
  contradiction,
  onIgnore,
  onIntentional,
  onFixWorldEntry
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
    <Card
      className={cn(
        'shadow-none border-amber-500/30 bg-amber-500/5',
        dismissed && 'opacity-50'
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          <span className="font-semibold text-sm">
            {contradiction.entryName}
          </span>
          <span className="text-muted-foreground">—</span>
          <span className="text-xs text-muted-foreground">
            {contradiction.entryType === 'character' ? '角色' :
              contradiction.entryType === 'location' ? '地点' :
                contradiction.entryType === 'rule' ? '规则' : '时间线'}
          </span>
        </div>

        <p className="text-sm text-foreground/80">
          {contradiction.description}
        </p>

        <div className="flex gap-2 flex-wrap pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleIgnore}
            disabled={dismissed}
          >
            忽略
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleIntentional}
            disabled={dismissed}
          >
            有意为之
          </Button>
          <Button
            size="sm"
            onClick={onFixWorldEntry}
            disabled={dismissed}
          >
            修改世界观
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
