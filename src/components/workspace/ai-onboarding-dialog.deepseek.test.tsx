import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIOnboardingDialog } from './ai-onboarding-dialog'

const mockSaveConfig = vi.fn()

vi.mock('@/lib/hooks/use-ai-config', () => ({
  useAIConfig: () => ({ saveConfig: mockSaveConfig }),
}))

vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))

describe('AIOnboardingDialog DeepSeek preset', () => {
  beforeEach(() => {
    mockSaveConfig.mockReset()
    mockSaveConfig.mockResolvedValue(undefined)
  })

  it('uses supported DeepSeek defaults when the provider is selected', async () => {
    render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('combobox', { name: '服务商' }))
    fireEvent.click(screen.getByRole('option', { name: 'DeepSeek' }))
    fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-deepseek' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/模型/)).toHaveValue('deepseek-v4-flash')
    })
  })
})
