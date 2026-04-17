/**
 * Queries over the aiUsage table. No React hook yet — UI is deferred. Keeping
 * this as pure functions means a future hook is a thin wrapper, and tests
 * don't need a DOM.
 */

import type { InkForgeProjectDB } from './project-db'
import type { AIUsageEvent } from './project-db'

export async function getUsageByProject(
  db: InkForgeProjectDB,
  projectId: string
): Promise<AIUsageEvent[]> {
  return db.aiUsage.where('projectId').equals(projectId).sortBy('createdAt')
}

export async function getUsageByConversation(
  db: InkForgeProjectDB,
  conversationId: string
): Promise<AIUsageEvent[]> {
  return db.aiUsage.where('conversationId').equals(conversationId).sortBy('createdAt')
}

export interface UsageAggregate {
  totalCalls: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalLatencyMs: number
}

export function aggregateUsage(events: readonly AIUsageEvent[]): UsageAggregate {
  const agg: UsageAggregate = {
    totalCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalLatencyMs: 0,
  }
  for (const e of events) {
    agg.totalCalls++
    agg.inputTokens += e.inputTokens
    agg.outputTokens += e.outputTokens
    agg.cacheReadTokens += e.cacheReadTokens
    agg.cacheWriteTokens += e.cacheWriteTokens
    agg.totalLatencyMs += e.latencyMs
  }
  return agg
}

export async function recordUsage(
  db: InkForgeProjectDB,
  event: AIUsageEvent
): Promise<void> {
  await db.aiUsage.add(event)
}
