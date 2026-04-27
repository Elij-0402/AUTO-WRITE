'use client'

import type { WorldEntry, WorldEntryType } from '@/lib/types'

const OVERVIEW_BUCKETS: Array<{ type: WorldEntryType; label: string }> = [
  { type: 'character', label: '角色' },
  { type: 'faction', label: '势力' },
  { type: 'location', label: '地点' },
  { type: 'rule', label: '规则' },
  { type: 'secret', label: '秘密' },
  { type: 'event', label: '事件' },
  { type: 'timeline', label: '时间线' },
]

interface StoryBibleOverviewProps {
  entriesByType: Record<WorldEntryType, WorldEntry[]>
  trackerCounts: {
    unresolvedTrackers: number
    unresolvedStates: number
  }
}

export function StoryBibleOverview({
  entriesByType,
  trackerCounts,
}: StoryBibleOverviewProps) {
  const totalEntries = OVERVIEW_BUCKETS.reduce(
    (sum, bucket) => sum + (entriesByType[bucket.type]?.length ?? 0),
    0
  )

  return (
    <section className="space-y-3 border-b border-border px-3 py-3 surface-1">
      <div className="space-y-1">
        <h2 className="text-[13px] font-medium text-foreground">故事圣经概览</h2>
        <p className="text-[11px] leading-5 text-muted-foreground">
          <span>实体分桶</span> {totalEntries} · <span>未解决追踪</span> {trackerCounts.unresolvedTrackers} · <span>状态挂账</span> {trackerCounts.unresolvedStates}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {OVERVIEW_BUCKETS.map(({ type, label }) => (
          <div
            key={type}
            className="rounded-md border border-border bg-[hsl(var(--surface-2))] px-3 py-2"
          >
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="mt-1 text-[15px] text-foreground tabular-nums">
              {entriesByType[type]?.length ?? 0}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
