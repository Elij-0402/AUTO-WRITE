import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatInput } from './chat-input'

describe('ChatInput', () => {
  const baseProps = {
    input: '',
    loading: false,
    chatError: null,
    aiConfig: {
      model: 'deepseek-v4-flash',
      availableModels: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    },
    onInputChange: vi.fn(),
    onKeyDown: vi.fn(),
    onSend: vi.fn(),
    onCancel: vi.fn(),
    onSaveModel: vi.fn(),
    onDismissError: vi.fn(),
  }

  it('hides the character count when the draft is still very short', () => {
    render(<ChatInput {...baseProps} input="hi" />)

    expect(screen.queryByText('2 字')).toBeNull()
  })

  it('shows a readable character count label near the limit', () => {
    render(<ChatInput {...baseProps} input={'a'.repeat(3201)} />)

    expect(screen.getByText('3201 字')).toBeInTheDocument()
  })

  it('renders the model picker with the configured model label', () => {
    render(<ChatInput {...baseProps} />)

    expect(screen.getByRole('combobox', { name: '选择模型' })).toHaveTextContent('deepseek-v4-flash')
  })

  it('calls onSaveModel when the user selects another model', () => {
    const onSaveModel = vi.fn()
    render(<ChatInput {...baseProps} onSaveModel={onSaveModel} />)

    fireEvent.click(screen.getByRole('combobox', { name: '选择模型' }))
    fireEvent.click(screen.getByRole('option', { name: 'deepseek-v4-pro' }))

    expect(onSaveModel).toHaveBeenCalledWith('deepseek-v4-pro')
  })
})
