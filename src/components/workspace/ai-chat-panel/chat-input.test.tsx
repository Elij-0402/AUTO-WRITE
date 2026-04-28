import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatInput } from './chat-input'

describe('ChatInput', () => {
  const baseProps = {
    input: '',
    loading: false,
    chatError: null,
    aiConfig: {
      apiKey: 'sk-test',
      model: 'deepseek-v4-flash',
      availableModels: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    },
    onInputChange: vi.fn(),
    onKeyDown: vi.fn(),
    onSend: vi.fn(),
    onCancel: vi.fn(),
    onSaveModel: vi.fn(),
    onDismissError: vi.fn(),
    onOpenAIConfig: vi.fn(),
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

  it('supports a custom opening placeholder for the first conversation turn', () => {
    render(
      <ChatInput
        {...baseProps}
        placeholder="你想写一个什么故事，或者想要什么感觉？"
      />
    )

    expect(
      screen.getByPlaceholderText('你想写一个什么故事，或者想要什么感觉？')
    ).toBeInTheDocument()
  })

  it('keeps the input, model picker, and send button inside one composer container', () => {
    render(<ChatInput {...baseProps} input="想写一个复仇故事" />)

    const textarea = screen.getByRole('textbox')
    const modelPicker = screen.getByRole('combobox', { name: '选择模型' })
    const sendButton = screen.getByRole('button', { name: '发送' })

    const composer = screen.getByTestId('chat-composer')

    expect(composer).toContainElement(textarea)
    expect(composer).toContainElement(modelPicker)
    expect(composer).toContainElement(sendButton)
  })

  it('renders the text input without standalone textarea chrome', () => {
    render(<ChatInput {...baseProps} input="想写一个复仇故事" />)

    const textarea = screen.getByRole('textbox')

    expect(textarea.className).not.toContain('rounded-sm')
    expect(textarea.className).not.toContain('border-[hsl(var(--border))]')
  })

  it('shows 未配置模型 and hides the picker when api key is missing', () => {
    render(
      <ChatInput
        {...baseProps}
        aiConfig={{
          apiKey: '',
          model: 'claude-sonnet-4-5',
          availableModels: ['claude-sonnet-4-5'],
        }}
      />
    )

    expect(screen.queryByRole('combobox', { name: '选择模型' })).toBeNull()
    expect(screen.getByText('未配置模型')).toBeInTheDocument()
  })

  it('shows a direct configure action when api key is missing', () => {
    const onOpenAIConfig = vi.fn()

    render(
      <ChatInput
        {...baseProps}
        onOpenAIConfig={onOpenAIConfig}
        aiConfig={{
          apiKey: '',
          model: '',
          availableModels: [],
        }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '去配置 AI' }))

    expect(onOpenAIConfig).toHaveBeenCalledTimes(1)
  })

  it('uses a softer rounded composer container', () => {
    render(<ChatInput {...baseProps} />)

    const composer = screen.getByTestId('chat-composer')

    expect(composer.className).toContain('rounded-[8px]')
  })
})
