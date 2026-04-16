import type { SegmentedSystemPrompt } from '../prompts'

export type AIProvider = 'anthropic' | 'openai-compatible'

export interface AIClientConfig {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model?: string
}

export interface ProviderStreamMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProviderStreamParams {
  config: AIClientConfig
  segmentedSystem: SegmentedSystemPrompt
  messages: ProviderStreamMessage[]
  signal?: AbortSignal
}
