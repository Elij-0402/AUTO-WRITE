'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

/**
 * Consistency warning card for displaying detected contradictions.
 * Per UI-SPEC: amber styling to visually distinguish warnings.
 */
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
    <div
      className={`
        border border-l-4 border-amber-500 rounded-lg p-3
        bg-amber-100 dark:bg-amber-900
        ${dismissed ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* Header with icon and entry info */}
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="font-semibold text-stone-900 dark:text-stone-100">
          {contradiction.entryName}
        </span>
        <span className="text-stone-400 dark:text-stone-500">—</span>
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {contradiction.entryType === 'character' ? '角色' :
           contradiction.entryType === 'location' ? '地点' :
           contradiction.entryType === 'rule' ? '规则' : '时间线'}
        </span>
      </div>

      {/* Contradiction description */}
      <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">
        {contradiction.description}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleIgnore}
          disabled={dismissed}
        >
          忽略
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleIntentional}
          disabled={dismissed}
        >
          有意为之
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={onFixWorldEntry}
          disabled={dismissed}
        >
          修改世界观
        </Button>
      </div>
    </div>
  )
}