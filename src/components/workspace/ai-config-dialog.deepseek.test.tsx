import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AIConfigDialog } from './ai-config-dialog'

const mockSaveConfig = vi.fn()

vi.mock('@/lib/hooks/use-ai-config', () => ({
  useAIConfig: () => ({
    config: {
      provider: 'openai-compatible',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v3.1',
      availableModels: ['deepseek-v3.1'],
    },
    saveConfig: mockSaveConfig,
  }),
}))

vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))

describe('AIConfigDialog DeepSeek replay', () => {
  beforeEach(() => {
    mockSaveConfig.mockReset()
    mockSaveConfig.mockResolvedValue(undefined)
  })

  it('replays the DeepSeek provider from saved config when opened', async () => {
    render(<AIConfigDialog open={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: '服务商' })).toHaveTextContent('DeepSeek')
    })
  })

  it('replaces unsupported legacy DeepSeek model before saving', async () => {
    render(<AIConfigDialog open={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/模型/)).toHaveValue('deepseek-v4-flash')
    })

    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'deepseek-v4-flash',
          availableModels: ['deepseek-v4-flash', 'deepseek-v4-pro'],
        })
      )
    })
  })
})
