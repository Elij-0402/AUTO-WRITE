/**
 * Provider-agnostic streaming events emitted by the AI client.
 *
 * Every provider (Anthropic, OpenAI-compatible) normalizes its native stream
 * into this event shape so callers only depend on one contract.
 */

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

/**
 * Partial tool call — emitted when stream is aborted mid-tool-use block.
 * Carries whatever JSON was accumulated so far. Callers can attempt
 * best-effort parse or queue for retry.
 */
export interface AIToolCallPartialEvent {
  type: 'tool_call_partial'
  id: string
  name: string
  /** Best-effort parse of accumulated partial JSON — may be empty or incomplete. */
  input: AIToolInput
  /** Raw partial JSON string, for callers that want to attempt their own parse. */
  partialJson: string
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

export type AIEvent =
  | AITextDeltaEvent
  | AIToolCallEvent
  | AIToolCallPartialEvent
  | AIUsageEvent
  | AIDoneEvent
  | AIErrorEvent
