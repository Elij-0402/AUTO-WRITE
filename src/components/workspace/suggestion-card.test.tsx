import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NewEntrySuggestionCard } from './suggestion-card'

describe('NewEntrySuggestionCard', () => {
  it('renders the suggestion source label when provided', () => {
    render(
      <NewEntrySuggestionCard
        entryType="character"
        suggestedName="林默"
        description="建议为核心角色建立百科条目。"
        sourceLabel="来自正文抽取"
        onAdopt={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText('来自正文抽取')).toBeInTheDocument()
  })
})
