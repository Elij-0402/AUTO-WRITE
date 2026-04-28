import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChapterMetaStrip } from './chapter-meta-strip'

describe('ChapterMetaStrip', () => {
  it('renders chapter number chip', () => {
    render(<ChapterMetaStrip chapterNumber={4} wordCount={0} status="draft" />)
    expect(screen.getByText('第 4 章')).toBeInTheDocument()
  })

  it('renders localized word count', () => {
    render(<ChapterMetaStrip chapterNumber={1} wordCount={2450} status="draft" />)
    expect(screen.getByText('2,450 字')).toBeInTheDocument()
  })

  it('renders draft status label when status is draft', () => {
    render(<ChapterMetaStrip chapterNumber={1} wordCount={100} status="draft" />)
    expect(screen.getByText('草稿')).toBeInTheDocument()
    expect(screen.queryByText('已完成')).not.toBeInTheDocument()
  })

  it('renders completed status label when status is completed', () => {
    render(<ChapterMetaStrip chapterNumber={1} wordCount={100} status="completed" />)
    expect(screen.getByText('已完成')).toBeInTheDocument()
    expect(screen.queryByText('草稿')).not.toBeInTheDocument()
  })

  it('renders extras when provided', () => {
    render(
      <ChapterMetaStrip
        chapterNumber={1}
        wordCount={100}
        status="draft"
        extras={<span data-testid="extra">AI 语调</span>}
      />
    )
    expect(screen.getByTestId('extra')).toBeInTheDocument()
  })

  it('does not render extras slot when not provided', () => {
    const { container } = render(
      <ChapterMetaStrip chapterNumber={1} wordCount={100} status="draft" />
    )
    // extras wrapper has ml-auto; absent when no extras
    expect(container.querySelector('.ml-auto')).toBeNull()
  })

  it('renders the chapter title when provided', () => {
    render(
      <ChapterMetaStrip
        chapterNumber={1}
        chapterTitle="雨夜押解"
        wordCount={100}
        status="draft"
      />
    )

    expect(screen.getByText('雨夜押解')).toBeInTheDocument()
  })
})
