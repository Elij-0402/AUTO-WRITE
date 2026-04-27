'use client'

import type { WorldEntry } from '@/lib/types'

interface TimelineViewProps {
  entries: WorldEntry[]
  trackerCountsByEntryId?: Record<string, number>
}

/**
 * Simple chronological list of timeline entries. We deliberately don't try
 * to parse free-text time points (e.g. "第三年春") into real dates — users
 * write these in arbitrary in-world calendars. Instead we sort lexicographic
 * with a natural-number-aware comparator so "第1年" < "第10年".
 */
export function TimelineView({
  entries,
  trackerCountsByEntryId = {},
}: TimelineViewProps) {
  const timeline = entries
    .filter(e => (e.type === 'timeline' || e.type === 'event') && !e.deletedAt)
    .sort(compareStoryEntries)

  if (timeline.length === 0) {
    return (
      <div className="rounded-md border border-border bg-[hsl(var(--surface-1))] p-8 text-center">
        <p className="mb-1 text-sm font-medium">暂无时间线条目</p>
        <p className="text-xs text-muted-foreground">
          在故事圣经中创建「事件」或「时间线」条目，补充时间点后会按顺序排列。
        </p>
      </div>
    )
  }

  return (
    <ol className="relative ml-2 border-l border-border">
      {timeline.map(entry => (
        <li key={entry.id} className="pb-5 pl-4">
          <span className="absolute -left-1.5 h-3 w-3 rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--surface-1))]" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xs text-muted-foreground">
                {entry.timePoint || '(未设置时间)'}
              </span>
              <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {entry.type === 'event' ? '事件' : '时间线'}
              </span>
              <span className="text-sm font-medium">{entry.name}</span>
              {trackerCountsByEntryId[entry.id] ? (
                <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-foreground">
                  {trackerCountsByEntryId[entry.id]} 个追踪
                </span>
              ) : null}
            </div>
            {entry.eventDescription && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {entry.eventDescription}
              </p>
            )}
            {!entry.eventDescription && entry.eventImpact && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {entry.eventImpact}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function compareStoryEntries(a: WorldEntry, b: WorldEntry): number {
  const aOrder = a.timeOrder ?? Number.MAX_SAFE_INTEGER
  const bOrder = b.timeOrder ?? Number.MAX_SAFE_INTEGER
  if (aOrder !== bOrder) return aOrder - bOrder

  const timePointCompare = naturalCompare(a.timePoint ?? '', b.timePoint ?? '')
  if (timePointCompare !== 0) return timePointCompare

  return a.name.localeCompare(b.name, 'zh-CN')
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
