/**
 * Chat telemetry — extracted from use-ai-chat.ts per /autoplan ENG-2C.
 *
 * Two jobs:
 *  - Record per-call AI usage (tokens, latency, cache split) to aiUsage.
 *  - Record per-turn A/B experiment metric (citationCount + flags) to abTestMetrics.
 *
 * Both writes are best-effort — a telemetry failure never interrupts the
 * chat UX. Callers await the returned promise only when they want to observe
 * the outcome; in the hot path, fire-and-forget is fine.
 *
 * Stream + agent logic stays in use-ai-chat.ts. Per /autoplan guidance,
 * the tool_call event loop + citation accumulation + draft detection are
 * tightly coupled to the stream consumer; splitting them further would
 * cost more in readability than the ~80-line extraction gains.
 */

import type { InkForgeProjectDB } from '../db/project-db'
import type { AIUsageEvent, ABTestMetric, AIProvider } from '../db/project-db'
import type { ExperimentFlags } from '../ai/experiment-flags'
import { resolveExperimentFlags } from '../ai/experiment-flags'
import { recordUsage } from '../db/ai-usage-queries'
import { recordABTestMetric } from '../db/ab-metrics-queries'

export interface ChatTelemetryCounters {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export interface RecordChatTurnParams {
  db: InkForgeProjectDB
  projectId: string
  conversationId: string
  assistantMessageId: string
  provider: AIProvider
  model: string
  config: { provider: AIProvider; experimentFlags?: ExperimentFlags }
  counters: ChatTelemetryCounters
  latencyMs: number
  citationCount: number
}

/**
 * Record a chat turn's usage + A/B metric. Both writes wrapped in try/catch
 * so a telemetry failure never propagates up into the streaming path.
 *
 * Does nothing (returns early) if no tokens were consumed — avoids polluting
 * aiUsage with zero-token "errored before first byte" rows that would skew
 * dev-stats aggregates.
 */
export async function recordChatTurn(params: RecordChatTurnParams): Promise<void> {
  const { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens } = params.counters
  if (inputTokens <= 0 && outputTokens <= 0) return

  const usage: AIUsageEvent = {
    id: crypto.randomUUID(),
    projectId: params.projectId,
    conversationId: params.conversationId,
    kind: 'chat',
    provider: params.provider,
    model: params.model,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    latencyMs: params.latencyMs,
    createdAt: Date.now(),
  }

  try {
    await recordUsage(params.db, usage)
  } catch (e) {
    console.warn('[chat-telemetry] recordUsage failed:', e)
  }

  const experimentGroup = resolveExperimentFlags({
    provider: params.config.provider,
    experimentFlags: params.config.experimentFlags,
  })
  const metric: ABTestMetric = {
    id: crypto.randomUUID(),
    projectId: params.projectId,
    conversationId: params.conversationId,
    messageId: params.assistantMessageId,
    experimentGroup,
    latencyMs: params.latencyMs,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    citationCount: params.citationCount,
    createdAt: Date.now(),
  }

  try {
    await recordABTestMetric(params.db, metric)
  } catch (e) {
    console.warn('[chat-telemetry] recordABTestMetric failed:', e)
  }
}

export interface RecordSummarizeParams {
  db: InkForgeProjectDB
  projectId: string
  conversationId: string
  provider: AIProvider
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  latencyMs: number
}

/** Usage record for the async rolling-summary pass. Same best-effort contract. */
export async function recordSummarizeUsage(params: RecordSummarizeParams): Promise<void> {
  if (params.inputTokens <= 0 && params.outputTokens <= 0) return

  const usage: AIUsageEvent = {
    id: crypto.randomUUID(),
    projectId: params.projectId,
    conversationId: params.conversationId,
    kind: 'summarize',
    provider: params.provider,
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cacheReadTokens: params.cacheReadTokens,
    cacheWriteTokens: params.cacheWriteTokens,
    latencyMs: params.latencyMs,
    createdAt: Date.now(),
  }

  try {
    await recordUsage(params.db, usage)
  } catch (e) {
    console.warn('[chat-telemetry] summarize recordUsage failed:', e)
  }
}
