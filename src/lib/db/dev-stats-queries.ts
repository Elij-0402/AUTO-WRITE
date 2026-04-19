/**
 * Aggregation queries for the T8 dev-stats hidden panel.
 *
 * 30-day window over aiUsage + abTestMetrics; all-time over contradictions.
 * Pure functions so tests don't need a DOM. Queries are capped at 1000 rows
 * per table (ENG-4D) — BYOK users with very long histories see the warning
 * surfaced by the panel when `sampled*` hits the cap.
 */

import type {
  InkForgeProjectDB,
  AIUsageEvent,
  ABTestMetric,
  Contradiction,
} from './project-db'

const DAY_MS = 24 * 60 * 60 * 1000
export const STATS_WINDOW_DAYS = 30
export const STATS_QUERY_LIMIT = 1000
export const CONTRADICTION_TOP_N = 10

export type DraftRejectedReason = 'conflict' | 'style' | 'plot' | 'other'

export interface DraftStats {
  offered: number
  accepted: number
  avgEditedPct: number | null
  rejectedByReason: Record<DraftRejectedReason, number>
}

export interface CitationStats {
  /** Mean citationCount across every chat metric in the window. */
  avgPerMessage: number | null
  clickCount: number
  /** clickCount / messages-with-citations — null when denominator is 0. */
  clickRate: number | null
}

export interface CacheStats {
  /** cacheReadTokens / (cacheReadTokens + inputTokens) — null when no tokens. */
  hitRate: number | null
  totalReadTokens: number
  totalInputTokens: number
}

export interface ContradictionTopEntry {
  entryName: string
  entryType: Contradiction['entryType']
  total: number
  openCount: number
}

export interface DevStats {
  draft: DraftStats
  citations: CitationStats
  cache: CacheStats
  contradictions: ContradictionTopEntry[]
  windowDays: number
  sampledUsage: number
  sampledMetrics: number
  sampledContradictions: number
  limitHit: boolean
  generatedAt: number
}

export async function getDevStats(
  db: InkForgeProjectDB,
  projectId: string,
  now: number = Date.now()
): Promise<DevStats> {
  const cutoff = now - STATS_WINDOW_DAYS * DAY_MS

  const recentUsage = await db.aiUsage
    .where('projectId')
    .equals(projectId)
    .and((ev) => ev.createdAt >= cutoff)
    .limit(STATS_QUERY_LIMIT)
    .toArray()

  const recentMetrics = await db.abTestMetrics
    .where('[projectId+createdAt]')
    .between([projectId, cutoff], [projectId, Number.MAX_SAFE_INTEGER])
    .limit(STATS_QUERY_LIMIT)
    .toArray()

  const contradictions = await db.contradictions
    .where('projectId')
    .equals(projectId)
    .limit(STATS_QUERY_LIMIT)
    .toArray()

  return {
    draft: computeDraftStats(recentUsage),
    citations: computeCitationStats(recentUsage, recentMetrics),
    cache: computeCacheStats(recentUsage),
    contradictions: computeContradictionTop(contradictions),
    windowDays: STATS_WINDOW_DAYS,
    sampledUsage: recentUsage.length,
    sampledMetrics: recentMetrics.length,
    sampledContradictions: contradictions.length,
    limitHit:
      recentUsage.length === STATS_QUERY_LIMIT ||
      recentMetrics.length === STATS_QUERY_LIMIT ||
      contradictions.length === STATS_QUERY_LIMIT,
    generatedAt: now,
  }
}

export function computeDraftStats(events: readonly AIUsageEvent[]): DraftStats {
  const rejectedByReason: DraftStats['rejectedByReason'] = {
    conflict: 0,
    style: 0,
    plot: 0,
    other: 0,
  }
  let offered = 0
  let accepted = 0
  let editedSum = 0
  let editedCount = 0
  for (const e of events) {
    if (e.draftOffered === true) offered++
    if (e.draftAccepted === true) accepted++
    if (typeof e.draftEditedPct === 'number') {
      editedSum += e.draftEditedPct
      editedCount++
    }
    if (e.draftRejectedReason) {
      rejectedByReason[e.draftRejectedReason]++
    }
  }
  return {
    offered,
    accepted,
    avgEditedPct: editedCount > 0 ? editedSum / editedCount : null,
    rejectedByReason,
  }
}

export function computeCitationStats(
  events: readonly AIUsageEvent[],
  metrics: readonly ABTestMetric[]
): CitationStats {
  let citationSum = 0
  let messagesWithCitations = 0
  for (const m of metrics) {
    citationSum += m.citationCount
    if (m.citationCount > 0) messagesWithCitations++
  }
  const clickCount = events.reduce(
    (sum, e) => (e.kind === 'citation_click' ? sum + 1 : sum),
    0
  )
  return {
    avgPerMessage: metrics.length > 0 ? citationSum / metrics.length : null,
    clickCount,
    clickRate: messagesWithCitations > 0 ? clickCount / messagesWithCitations : null,
  }
}

export function computeCacheStats(events: readonly AIUsageEvent[]): CacheStats {
  let totalRead = 0
  let totalInput = 0
  for (const e of events) {
    if (e.kind === 'chat' || e.kind === 'summarize') {
      totalRead += e.cacheReadTokens
      totalInput += e.inputTokens
    }
  }
  const denom = totalRead + totalInput
  return {
    hitRate: denom > 0 ? totalRead / denom : null,
    totalReadTokens: totalRead,
    totalInputTokens: totalInput,
  }
}

export function computeContradictionTop(
  contradictions: readonly Contradiction[]
): ContradictionTopEntry[] {
  const byEntry = new Map<string, ContradictionTopEntry>()
  for (const c of contradictions) {
    const key = `${c.entryType}|${c.entryName}`
    const acc = byEntry.get(key) ?? {
      entryName: c.entryName,
      entryType: c.entryType,
      total: 0,
      openCount: 0,
    }
    acc.total++
    if (!c.exempted) acc.openCount++
    byEntry.set(key, acc)
  }
  return [...byEntry.values()]
    .sort((a, b) => b.total - a.total || a.entryName.localeCompare(b.entryName))
    .slice(0, CONTRADICTION_TOP_N)
}

export function isDevStatsEmpty(stats: DevStats): boolean {
  return (
    stats.sampledUsage === 0 &&
    stats.sampledMetrics === 0 &&
    stats.sampledContradictions === 0
  )
}
