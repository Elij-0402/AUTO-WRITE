/**
 * Provider-agnostic AI client facade.
 *
 * Given an AIConfig and a segmented system prompt, `streamChat` returns an
 * async iterable of unified AIEvent objects. Callers don't care whether the
 * backend is Anthropic or an OpenAI-compatible server.
 */

import type { AIEvent } from './events'
import type {
  AIClientConfig,
  AIProvider,
  ProviderStreamMessage,
  ProviderStreamParams,
} from './providers/types'
import type { SegmentedSystemPrompt } from './prompts'
import { streamAnthropic } from './providers/anthropic'
import { streamOpenAICompatible } from './providers/openai-compatible'

export type {
  AIClientConfig,
  AIProvider,
  ProviderStreamMessage,
} from './providers/types'

export interface StreamChatParams {
  segmentedSystem: SegmentedSystemPrompt
  messages: ProviderStreamMessage[]
  signal?: AbortSignal
}

export function streamChat(
  config: AIClientConfig,
  params: StreamChatParams
): AsyncIterable<AIEvent> {
  const stream = pickStream(config.provider)
  return stream({
    config,
    segmentedSystem: params.segmentedSystem,
    messages: params.messages,
    signal: params.signal,
  })
}

export function supportsToolUse(provider: AIProvider): boolean {
  return provider === 'anthropic'
}

function pickStream(
  provider: AIProvider
): (p: ProviderStreamParams) => AsyncIterable<AIEvent> {
  switch (provider) {
    case 'anthropic':
      return streamAnthropic
    case 'openai-compatible':
      return streamOpenAICompatible
    default: {
      const exhaustive: never = provider
      throw new Error(`未知的 provider: ${exhaustive}`)
    }
  }
}
