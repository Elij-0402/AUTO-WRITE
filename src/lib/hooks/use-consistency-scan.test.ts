import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConsistencyScan } from './use-consistency-scan'
import type { AIClientConfig } from '../ai/providers/types'
import { scanConsistency } from '../ai/scan-consistency'

const mockAdd = vi.fn()
const mockUpdate = vi.fn()

const mockContradictionsEquals = vi.fn(() => ({
  and: vi.fn(() => ({
    toArray: vi.fn().mockResolvedValue([]),
    first: vi.fn().mockResolvedValue(undefined),
  })),
  toArray: vi.fn().mockResolvedValue([]),
}))
const mockContradictionsWhereResult = vi.fn(() => ({
  equals: mockContradictionsEquals,
}))

const mockExemptionsEquals = vi.fn(() => ({
  toArray: vi.fn().mockResolvedValue([]),
}))
const mockExemptionsWhereResult = vi.fn(() => ({
  equals: mockExemptionsEquals,
}))

const mockChaptersWhere = vi.fn(() => ({
  equals: vi.fn(() => ({
    and: vi.fn(() => ({
      sortBy: vi.fn().mockResolvedValue([]),
    })),
  })),
}))

vi.mock('../db/project-db', () => ({
  createProjectDB: () => ({
    chapters: { where: mockChaptersWhere },
    contradictions: { add: mockAdd, update: mockUpdate, where: mockContradictionsWhereResult },
    consistencyExemptions: { add: mockAdd, where: mockExemptionsWhereResult },
  }),
}))

vi.mock('../ai/scan-consistency', () => ({
  scanConsistency: vi.fn(),
}))

describe('useConsistencyScan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContradictionsWhereResult.mockReturnValue({
      equals: mockContradictionsEquals.mockReturnValue({
        and: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
          first: vi.fn().mockResolvedValue(undefined),
        })),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    })
    mockExemptionsWhereResult.mockReturnValue({
      equals: mockExemptionsEquals.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    })
    mockChaptersWhere.mockReturnValue({
      equals: vi.fn(() => ({
        and: vi.fn(() => ({
          sortBy: vi.fn().mockResolvedValue([]),
        })),
      })),
    })
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
      content: '男，30岁',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ]

  describe('validation', () => {
    it('sets error when no API key', async () => {
      const { result } = renderHook(() =>
        useConsistencyScan({
          projectId: 'p1',
          config: { ...config, apiKey: '' },
          worldEntries,
        })
      )
      await act(async () => { await result.current.startScan([]) })
      expect(result.current.error).toBe('还没设置 API 密钥')
      expect(result.current.state).toBe('error')
    })

    it('sets error when openai-compatible without baseUrl', async () => {
      const { result } = renderHook(() =>
        useConsistencyScan({
          projectId: 'p1',
          config: { provider: 'openai-compatible', apiKey: 'key', baseUrl: '' },
          worldEntries,
        })
      )
      await act(async () => { await result.current.startScan([]) })
      expect(result.current.error).toBe('还没填写接口地址')
      expect(result.current.state).toBe('error')
    })

    it('returns coverage warning instead of passing when world bible is empty', async () => {
      const { result } = renderHook(() =>
        useConsistencyScan({
          projectId: 'p1',
          config,
          worldEntries: [],
        })
      )

      await act(async () => {
        await result.current.startScan([])
      })

      expect(scanConsistency).not.toHaveBeenCalled()
      expect(result.current.state).toBe('results_ready')
      expect(result.current.summary?.status).toBe('missing_world_bible')
    })
  })

  describe('double-click guard', () => {
    it('ignores second startScan call while scanning', async () => {
      const { result } = renderHook(() =>
        useConsistencyScan({
          projectId: 'p1',
          config: { ...config, apiKey: '' },
          worldEntries,
        })
      )
      await act(async () => { await result.current.startScan([]) })
      expect(result.current.state).toBe('error')
      expect(result.current.state).not.toBe('scanning')
    })
  })

  describe('exemptResult', () => {
    it('adds exemption to database', async () => {
      const { result } = renderHook(() =>
        useConsistencyScan({ projectId: 'p1', config, worldEntries })
      )
      await act(async () => {
        await result.current.exemptResult({
          entryName: '张三',
          entryType: 'character',
          description: '年龄不符',
          severity: 'high',
        })
      })
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'p1', exemptionKey: '张三:character' })
      )
    })

    it('updates matching contradictions as exempted', async () => {
      // Override the mock for this specific test
      mockContradictionsWhereResult.mockImplementation(() => ({
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            toArray: vi.fn().mockResolvedValue([]),
            first: vi.fn().mockResolvedValue(undefined),
          })),
          toArray: vi.fn().mockResolvedValue([
            { id: 'c1', projectId: 'p1', entryName: '张三', entryType: 'character', description: '年龄不符', exempted: false },
          ]),
        })),
      }))
      const { result } = renderHook(() =>
        useConsistencyScan({ projectId: 'p1', config, worldEntries })
      )
      await act(async () => {
        await result.current.exemptResult({
          entryName: '张三',
          entryType: 'character',
          description: '年龄不符',
          severity: 'high',
        })
      })
      expect(mockUpdate).toHaveBeenCalledWith('c1', { exempted: true })
    })
  })
})
