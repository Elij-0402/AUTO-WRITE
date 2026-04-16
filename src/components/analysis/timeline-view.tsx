'use client'

import type { WorldEntry } from '@/lib/types'

interface TimelineViewProps {
  entries: WorldEntry[]
}

/**
 * Simple chronological list of timeline entries. We deliberately don't try
 * to parse free-text time points (e.g. "第三年春") into real dates — users
 * write these in arbitrary in-world calendars. Instead we sort lexicographic
 * with a natural-number-aware comparator so "第1年" < "第10年".
 */
export function TimelineView({ entries }: TimelineViewProps) {
  const timeline = entries
    .filter(e => e.type === 'timeline' && !e.deletedAt)
    .sort((a, b) => naturalCompare(a.timePoint ?? '', b.timePoint ?? ''))

  if (timeline.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <p className="text-sm font-medium mb-1">暂无时间线条目</p>
        <p className="text-xs text-muted-foreground">
          在世界观中创建「时间线」类型的条目，设定「时间点」字段后会按顺序排列。
        </p>
      </div>
    )
  }

  return (
    <ol className="relative border-l border-border ml-2">
      {timeline.map(entry => (
        <li key={entry.id} className="pl-4 pb-5">
          <span className="absolute -left-1.5 w-3 h-3 bg-purple-500 rounded-full ring-4 ring-background" />
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                {entry.timePoint || '(未设置时间)'}
              </span>
              <span className="text-sm font-medium">{entry.name}</span>
            </div>
            {entry.eventDescription && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {entry.eventDescription}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function naturalCompare(a: string, b: string): number {
  const ax: Array<string | number> = []
  const bx: Array<string | number> = []
  a.replace(/(\d+)|(\D+)/g, (_, num, str) => {
    ax.push(num ? Number(num) : str)
    return ''
  })
  b.replace(/(\d+)|(\D+)/g, (_, num, str) => {
    bx.push(num ? Number(num) : str)
    return ''
  })

  while (ax.length && bx.length) {
    const an = ax.shift()!
    const bn = bx.shift()!
    if (typeof an === 'number' && typeof bn === 'number') {
      if (an !== bn) return an - bn
    } else {
      const cmp = String(an).localeCompare(String(bn), 'zh-CN')
      if (cmp !== 0) return cmp
    }
  }
  return ax.length - bx.length
}
