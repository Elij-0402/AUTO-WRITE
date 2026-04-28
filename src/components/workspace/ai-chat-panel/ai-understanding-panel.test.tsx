import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AIUnderstandingPanel } from './ai-understanding-panel'

describe('AIUnderstandingPanel', () => {
  it('renders nothing when there is no charter content', () => {
    const { container } = render(
      <AIUnderstandingPanel
        charter={{
          oneLinePremise: '',
          storyPromise: '',
          themes: [],
          aiUnderstanding: '',
        }}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('shows a collapsed summary and expands to reveal details', () => {
    render(
      <AIUnderstandingPanel
        charter={{
          oneLinePremise: '这是一个关于失势太子回到帝京争回身份的故事。',
          storyPromise: '核心体验偏压迫感与关系反噬。',
          themes: ['复国', '关系反噬'],
          aiUnderstanding: '一句话 premise：这是一个关于失势太子回到帝京争回身份的故事。',
        }}
      />
    )

    expect(screen.getByText('我先这样理解')).toBeInTheDocument()
    expect(screen.queryByText('我会优先守住的感觉')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '展开当前理解' }))

    expect(screen.getByText('我会优先守住的感觉')).toBeInTheDocument()
    expect(screen.getByText('复国')).toBeInTheDocument()
  })

  it('allows editing and saving the current understanding', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <AIUnderstandingPanel
        charter={{
          oneLinePremise: '这是一个关于失势太子回到帝京争回身份的故事。',
          storyPromise: '核心体验偏压迫感与关系反噬。',
          themes: ['复国', '关系反噬'],
          aiUnderstanding: '一句话 premise：这是一个关于失势太子回到帝京争回身份的故事。',
        }}
        onSave={onSave}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '展开当前理解' }))
    fireEvent.click(screen.getByRole('button', { name: '改一下' }))
    fireEvent.change(screen.getByDisplayValue('这是一个关于失势太子回到帝京争回身份的故事。'), {
      target: { value: '这是一个关于流亡太子重返帝京、夺回身份的故事。' },
    })
    fireEvent.click(screen.getByRole('button', { name: '存一下' }))

    expect(onSave).toHaveBeenCalledWith({
      oneLinePremise: '这是一个关于流亡太子重返帝京、夺回身份的故事。',
      storyPromise: '核心体验偏压迫感与关系反噬。',
      themes: ['复国', '关系反噬'],
    })
  })
})
