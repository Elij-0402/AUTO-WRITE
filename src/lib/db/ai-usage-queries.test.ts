import { describe, it, expect, beforeEach } from 'vitest'
import { createProjectDB } from './project-db'
import type { AIUsageEvent } from './project-db'
import {
  recordUsage,
  getUsageByProject,
  getUsageByConversation,
  aggregateUsage,
} from './ai-usage-queries'

function makeEvent(overrides: Partial<AIUsageEvent> = {}): AIUsageEvent {
  return {
    id: crypto.randomUUID(),
    projectId: 'p1',
    conversationId: 'c1',
    kind: 'chat',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 10,
    cacheWriteTokens: 0,
    latencyMs: 1200,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('ai-usage-queries', () => {
  let db: ReturnType<typeof createProjectDB>

  beforeEach(async () => {
    db = createProjectDB(`test-${crypto.randomUUID()}`)
    await db.aiUsage.clear()
  })

  it('records and fetches usage by project', async () => {
    await recordUsage(db, makeEvent())
    await recordUsage(db, makeEvent({ projectId: 'other' }))
    const events = await getUsageByProject(db, 'p1')
    expect(events).toHaveLength(1)
    expect(events[0].inputTokens).toBe(100)
  })

  it('fetches usage by conversation', async () => {
    await recordUsage(db, makeEvent({ conversationId: 'c1' }))
    await recordUsage(db, makeEvent({ conversationId: 'c2' }))
    const events = await getUsageByConversation(db, 'c1')
    expect(events).toHaveLength(1)
  })

  it('aggregates counts, cache, and latency', async () => {
    const events = [
      makeEvent({ inputTokens: 100, outputTokens: 50, latencyMs: 1000 }),
      makeEvent({ inputTokens: 200, outputTokens: 75, cacheReadTokens: 30, latencyMs: 500 }),
    ]
    const agg = aggregateUsage(events)
    expect(agg.totalCalls).toBe(2)
    expect(agg.inputTokens).toBe(300)
    expect(agg.outputTokens).toBe(125)
    expect(agg.cacheReadTokens).toBe(40)
    expect(agg.totalLatencyMs).toBe(1500)
  })

  it('aggregates empty input to zeros', () => {
    const agg = aggregateUsage([])
    expect(agg.totalCalls).toBe(0)
    expect(agg.inputTokens).toBe(0)
  })

  it('returns events sorted by createdAt', async () => {
    await recordUsage(db, makeEvent({ createdAt: 2000 }))
    await recordUsage(db, makeEvent({ createdAt: 1000 }))
    const events = await getUsageByProject(db, 'p1')
    expect(events[0].createdAt).toBe(1000)
    expect(events[1].createdAt).toBe(2000)
  })
})
