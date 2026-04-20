import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from './message-bubble'
import { SidebarNavProvider, type SidebarTab } from '@/lib/hooks/use-sidebar-nav'

function makeWrapper(initial: {
  activeTab: SidebarTab
  selectedEntryId: string | null
}) {
  const setActiveTab = vi.fn()
  const setSelectedEntryId = vi.fn()
  const Wrapper = ({ children }: { children: unknown }) => (
    <SidebarNavProvider
      activeTab={initial.activeTab}
      selectedEntryId={initial.selectedEntryId}
      setActiveTab={setActiveTab}
      setSelectedEntryId={setSelectedEntryId}
    >
      {children}
    </SidebarNavProvider>
  )
  Wrapper.displayName = 'TestWrapper'
  return Wrapper
}

describe('MessageBubble', () => {
  it('renders 5 star buttons for assistant message with citations when useCitations is true', () => {
    const assistantMsgWithCitations = {
      id: 'msg1',
      projectId: 'p1',
      conversationId: 'c1',
      role: 'assistant' as const,
      content: 'Test response',
      timestamp: Date.now(),
      citations: [{ documentIndex: 0, startBlockIndex: 0, endBlockIndex: 1, citedText: 'test', entryId: 'e1' }],
    }

    const wrapper = makeWrapper({ activeTab: 'chapters', selectedEntryId: null })

    render(
      <MessageBubble
        message={assistantMsgWithCitations}
        projectId="p1"
        useCitations={true}
      />,
      { wrapper }
    )

    // Should have 5 star buttons (aria-label matches 1星 through 5星)
    const stars = screen.getAllByRole('button').filter(btn => btn.getAttribute('aria-label')?.includes('星'))
    expect(stars.length).toBe(5)
  })

  it('does not render star rating when useCitations is false', () => {
    const assistantMsg = {
      id: 'msg1',
      projectId: 'p1',
      conversationId: 'c1',
      role: 'assistant' as const,
      content: 'Test response',
      timestamp: Date.now(),
      citations: [{ documentIndex: 0, startBlockIndex: 0, endBlockIndex: 1, citedText: 'test', entryId: 'e1' }],
    }

    const wrapper = makeWrapper({ activeTab: 'chapters', selectedEntryId: null })

    render(
      <MessageBubble
        message={assistantMsg}
        projectId="p1"
        useCitations={false}
      />,
      { wrapper }
    )

    const stars = screen.queryAllByRole('button').filter(btn => btn.getAttribute('aria-label')?.includes('星'))
    expect(stars.length).toBe(0)
  })

  it('does not render star rating when message has no citations', () => {
    const assistantMsgNoCitations = {
      id: 'msg1',
      projectId: 'p1',
      conversationId: 'c1',
      role: 'assistant' as const,
      content: 'Test response without citations',
      timestamp: Date.now(),
    }

    const wrapper = makeWrapper({ activeTab: 'chapters', selectedEntryId: null })

    render(
      <MessageBubble
        message={assistantMsgNoCitations}
        projectId="p1"
        useCitations={true}
      />,
      { wrapper }
    )

    const stars = screen.queryAllByRole('button').filter(btn => btn.getAttribute('aria-label')?.includes('星'))
    expect(stars.length).toBe(0)
  })
})
