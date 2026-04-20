import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordChatTurn } from './use-chat-telemetry'
import type { ExperimentFlags } from '../ai/experiment-flags'

// Mock the experiment-flags module
vi.mock('../ai/experiment-flags', () => ({
  resolveExperimentFlags: vi.fn(),
}))

// Import the mocked module to configure it in tests
import { resolveExperimentFlags } from '../ai/experiment-flags'

describe('recordChatTurn', () => {
  const mockDb = {
    aiUsage: { add: vi.fn().mockResolvedValue(undefined) },
    abTestMetrics: { add: vi.fn().mockResolvedValue(undefined) },
  } as any

  const baseParams = {
    db: mockDb,
    projectId: 'project-1',
    conversationId: 'conv-1',
    assistantMessageId: 'msg-1',
    provider: 'anthropic' as const,
    model: 'claude-sonnet-4-20250514',
    config: { provider: 'anthropic' as const },
    counters: {
      inputTokens: 100,
      outputTokens: 200,
      cacheReadTokens: 50,
      cacheWriteTokens: 25,
    },
    latencyMs: 500,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes emptyCitationRate = 0 when citations=true and citationCount > 0', async () => {
    vi.mocked(resolveExperimentFlags).mockReturnValue({
      citations: true,
      extendedCacheTtl: false,
      thinking: false,
    } as ExperimentFlags)

    await recordChatTurn({ ...baseParams, citationCount: 2 })

    expect(mockDb.abTestMetrics.add).toHaveBeenCalledTimes(1)
    const recordedMetric = vi.mocked(mockDb.abTestMetrics.add).mock.calls[0][0]
    expect(recordedMetric.emptyCitationRate).toBe(0)
  })

  it('writes emptyCitationRate = 1 when citations=true and citationCount === 0', async () => {
    vi.mocked(resolveExperimentFlags).mockReturnValue({
      citations: true,
      extendedCacheTtl: false,
      thinking: false,
    } as ExperimentFlags)

    await recordChatTurn({ ...baseParams, citationCount: 0 })

    expect(mockDb.abTestMetrics.add).toHaveBeenCalledTimes(1)
    const recordedMetric = vi.mocked(mockDb.abTestMetrics.add).mock.calls[0][0]
    expect(recordedMetric.emptyCitationRate).toBe(1)
  })

  it('does NOT write emptyCitationRate when citations=false', async () => {
    vi.mocked(resolveExperimentFlags).mockReturnValue({
      citations: false,
      extendedCacheTtl: false,
      thinking: false,
    } as ExperimentFlags)

    await recordChatTurn({ ...baseParams, citationCount: 0 })

    expect(mockDb.abTestMetrics.add).toHaveBeenCalledTimes(1)
    const recordedMetric = vi.mocked(mockDb.abTestMetrics.add).mock.calls[0][0]
    expect(recordedMetric.emptyCitationRate).toBeUndefined()
  })
})
