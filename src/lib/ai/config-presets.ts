import type { AIProvider } from '@/lib/ai/providers/types'
import type { AIConfig } from '@/lib/hooks/use-ai-config'

export type PresetKey = 'anthropic' | 'deepseek' | 'openrouter'

export interface AIConfigPreset {
  label: string
  storeAs: AIProvider
  baseUrl: string
  defaultModel: string
  popularModels: string[]
  consoleUrl: string | null
}

const DEEPSEEK_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'] as const

export const PRESETS: Record<PresetKey, AIConfigPreset> = {
  anthropic: {
    label: 'Claude',
    storeAs: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    popularModels: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-5-20251001'],
    consoleUrl: 'https://console.anthropic.com/settings/keys',
  },
  deepseek: {
    label: 'DeepSeek',
    storeAs: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v4-flash',
    popularModels: [...DEEPSEEK_MODELS],
    consoleUrl: 'https://platform.deepseek.com/api_keys',
  },
  openrouter: {
    label: 'OpenRouter',
    storeAs: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'anthropic/claude-sonnet-4',
    popularModels: ['anthropic/claude-sonnet-4', 'openai/gpt-4o', 'google/gemini-pro-1.5'],
    consoleUrl: 'https://openrouter.ai/keys',
  },
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  return (baseUrl ?? '').trim().replace(/\/+$/, '').toLowerCase()
}

export function inferPresetKey(config: Pick<AIConfig, 'provider' | 'baseUrl'>): PresetKey {
  const normalizedBaseUrl = normalizeBaseUrl(config.baseUrl)
  if (config.provider === 'anthropic') return 'anthropic'
  if (normalizedBaseUrl.includes('api.deepseek.com')) return 'deepseek'
  if (normalizedBaseUrl.includes('openrouter.ai')) return 'openrouter'
  return 'anthropic'
}

export function normalizeAIConfig(config: AIConfig): AIConfig {
  const presetKey = inferPresetKey(config)
  if (presetKey !== 'deepseek') {
    return config
  }

  const preset = PRESETS.deepseek
  const availableModels = preset.popularModels
  const model = availableModels.includes(config.model ?? '')
    ? config.model
    : preset.defaultModel

  return {
    ...config,
    provider: preset.storeAs,
    baseUrl: preset.baseUrl,
    model,
    availableModels,
  }
}
