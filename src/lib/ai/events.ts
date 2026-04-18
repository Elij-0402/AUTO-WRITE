/**
 * Provider-agnostic streaming events emitted by the AI client.
 *
 * Every provider (Anthropic, OpenAI-compatible) normalizes its native stream
 * into this event shape so callers only depend on one contract.
 */

import type { Citation } from './citations'

export type AIToolInput = Record<string, unknown>

export interface AITextDeltaEvent {
  type: 'text_delta'
  delta: string
}

export interface AIToolCallEvent {
  type: 'tool_call'
  id: string
  name: string
  input: AIToolInput
}

export interface AIUsageEvent {
  type: 'usage'
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

export interface AIDoneEvent {
  type: 'done'
  stopReason?: string
}

export interface AIErrorEvent {
  type: 'error'
  message: string
}

/**
 * Citation event — emitted by the Anthropic provider when experimentFlags.citations
 * is on and the model cites a WorldEntry. Pairs with the current text block index.
 */
export interface AICitationEvent {
  type: 'citation'
  citation: Citation
  /** Content block index the citation attaches to in the assistant response. */
  blockIndex: number
}

export type AIEvent =
  | AITextDeltaEvent
  | AIToolCallEvent
  | AIUsageEvent
  | AIDoneEvent
  | AIErrorEvent
  | AICitationEvent
