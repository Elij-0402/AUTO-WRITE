import { beforeEach, describe, expect, it, vi } from 'vitest'
import { streamOpenAICompatible } from './openai-compatible'
import type { ProviderStreamParams } from './types'

const fetchMock = vi.fn()
global.fetch = fetchMock

async function collect(params: ProviderStreamParams) {
  const events = []
  for await (const event of streamOpenAICompatible(params)) {
    events.push(event)
  }
  return events
}

function sseResponse(lines: string[]) {
  const encoder = new TextEncoder()
  let sent = false

  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => {
          if (sent) return { done: true, value: undefined }
          sent = true
          return { done: false, value: encoder.encode(lines.join('\n')) }
        },
      }),
    },
  }
}

describe('streamOpenAICompatible', () => {
  const baseParams: ProviderStreamParams = {
    config: {
      provider: 'openai-compatible',
      apiKey: 'sk-test',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
    },
    segmentedSystem: { baseInstruction: 'BASE' },
    messages: [{ role: 'user', content: '你好' }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes the base url and forwards the configured model name', async () => {
    fetchMock.mockResolvedValue(sseResponse([
      'data: {"choices":[{"delta":{"content":"写作链路正常"}}]}',
      'data: [DONE]',
    ]))

    const events = await collect(baseParams)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          stream: true,
          messages: [
            { role: 'system', content: 'BASE' },
            { role: 'user', content: '你好' },
          ],
        }),
      })
    )
    expect(events).toEqual([
      { type: 'text_delta', delta: '写作链路正常' },
      { type: 'done' },
    ])
  })

  it('normalizes provider errors into a user-facing API message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'bad request payload',
    })

    const events = await collect(baseParams)

    expect(events).toEqual([
      { type: 'error', message: 'API 错误 400: bad request payload' },
    ])
  })
})
