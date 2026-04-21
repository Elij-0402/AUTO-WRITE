import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { AIOnboardingDialog } from './ai-onboarding-dialog'

const mockSaveConfig = vi.fn()
vi.mock('@/lib/hooks/use-ai-config', () => ({
  useAIConfig: () => ({ saveConfig: mockSaveConfig }),
}))

let fetchMockQueue: Array<() => Response | Promise<Response>> = []
let fetchMockIndex = 0

vi.stubGlobal('fetch', async () => {
  if (fetchMockIndex < fetchMockQueue.length) {
    return fetchMockQueue[fetchMockIndex++]()
  }
  throw new Error('Unexpected fetch call with no mock set up')
})

describe('AIOnboardingDialog', () => {
  beforeEach(() => {
    fetchMockQueue = []
    fetchMockIndex = 0
    mockSaveConfig.mockReset()
    mockSaveConfig.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  describe('skip behavior', () => {
    it('calls onSkip when skip button is clicked', () => {
      const onSkip = vi.fn()
      render(<AIOnboardingDialog open={true} onSkip={onSkip} onSaveComplete={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: '跳过' }))
      expect(onSkip).toHaveBeenCalledTimes(1)
    })

    it('does not call onSaveComplete when skip is clicked', () => {
      const onSaveComplete = vi.fn()
      render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={onSaveComplete} />)
      fireEvent.click(screen.getByRole('button', { name: '跳过' }))
      expect(onSaveComplete).not.toHaveBeenCalled()
    })
  })

  describe('escape key blocking', () => {
    it('blocks Escape key when save has not completed', () => {
      const onSkip = vi.fn()
      render(<AIOnboardingDialog open={true} onSkip={onSkip} onSaveComplete={vi.fn()} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onSkip).not.toHaveBeenCalled()
    })
  })

  describe('probe failure error display', () => {
    it('displays 401 error and does not call onSaveComplete', async () => {
      fetchMockQueue = [() => new Response('', { status: 401 })]
      const onSaveComplete = vi.fn()

      render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={onSaveComplete} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-bad' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText(/401.*API Key 可能填写错误/)).toBeInTheDocument()
      })
      expect(onSaveComplete).not.toHaveBeenCalled()
    })
  })

  describe('model field visibility', () => {
    it('hides model input when apiKey is empty', () => {
      render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={vi.fn()} />)
      expect(screen.queryByLabelText(/模型/)).toBeNull()
    })

    it('shows model input after apiKey is filled', async () => {
      render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-' } })

      await waitFor(() => {
        expect(screen.getByLabelText(/模型/)).toBeVisible()
      })
    })
  })

  describe('save button state', () => {
    it('save button is disabled when apiKey is empty', () => {
      render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={vi.fn()} />)
      expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
    })

    it('save button is enabled when apiKey is filled', () => {
      render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-' } })
      expect(screen.getByRole('button', { name: '保存' })).not.toBeDisabled()
    })
  })

  describe('successful save', () => {
    it('calls onSaveComplete when probe succeeds', async () => {
      fetchMockQueue = [() => new Response(null, { status: 200 })]
      const onSaveComplete = vi.fn()

      render(<AIOnboardingDialog open={true} onSkip={vi.fn()} onSaveComplete={onSaveComplete} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-ok' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(mockSaveConfig).toHaveBeenCalled()
        expect(onSaveComplete).toHaveBeenCalled()
      })
    })
  })
})
