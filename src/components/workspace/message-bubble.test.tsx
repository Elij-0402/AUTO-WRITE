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
  it('renders 5 star buttons for assistant message with citations', () => {
    const assistantMsgWithCitations = {
      id: 'msg1',
      projectId: 'p1',
      conversationId: 'c1',
      role: 'assistant' as const,
      content: 'Test response',
      timestamp: Date.now(),
      citations: [{ startBlockIndex: 0, endBlockIndex: 1, citationText: 'test', entryId: 'e1' }],
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
})
