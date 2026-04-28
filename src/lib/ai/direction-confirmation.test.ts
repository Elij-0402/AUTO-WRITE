import { describe, expect, it, vi, beforeEach } from 'vitest'
import { generateDirectionConfirmation } from './direction-confirmation'

const streamChatMock = vi.fn()

vi.mock('./client', () => ({
  streamChat: (...args: unknown[]) => streamChatMock(...args),
}))

describe('generateDirectionConfirmation', () => {
  beforeEach(() => {
    streamChatMock.mockReset()
  })

  it('parses a valid confirmation payload', async () => {
    streamChatMock.mockReturnValue((async function* () {
      yield {
        type: 'text_delta',
        delta: '[DIRECTION_JSON_START]{"shouldConfirm":true,"oneLinePremise":"这是一个关于失势太子回到帝京争回身份的故事。","storyPromise":"核心体验偏压迫感与关系反噬。","themes":["复国","关系反噬"]}[DIRECTION_JSON_END]',
      }
    })())

    const result = await generateDirectionConfirmation(
      {
        provider: 'openai-compatible',
        apiKey: 'key',
        baseUrl: 'https://example.com',
        model: 'test-model',
      },
      [
        { role: 'user', content: '我想写一个复国故事。' },
        { role: 'assistant', content: '我们先抓一下人物关系。' },
      ]
    )

    expect(result).toEqual({
      shouldConfirm: true,
      oneLinePremise: '这是一个关于失势太子回到帝京争回身份的故事。',
      storyPromise: '核心体验偏压迫感与关系反噬。',
      themes: ['复国', '关系反噬'],
    })
  })

  it('returns null when the model says the conversation is not ready', async () => {
    streamChatMock.mockReturnValue((async function* () {
      yield {
        type: 'text_delta',
        delta: '[DIRECTION_JSON_START]{"shouldConfirm":false,"oneLinePremise":"","storyPromise":"","themes":[]}[DIRECTION_JSON_END]',
      }
    })())

    const result = await generateDirectionConfirmation(
      {
        provider: 'openai-compatible',
        apiKey: 'key',
        baseUrl: 'https://example.com',
        model: 'test-model',
      },
      [{ role: 'user', content: '我还没想清楚。' }]
    )

    expect(result).toBeNull()
  })
})
