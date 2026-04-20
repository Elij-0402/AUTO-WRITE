/**
 * Tests for the dev-stats aggregation queries feeding the T8 hidden panel.
 * Covers: empty state, 30-day window boundary, cache-hit-rate math,
 * contradiction top-N ordering, and the 1000-row sampling cap (ENG-4D).
 *
 * fake-indexeddb is loaded globally via src/test/setup.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createProjectDB, __resetProjectDBCache } from './project-db'
import type {
  AIUsageEvent,
  ABTestMetric,
  Contradiction,
} from './project-db'
import {
  getDevStats,
  isDevStatsEmpty,
  computeDraftStats,
  computeCitationStats,
  computeCacheStats,
  computeContradictionTop,
  STATS_QUERY_LIMIT,
  STATS_WINDOW_DAYS,
  CONTRADICTION_TOP_N,
} from './dev-stats-queries'

const DAY = 24 * 60 * 60 * 1000
const PROJECT = 'dev-stats-project'

function baseUsage(overrides: Partial<AIUsageEvent> = {}): AIUsageEvent {
  return {
    id: crypto.randomUUID(),
    projectId: PROJECT,
    conversationId: 'conv-1',
    kind: 'chat',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    latencyMs: 500,
    createdAt: Date.now(),
    ...overrides,
  }
}

function baseMetric(overrides: Partial<ABTestMetric> = {}): ABTestMetric {
  return {
    id: crypto.randomUUID(),
    projectId: PROJECT,
    conversationId: 'conv-1',
    messageId: crypto.randomUUID(),
    experimentGroup: {
      citations: false,
      extendedCacheTtl: false,
      thinking: false,
    },
    latencyMs: 500,
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    citationCount: 0,
    createdAt: Date.now(),
    ...overrides,
  }
}

function baseContradiction(overrides: Partial<Contradiction> = {}): Contradiction {
  return {
    id: crypto.randomUUID(),
    projectId: PROJECT,
    conversationId: null,
    messageId: null,
    entryName: '小明',
    entryType: 'character',
    description: '人物设定矛盾',
    exempted: false,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('dev-stats-queries — pure aggregations', () => {
  it('computeDraftStats returns zeros for empty input', () => {
    const s = computeDraftStats([])
    expect(s.offered).toBe(0)
    expect(s.accepted).toBe(0)
    expect(s.avgEditedPct).toBeNull()
    expect(s.rejectedByReason).toEqual({ conflict: 0, style: 0, plot: 0, other: 0 })
  })

  it('computeDraftStats tallies offered/accepted/editedPct/reasons', () => {
    const events: AIUsageEvent[] = [
      baseUsage({ draftOffered: true, draftAccepted: true, draftEditedPct: 0.2 }),
      baseUsage({ draftOffered: true, draftAccepted: false, draftRejectedReason: 'conflict' }),
      baseUsage({ draftOffered: true, draftAccepted: true, draftEditedPct: 0.4 }),
      baseUsage({ draftOffered: true, draftAccepted: false, draftRejectedReason: 'style' }),
    ]
    const s = computeDraftStats(events)
    expect(s.offered).toBe(4)
    expect(s.accepted).toBe(2)
    expect(s.avgEditedPct).toBeCloseTo(0.3)
    expect(s.rejectedByReason.conflict).toBe(1)
    expect(s.rejectedByReason.style).toBe(1)
    expect(s.rejectedByReason.plot).toBe(0)
  })

  it('computeCitationStats averages over metrics and uses click_count usage events', () => {
    const metrics: ABTestMetric[] = [
      baseMetric({ citationCount: 2 }),
      baseMetric({ citationCount: 4 }),
      baseMetric({ citationCount: 0 }),
    ]
    const events: AIUsageEvent[] = [
      baseUsage({ kind: 'citation_click' }),
      baseUsage({ kind: 'citation_click' }),
      baseUsage({ kind: 'chat' }),
    ]
    const s = computeCitationStats(events, metrics)
    expect(s.avgPerMessage).toBeCloseTo(2)
    expect(s.clickCount).toBe(2)
    // 2 clicks / 2 messages-with-citations = 1.0
    expect(s.clickRate).toBe(1)
  })

  it('computeCitationStats returns nulls when nothing to measure', () => {
    const s = computeCitationStats([], [])
    expect(s.avgPerMessage).toBeNull()
    expect(s.clickRate).toBeNull()
    expect(s.clickCount).toBe(0)
  })

  it('computeCacheStats math: read / (read + input) across chat+summarize only', () => {
    const events: AIUsageEvent[] = [
      baseUsage({ kind: 'chat', cacheReadTokens: 80, inputTokens: 20 }),
      baseUsage({ kind: 'summarize', cacheReadTokens: 20, inputTokens: 30 }),
      // analyze/generate NOT counted — keeps the rate focused on the chat loop
      baseUsage({ kind: 'analyze', cacheReadTokens: 500, inputTokens: 0 }),
    ]
    const s = computeCacheStats(events)
    expect(s.totalReadTokens).toBe(100)
    expect(s.totalInputTokens).toBe(50)
    expect(s.hitRate).toBeCloseTo(100 / 150)
  })

  it('computeCacheStats returns null hitRate when no eligible events', () => {
    const s = computeCacheStats([])
    expect(s.hitRate).toBeNull()
  })

  it('computeContradictionTop sorts by total desc, limits to top N, distinguishes open vs exempted', () => {
    const contradictions: Contradiction[] = [
      baseContradiction({ entryName: '小明', exempted: false }),
      baseContradiction({ entryName: '小明', exempted: false }),
      baseContradiction({ entryName: '小明', exempted: true }),
      baseContradiction({ entryName: '师父', exempted: false }),
      baseContradiction({ entryName: '老刘', exempted: true }),
    ]
    const top = computeContradictionTop(contradictions)
    expect(top[0]).toMatchObject({ entryName: '小明', total: 3, openCount: 2 })
    expect(top).toHaveLength(3)
    expect(top.slice(1).map((e) => e.entryName).sort()).toEqual(['师父', '老刘'].sort())
    expect(top.length).toBeLessThanOrEqual(CONTRADICTION_TOP_N)
  })

  it('computeContradictionTop breaks ties by entryName (deterministic ordering)', () => {
    const contradictions: Contradiction[] = [
      baseContradiction({ entryName: 'bravo' }),
      baseContradiction({ entryName: 'alpha' }),
    ]
    const top = computeContradictionTop(contradictions)
    expect(top.map((e) => e.entryName)).toEqual(['alpha', 'bravo'])
  })
})

describe('getDevStats — integration against IndexedDB', () => {
  beforeEach(() => {
    __resetProjectDBCache()
  })

  it('returns an empty stats object when the project has no data', async () => {
    const db = createProjectDB(`empty-${crypto.randomUUID()}`)
    const stats = await getDevStats(db, PROJECT)
    expect(isDevStatsEmpty(stats)).toBe(true)
    expect(stats.windowDays).toBe(STATS_WINDOW_DAYS)
    expect(stats.draft.offered).toBe(0)
    expect(stats.cache.hitRate).toBeNull()
    expect(stats.contradictions).toEqual([])
    expect(stats.limitHit).toBe(false)
  })

  it('excludes usage older than the 30-day window', async () => {
    const db = createProjectDB(`window-${crypto.randomUUID()}`)
    const now = Date.now()
    const insideWindow = now - (STATS_WINDOW_DAYS - 1) * DAY
    const outsideWindow = now - (STATS_WINDOW_DAYS + 2) * DAY
    await db.aiUsage.bulkAdd([
      baseUsage({ projectId: PROJECT, createdAt: insideWindow, draftOffered: true, draftAccepted: true }),
      baseUsage({ projectId: PROJECT, createdAt: outsideWindow, draftOffered: true, draftAccepted: true }),
    ])
    const stats = await getDevStats(db, PROJECT, now)
    expect(stats.draft.offered).toBe(1)
    expect(stats.draft.accepted).toBe(1)
  })

  it('scopes aggregates to the requested projectId', async () => {
    const db = createProjectDB(`scope-${crypto.randomUUID()}`)
    await db.aiUsage.bulkAdd([
      baseUsage({ projectId: PROJECT, draftOffered: true }),
      baseUsage({ projectId: 'other-project', draftOffered: true }),
    ])
    const stats = await getDevStats(db, PROJECT)
    expect(stats.draft.offered).toBe(1)
  })

  it('flags limitHit when any table reaches the sampling cap', async () => {
    const db = createProjectDB(`limit-${crypto.randomUUID()}`)
    const now = Date.now()
    const rows: AIUsageEvent[] = []
    for (let i = 0; i < STATS_QUERY_LIMIT + 50; i++) {
      rows.push(
        baseUsage({
          projectId: PROJECT,
          createdAt: now - i * 1000,
          draftOffered: true,
        })
      )
    }
    await db.aiUsage.bulkAdd(rows)
    const stats = await getDevStats(db, PROJECT, now)
    expect(stats.sampledUsage).toBe(STATS_QUERY_LIMIT)
    expect(stats.limitHit).toBe(true)
  })

  it('aggregates contradictions across all time (no window)', async () => {
    const db = createProjectDB(`contra-${crypto.randomUUID()}`)
    const now = Date.now()
    await db.contradictions.bulkAdd([
      baseContradiction({ projectId: PROJECT, createdAt: now - 1 * DAY, entryName: '小明' }),
      baseContradiction({ projectId: PROJECT, createdAt: now - 400 * DAY, entryName: '小明' }),
      baseContradiction({ projectId: PROJECT, createdAt: now, entryName: '师父' }),
    ])
    const stats = await getDevStats(db, PROJECT, now)
    expect(stats.sampledContradictions).toBe(3)
    expect(stats.contradictions[0].entryName).toBe('小明')
    expect(stats.contradictions[0].total).toBe(2)
  })
})
