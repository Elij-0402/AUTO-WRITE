/**
 * Chat telemetry — records per-call AI usage (tokens, latency, cache split)
 * into aiUsage for the BYOK dev-stats trail.
 *
 * All writes are best-effort — a telemetry failure never interrupts the
 * chat UX. Callers await the returned promise only when they want to observe
 * the outcome; in the hot path, fire-and-forget is fine.
 */

import type { InkForgeProjectDB } from '../db/project-db'
import type { AIUsageEvent, AIProvider } from '../db/project-db'
import { recordUsage } from '../db/ai-usage-queries'

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
  counters: ChatTelemetryCounters
  latencyMs: number
}

/**
 * Record a chat turn's usage into aiUsage. Does nothing (returns early) if
 * no tokens were consumed — avoids polluting aiUsage with zero-token
 * "errored before first byte" rows that would skew dev-stats aggregates.
 *
 * Id stability: the aiUsage row id is derived from the assistant message id
 * (`chat:${messageId}`) so later T1 draft-adoption writes can patch the row
 * without needing an indexed messageId column.
 */
export async function recordChatTurn(params: RecordChatTurnParams): Promise<void> {
  const { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens } = params.counters
  if (inputTokens <= 0 && outputTokens <= 0) return

  const usage: AIUsageEvent = {
    id: `chat:${params.assistantMessageId}`,
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
