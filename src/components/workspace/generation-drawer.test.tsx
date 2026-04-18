import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GenerationDrawer } from './generation-drawer'

describe('GenerationDrawer', () => {
  it('renders streaming content as paragraphs', () => {
    render(
      <GenerationDrawer
        open={true}
        onClose={vi.fn()}
        onAccept={vi.fn()}
        onRegenerate={vi.fn()}
        streamingContent="第一段内容。\n\n第二段内容。"
        status="generating"
        error={null}
      />
    )
    // Sheet renders via Portal to body, so query document.body
    expect(document.body.textContent).toContain('第一段内容。')
    expect(document.body.textContent).toContain('第二段内容。')
  })

  it('shows Accept/Reject/Regenerate buttons when complete', () => {
    render(
      <GenerationDrawer
        open={true}
        onClose={vi.fn()}
        onAccept={vi.fn()}
        onRegenerate={vi.fn()}
        streamingContent="生成完成的内容。"
        status="complete"
        error={null}
      />
    )
    expect(screen.getByText('采纳')).toBeInTheDocument()
    expect(screen.getByText('重新生成')).toBeInTheDocument()
  })

  it('shows error message when status is error', () => {
    render(
      <GenerationDrawer
        open={true}
        onClose={vi.fn()}
        onAccept={vi.fn()}
        onRegenerate={vi.fn()}
        streamingContent=""
        status="error"
        error="生成失败，请重试"
      />
    )
    expect(screen.getByText('生成失败，请重试')).toBeInTheDocument()
  })

  it('shows retry button when status is error', () => {
    render(
      <GenerationDrawer
        open={true}
        onClose={vi.fn()}
        onAccept={vi.fn()}
        onRegenerate={vi.fn()}
        streamingContent=""
        status="error"
        error="Something went wrong"
      />
    )
    expect(screen.getByText('重试')).toBeInTheDocument()
  })
})
