import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { AIConfigDialog } from './ai-config-dialog'

const mockSaveConfig = vi.fn()
vi.mock('@/lib/hooks/use-ai-config', () => ({
  useAIConfig: () => ({
    config: { provider: 'anthropic', apiKey: '', baseUrl: '', model: 'claude-sonnet-4-20250514' },
    saveConfig: mockSaveConfig,
  }),
}))

let fetchMockQueue: Array<() => Response | Promise<Response>> = []
let fetchMockIndex = 0

vi.stubGlobal('fetch', async () => {
  if (fetchMockIndex < fetchMockQueue.length) {
    return fetchMockQueue[fetchMockIndex++]()
  }
  throw new Error('Unexpected fetch call with no mock set up')
})

describe('AIConfigDialog', () => {
  beforeEach(() => {
    fetchMockQueue = []
    fetchMockIndex = 0
    mockSaveConfig.mockReset()
    mockSaveConfig.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  describe('model field visibility', () => {
    it('hides model input when apiKey is empty', () => {
      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      expect(screen.queryByLabelText(/模型/)).toBeNull()
    })

    it('shows model input after apiKey is filled', async () => {
      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      const input = screen.getByLabelText(/API Key/)
      fireEvent.change(input, { target: { value: 'sk-ant-' } })

      await waitFor(() => {
        expect(screen.getByLabelText(/模型/)).toBeVisible()
      })
    })
  })

  describe('probe failure error display', () => {
    it('displays 401 error and blocks save', async () => {
      fetchMockQueue = [() => new Response('', { status: 401 })]

      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-bad' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText(/401.*API Key 可能填写错误/)).toBeInTheDocument()
      })
      expect(mockSaveConfig).not.toHaveBeenCalled()
    })

    it('displays 429 error on rate limit', async () => {
      fetchMockQueue = [() => new Response('', { status: 429 })]

      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-over' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText(/429.*触发速率限制/)).toBeInTheDocument()
      })
    })

    it('displays 404 error on not found', async () => {
      fetchMockQueue = [() => new Response('', { status: 404 })]

      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-badmodel' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText(/404.*模型名可能拼错/)).toBeInTheDocument()
      })
    })

    it('displays network error on fetch rejection', async () => {
      fetchMockQueue = [() => Promise.reject(new TypeError('Failed to fetch'))]

      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-net' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText(/网络错误/)).toBeInTheDocument()
      })
    })

    it('keeps dialog open after probe failure', async () => {
      fetchMockQueue = [() => new Response('', { status: 401 })]
      const onClose = vi.fn()

      render(<AIConfigDialog open={true} onClose={onClose} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-bad' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(screen.getByText(/401/)).toBeInTheDocument()
      })
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('save button state', () => {
    it('save button is disabled when apiKey is empty', () => {
      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
    })

    it('save button is enabled when apiKey is filled', () => {
      render(<AIConfigDialog open={true} onClose={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-key' } })
      expect(screen.getByRole('button', { name: '保存' })).not.toBeDisabled()
    })
  })

  describe('successful save', () => {
    it('calls saveConfig and onClose when probe succeeds', async () => {
      fetchMockQueue = [() => new Response(null, { status: 200 })]
      const onClose = vi.fn()

      render(<AIConfigDialog open={true} onClose={onClose} />)
      fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'sk-ant-ok' } })
      fireEvent.click(screen.getByRole('button', { name: '保存' }))

      await waitFor(() => {
        expect(mockSaveConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'anthropic',
            apiKey: 'sk-ant-ok',
          })
        )
        expect(onClose).toHaveBeenCalled()
      })
    })
  })
})
