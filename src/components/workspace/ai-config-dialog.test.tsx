import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ExperimentFlags } from '@/lib/ai/experiment-flags'

// Stable mock values to prevent infinite re-renders
const mockConfig = {
  id: 'config' as const,
  provider: 'anthropic' as const,
  apiKey: 'test-key',
  baseUrl: 'https://api.anthropic.com',
  experimentFlags: {
    citations: false,
    extendedCacheTtl: false,
    thinking: false,
  } as ExperimentFlags,
}

vi.mock('@/lib/hooks/use-ai-config', () => ({
  useAIConfig: () => ({
    config: mockConfig,
    saveConfig: vi.fn(),
    detectModels: vi.fn().mockResolvedValue({ models: ['claude-sonnet-4-5'] }),
    isDetecting: false,
  }),
}))

// Re-import after mocks
import { AIConfigDialog } from './ai-config-dialog'

describe('AIConfigDialog — thinking stub removal', () => {
  it('does NOT render the thinking flag label after stub removal', async () => {
    await act(async () => {
      render(
        <AIConfigDialog projectId="p1" open={true} onClose={vi.fn()} />
      )
    })

    // After fix: thinking label should NOT appear
    expect(screen.queryByText('一致性深度推理')).toBeNull()
  })
})
