/**
 * OpenAI-compatible provider: talks to any /chat/completions endpoint that
 * follows the OpenAI SSE protocol (OpenAI, Azure, DeepSeek, SiliconFlow,
 * Together, local servers via LiteLLM etc.).
 *
 * Tool use is *not* emitted on this path — many compatible servers don't
 * implement function calling correctly, so suggestions flow back through the
 * legacy regex parser in use-ai-chat. This provider only emits text_delta
 * and done events.
 */

import type { AIEvent } from '../events'
import { flattenSystemPrompt } from '../prompts'
import type { ProviderStreamParams } from './types'

export async function* streamOpenAICompatible(
  params: ProviderStreamParams
): AsyncIterable<AIEvent> {
  const { config, segmentedSystem, messages, signal } = params
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const systemPrompt = flattenSystemPrompt(segmentedSystem)

  const body = {
    model: config.model || 'gpt-4',
    stream: true,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ],
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    yield { type: 'error', message: `API 错误 ${response.status}: ${text.slice(0, 200)}` }
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    yield { type: 'error', message: '无法读取响应流' }
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames are separated by blank lines; process whole frames.
    const frames = buffer.split('\n')
    buffer = frames.pop() ?? ''

    for (const line of frames) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload)
        const delta = parsed.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) {
          yield { type: 'text_delta', delta }
        }
      } catch {
        // Ignore malformed fragments — the provider may have split JSON.
      }
    }
  }

  yield { type: 'done' }
}

function normalizeBaseUrl(raw: string): string {
  let url = raw.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  // Accept inputs like "https://api.openai.com" or ".../v1" — we always need /v1 suffix.
  if (!url.endsWith('/v1')) url = `${url}/v1`
  return url
}
