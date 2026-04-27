import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChapterDraftGeneration } from './use-chapter-draft-generation'
import type { AIClientConfig } from '../ai/client'

// Mock streamChat
const mockStreamChat = vi.fn()
vi.mock('../ai/client', () => ({
  streamChat: (...args: unknown[]) => mockStreamChat(...args),
}))

describe('useChapterDraftGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const config: AIClientConfig = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ]

  describe('validation', () => {
    it('sets error when no API key', async () => {
      const { result } = renderHook(() =>
        useChapterDraftGeneration({
          projectId: 'p1',
          config: { ...config, apiKey: '' },
          worldEntries,
        })
      )

      await act(async () => {
        await result.current.startGeneration({
          chapterId: null,
          outline: '张三去集市',
        })
      })

      expect(result.current.error).toBe('还没设置 API 密钥')
    })
  })

  describe('draft extraction', () => {
    it('extracts draft from "以下是草稿" marker', async () => {
      const mockEvents = [
        { type: 'text_delta', delta: '以下是草稿\n\n' },
        { type: 'text_delta', delta: '张三走在长安街上，心中忐忑。' },
        { type: 'done' },
      ]
      mockStreamChat.mockReturnValue(mockEvents)

      const { result } = renderHook(() =>
        useChapterDraftGeneration({
          projectId: 'p1',
          config,
          worldEntries,
        })
      )

      await act(async () => {
        await result.current.startGeneration({
          chapterId: null,
          outline: '张三去集市',
        })
      })

      await waitFor(() => {
        expect(result.current.state).toBe('draft_ready')
      })

      expect(result.current.draft).toContain('张三走在长安街上')
    })

    it('extracts draft from "草稿：" marker', async () => {
      const mockEvents = [
        { type: 'text_delta', delta: '草稿：\n\n' },
        { type: 'text_delta', delta: '夜色降临，城门缓缓关闭。' },
        { type: 'done' },
      ]
      mockStreamChat.mockReturnValue(mockEvents)

      const { result } = renderHook(() =>
        useChapterDraftGeneration({
          projectId: 'p1',
          config,
          worldEntries,
        })
      )

      await act(async () => {
        await result.current.startGeneration({
          chapterId: null,
          outline: '夜幕降临',
        })
      })

      await waitFor(() => {
        expect(result.current.state).toBe('draft_ready')
      })

      expect(result.current.draft).toContain('夜色降临')
    })

    it('falls back to full content if no marker found', async () => {
      const mockEvents = [
        { type: 'text_delta', delta: '没有任何标记的完整内容。' },
        { type: 'done' },
      ]
      mockStreamChat.mockReturnValue(mockEvents)

      const { result } = renderHook(() =>
        useChapterDraftGeneration({
          projectId: 'p1',
          config,
          worldEntries,
        })
      )

      await act(async () => {
        await result.current.startGeneration({
          chapterId: null,
          outline: '测试',
        })
      })

      await waitFor(() => {
        expect(result.current.state).toBe('draft_ready')
      })

      expect(result.current.draft).toBe('没有任何标记的完整内容。')
    })

    it('handles error events', async () => {
      const mockEvents = [{ type: 'error', message: '网络错误' }]
      mockStreamChat.mockReturnValue(mockEvents)

      const { result } = renderHook(() =>
        useChapterDraftGeneration({
          projectId: 'p1',
          config,
          worldEntries,
        })
      )

      await act(async () => {
        await result.current.startGeneration({
          chapterId: null,
          outline: '测试大纲',
        })
      })

      expect(result.current.error).toBe('网络错误')
      expect(result.current.state).toBe('idle')
    })
  })

  describe('cancelGeneration', () => {
    it('aborts without throwing', async () => {
      const { result } = renderHook(() =>
        useChapterDraftGeneration({
          projectId: 'p1',
          config,
          worldEntries,
        })
      )

      // Start generation with a mock that completes quickly
      const mockEvents = [
        { type: 'text_delta', delta: '测试内容' },
        { type: 'done' },
      ]
      mockStreamChat.mockReturnValue(mockEvents)

      await act(async () => {
        result.current.startGeneration({
          chapterId: null,
          outline: '测试',
        })
      })

      await waitFor(() => expect(result.current.state).toBe('draft_ready'))

      // Calling cancelGeneration should not throw and should reset state
      await act(async () => {
        result.current.cancelGeneration()
      })

      expect(result.current.state).toBe('idle')
      expect(result.current.error).toBeNull()
    })
  })

  describe('acceptDraft', () => {
    it('calls onDraftAccepted with the draft content', async () => {
      const onDraftAccepted = vi.fn()
      const mockEvents = [
        { type: 'text_delta', delta: '以下是草稿\n\n' },
        { type: 'text_delta', delta: '草稿内容。' },
        { type: 'done' },
      ]
      mockStreamChat.mockReturnValue(mockEvents)

      const { result } = renderHook(() =>
        useChapterDraftGeneration({
          projectId: 'p1',
          config,
          worldEntries,
          onDraftAccepted,
        })
      )

      await act(async () => {
        await result.current.startGeneration({
          chapterId: null,
          outline: '测试',
        })
      })

      await waitFor(() => expect(result.current.state).toBe('draft_ready'))

      await act(async () => {
        result.current.acceptDraft()
      })

      expect(onDraftAccepted).toHaveBeenCalledWith(expect.stringContaining('草稿内容'))
      expect(result.current.state).toBe('accepted')
    })
  })
})
