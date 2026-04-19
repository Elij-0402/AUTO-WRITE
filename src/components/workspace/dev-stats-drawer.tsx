'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Activity } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createProjectDB } from '@/lib/db/project-db'
import {
  getDevStats,
  isDevStatsEmpty,
  type ContradictionTopEntry,
  type DevStats,
} from '@/lib/db/dev-stats-queries'
import {
  getRecentIndexerLatency,
  subscribeIndexerLatency,
  type IndexerLatencyEntry,
} from '@/lib/rag/indexer-latency'
import type { WorldEntryType } from '@/lib/types'

interface DevStatsDrawerProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TYPE_LABEL: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间线',
}

export function DevStatsDrawer({ projectId, open, onOpenChange }: DevStatsDrawerProps) {
  const stats = useLiveQuery<DevStats | undefined>(
    () => {
      if (!open) return Promise.resolve(undefined)
      const db = createProjectDB(projectId)
      return getDevStats(db, projectId)
    },
    [projectId, open]
  )

  const latency = useIndexerLatency(projectId)
  const empty = stats ? isDevStatsEmpty(stats) && latency.length === 0 : false

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[240px] p-0 flex flex-col"
        aria-describedby={undefined}
      >
        <SheetHeader className="px-4 py-3 divider-hair">
          <SheetTitle className="text-[11px] font-medium flex items-center gap-2 uppercase tracking-[0.18em] text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-[hsl(var(--accent-cinnabar))]" />
            开发者统计
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {!stats ? (
            <LoadingState />
          ) : empty ? (
            <EmptyState />
          ) : (
            <>
              <UsageSection stats={stats} />
              <ContradictionSection entries={stats.contradictions} />
              <IndexerSection entries={latency} />
              {stats.limitHit && (
                <p className="px-4 py-2 text-[10.5px] text-[hsl(var(--accent-coral))] uppercase tracking-[0.15em]">
                  ⚠ 采样达 1000 条上限
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function useIndexerLatency(projectId: string): IndexerLatencyEntry[] {
  const getSnapshot = useCallback(() => getRecentIndexerLatency(projectId), [projectId])
  return useSyncExternalStore(subscribeIndexerLatency, getSnapshot, () => [])
}

function LoadingState() {
  return (
    <div className="p-8 text-center text-[11.5px] text-faint animate-fade-in">
      读取中…
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center text-[11.5px] text-faint leading-[1.9] animate-fade-in">
      暂无足够数据
      <br />
      （建议至少使用 1 次）
    </div>
  )
}

function SectionHeading({ label, unit }: { label: string; unit?: string }) {
  return (
    <div className="px-4 pt-4 pb-1 flex items-baseline justify-between">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {unit && (
        <span className="text-[10px] text-faint uppercase tracking-[0.15em]">
          {unit}
        </span>
      )}
    </div>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="px-4 py-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[12px] text-foreground/85 truncate">{label}</span>
      <span className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-numeric text-[15px] text-foreground">{value}</span>
        {hint && <span className="text-[10px] text-faint">{hint}</span>}
      </span>
    </div>
  )
}

function UsageSection({ stats }: { stats: DevStats }) {
  const d = stats.draft
  const c = stats.citations
  const cache = stats.cache
  const acceptRate = d.offered > 0 ? d.accepted / d.offered : null
  return (
    <section>
      <SectionHeading label="用量" unit={`${stats.windowDays}d`} />
      <Row
        label="草稿 采纳/提供"
        value={`${d.accepted}/${d.offered}`}
        hint={acceptRate !== null ? `${pct(acceptRate)}` : undefined}
      />
      <Row
        label="平均被改比"
        value={d.avgEditedPct !== null ? pct(d.avgEditedPct) : '—'}
      />
      <Row
        label="引用 / 消息"
        value={c.avgPerMessage !== null ? c.avgPerMessage.toFixed(2) : '—'}
      />
      <Row
        label="引用点击率"
        value={c.clickRate !== null ? pct(c.clickRate) : '—'}
        hint={`${c.clickCount}`}
      />
      <Row
        label="缓存命中"
        value={cache.hitRate !== null ? pct(cache.hitRate) : '—'}
      />
      {(d.rejectedByReason.conflict > 0 ||
        d.rejectedByReason.style > 0 ||
        d.rejectedByReason.plot > 0 ||
        d.rejectedByReason.other > 0) && (
        <>
          <SectionHeading label="拒稿原因" />
          <Row label="世界观冲突" value={String(d.rejectedByReason.conflict)} />
          <Row label="文风不对" value={String(d.rejectedByReason.style)} />
          <Row label="情节不对" value={String(d.rejectedByReason.plot)} />
          <Row label="其他" value={String(d.rejectedByReason.other)} />
        </>
      )}
    </section>
  )
}

function ContradictionSection({ entries }: { entries: readonly ContradictionTopEntry[] }) {
  if (entries.length === 0) return null
  return (
    <section className="mt-2">
      <SectionHeading label="矛盾排行" unit={`top ${entries.length}`} />
      <ul className="px-4 pb-2 space-y-1">
        {entries.map((e) => (
          <li
            key={`${e.entryType}|${e.entryName}`}
            className="flex items-baseline justify-between gap-2"
          >
            <span className="text-[12px] truncate">
              <span className="text-muted-foreground">{TYPE_LABEL[e.entryType]} · </span>
              <span className="text-foreground/90">{e.entryName}</span>
            </span>
            <span className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-numeric text-[13px]">{e.total}</span>
              {e.openCount < e.total && (
                <span className="text-[10px] text-faint">
                  ({e.openCount} 未豁免)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function IndexerSection({ entries }: { entries: IndexerLatencyEntry[] }) {
  const stats = useMemo(() => summariseIndexer(entries), [entries])
  if (entries.length === 0) return null
  return (
    <section className="mt-2 pb-4">
      <SectionHeading label="索引延迟" unit={`n=${entries.length}`} />
      <Row label="中位数" value={`${stats.median.toFixed(0)} ms`} />
      <Row label="P95" value={`${stats.p95.toFixed(0)} ms`} />
      <Row label="最近一次" value={`${stats.last.toFixed(0)} ms`} hint={stats.lastKindLabel} />
    </section>
  )
}

function summariseIndexer(entries: readonly IndexerLatencyEntry[]): {
  median: number
  p95: number
  last: number
  lastKindLabel: string
} {
  if (entries.length === 0) {
    return { median: 0, p95: 0, last: 0, lastKindLabel: '' }
  }
  const sorted = [...entries].map((e) => e.ms).sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
  const last = entries[entries.length - 1]
  return {
    median,
    p95,
    last: last.ms,
    lastKindLabel: last.kind === 'worldEntry' ? '世界观' : '章节',
  }
}

function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`
}
