/**
 * Queries over the abTestMetrics table — per deep-interview spec AC-4.
 *
 * Each AI chat turn records one ABTestMetric tagged with the resolved
 * experiment group. Aggregate helpers enable a simple dashboard comparison
 * across groups. No pricing is stored; costUsd is optional and caller-supplied.
 */

import type { InkForgeProjectDB, ABTestMetric } from './project-db'

export async function recordABTestMetric(
  db: InkForgeProjectDB,
  metric: ABTestMetric
): Promise<void> {
  await db.abTestMetrics.add(metric)
}

export async function getABTestMetricsByProject(
  db: InkForgeProjectDB,
  projectId: string
): Promise<ABTestMetric[]> {
  return db.abTestMetrics.where('projectId').equals(projectId).sortBy('createdAt')
}

export async function getABTestMetricsByConversation(
  db: InkForgeProjectDB,
  conversationId: string
): Promise<ABTestMetric[]> {
  return db.abTestMetrics.where('conversationId').equals(conversationId).sortBy('createdAt')
}

export interface ABTestAggregate {
  totalCalls: number
  avgLatencyMs: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheWriteTokens: number
  totalCitations: number
  avgEmptyCitationRate: number | null
  avgAuthorRating: number | null
  cacheHitRate: number
}

export function aggregateABTestMetrics(metrics: readonly ABTestMetric[]): ABTestAggregate {
  if (metrics.length === 0) {
    return {
      totalCalls: 0,
      avgLatencyMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      totalCitations: 0,
      avgEmptyCitationRate: null,
      avgAuthorRating: null,
      cacheHitRate: 0,
    }
  }

  let latencySum = 0
  let inputTokens = 0
  let outputTokens = 0
  let cacheReadTokens = 0
  let cacheWriteTokens = 0
  let citations = 0
  let emptyRateSum = 0
  let emptyRateCount = 0
  let ratingSum = 0
  let ratingCount = 0

  for (const m of metrics) {
    latencySum += m.latencyMs
    inputTokens += m.inputTokens
    outputTokens += m.outputTokens
    cacheReadTokens += m.cacheReadTokens
    cacheWriteTokens += m.cacheWriteTokens
    citations += m.citationCount
    if (m.emptyCitationRate !== undefined) {
      emptyRateSum += m.emptyCitationRate
      emptyRateCount++
    }
    if (m.authorRating !== undefined) {
      ratingSum += m.authorRating
      ratingCount++
    }
  }

  const totalReadableTokens = inputTokens + cacheReadTokens
  const cacheHitRate = totalReadableTokens > 0 ? cacheReadTokens / totalReadableTokens : 0

  return {
    totalCalls: metrics.length,
    avgLatencyMs: latencySum / metrics.length,
    totalInputTokens: inputTokens,
    totalOutputTokens: outputTokens,
    totalCacheReadTokens: cacheReadTokens,
    totalCacheWriteTokens: cacheWriteTokens,
    totalCitations: citations,
    avgEmptyCitationRate: emptyRateCount > 0 ? emptyRateSum / emptyRateCount : null,
    avgAuthorRating: ratingCount > 0 ? ratingSum / ratingCount : null,
    cacheHitRate,
  }
}

/**
 * Group metrics by experiment configuration. Each unique flag combination
 * (e.g., citations=true + extendedCacheTtl=false + thinking=false) becomes
 * one group. Use this to compare e.g. "citations on" vs "citations off"
 * in the analysis dashboard.
 */
export function groupABTestMetricsByExperiment(
  metrics: readonly ABTestMetric[]
): Map<string, ABTestMetric[]> {
  const groups = new Map<string, ABTestMetric[]>()
  for (const m of metrics) {
    const key = experimentGroupKey(m)
    const bucket = groups.get(key) ?? []
    bucket.push(m)
    groups.set(key, bucket)
  }
  return groups
}

export function experimentGroupKey(metric: Pick<ABTestMetric, 'experimentGroup'>): string {
  const g = metric.experimentGroup
  return `citations=${g.citations}|cacheTtl=${g.extendedCacheTtl}|thinking=${g.thinking}`
}

export async function recordAuthorRating(
  db: InkForgeProjectDB,
  messageId: string,
  rating: number
): Promise<void> {
  await db.abTestMetrics
    .where('messageId')
    .equals(messageId)
    .modify({ authorRating: rating })
}
