import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scanConsistency } from './scan-consistency'
import type { AIClientConfig } from './providers/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('scanConsistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseConfig: AIClientConfig = {
    provider: 'anthropic',
    apiKey: 'test-key',
    baseUrl: 'https://api.anthropic.com',
  }

  const worldEntries = [
    {
      id: '1',
      projectId: 'p1',
      type: 'character' as const,
      name: '张三',
      content: '男，30岁，剑客',
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
    },
  ]

  describe('provider routing', () => {
    it('uses /v1/messages for anthropic provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [{ type: 'text', text: '[]' }] }),
      })

      await scanConsistency({
        config: { ...baseConfig, baseUrl: '' },
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      )
    })

    it('uses /v1/chat/completions for openai-compatible provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '[]' } }] }),
      })

      await scanConsistency({
        config: {
          provider: 'openai-compatible',
          apiKey: 'test-key',
          baseUrl: 'https://api.deepseek.com',
        },
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      )
    })

    it('normalizes baseUrl without /v1 suffix for openai-compatible', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '[]' } }] }),
      })

      await scanConsistency({
        config: {
          provider: 'openai-compatible',
          apiKey: 'test-key',
          baseUrl: 'https://api.openai.com', // no /v1
        },
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object)
      )
    })

    it('defaults anthropic baseUrl to api.anthropic.com when empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [{ type: 'text', text: '[]' }] }),
      })

      await scanConsistency({
        config: { ...baseConfig, baseUrl: '' },
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object)
      )
    })
  })

  describe('response parsing', () => {
    it('parses Anthropic response format (content array)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [
              {
                type: 'text',
                text: JSON.stringify([
                  {
                    entryName: '张三',
                    entryType: 'character',
                    description: '与设定年龄不符',
                    severity: 'high',
                  },
                ]),
              },
            ],
          }),
      })

      const violations = await scanConsistency({
        config: baseConfig,
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(violations).toHaveLength(1)
      expect(violations[0].entryName).toBe('张三')
      expect(violations[0].severity).toBe('high')
    })

    it('parses OpenAI-compatible response format (choices array)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify([
                    {
                      entryName: '张三',
                      entryType: 'character',
                      description: '与设定年龄不符',
                      severity: 'medium',
                    },
                  ]),
                },
              },
            ],
          }),
      })

      const violations = await scanConsistency({
        config: { provider: 'openai-compatible', apiKey: 'key', baseUrl: 'https://api.deepseek.com' },
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(violations).toHaveLength(1)
      expect(violations[0].entryName).toBe('张三')
      expect(violations[0].severity).toBe('medium')
    })

    it('extracts JSON from markdown code blocks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [
              {
                type: 'text',
                text: '```json\n[\n  {"entryName":"张三","entryType":"character","description":"矛盾","severity":"high"}\n]\n```',
              },
            ],
          }),
      })

      const violations = await scanConsistency({
        config: baseConfig,
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(violations).toHaveLength(1)
      expect(violations[0].entryName).toBe('张三')
    })

    it('returns empty array on non-JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [{ type: 'text', text: '这不是 JSON' }] }),
      })

      const violations = await scanConsistency({
        config: baseConfig,
        chapterTitle: '第一章',
        chapterContent: '张三走在街上。',
        worldEntries,
      })

      expect(violations).toHaveLength(0)
    })

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await expect(
        scanConsistency({
          config: baseConfig,
          chapterTitle: '第一章',
          chapterContent: '张三走在街上。',
          worldEntries,
        })
      ).rejects.toThrow('Scan failed: 401')
    })

    it.skip('respects AbortSignal', async () => {
      // AbortSignal handling is exercised via integration/E2E tests
      // where the real fetch properly rejects on abort. This unit test
      // would require a more sophisticated mock to verify signal propagation.
    })
  })
})
