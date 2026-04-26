import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AIChatPanel } from './index'

vi.mock('@/lib/hooks/use-conversations', () => ({
  useConversations: () => ({
    conversations: [
      { id: 'conv-1', title: '对话', messageCount: 0 },
    ],
    loading: false,
    remove: vi.fn(),
  }),
}))

vi.mock('@/lib/db/project-db', () => ({
  createProjectDB: () => ({
    table: () => ({
      add: vi.fn(),
      get: vi.fn(),
    }),
    contradictions: {
      where: () => ({
        equals: () => ({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      update: vi.fn(),
    },
  }),
}))

vi.mock('@/lib/hooks/use-ai-chat', () => ({
  useAIChat: () => ({
    messages: [],
    loading: false,
    sendMessage: vi.fn().mockResolvedValue({ success: true }),
    cancelStream: vi.fn(),
    suggestions: [],
    dismissSuggestion: vi.fn(),
    clearSuggestions: vi.fn(),
    contradictions: [],
    isCheckingConsistency: false,
    addExemption: vi.fn(),
    clearContradiction: vi.fn(),
    cacheHint: null,
  }),
}))

vi.mock('@/lib/hooks/use-ai-config', () => ({
  useAIConfig: () => ({
    config: { model: 'deepseek-chat' },
    saveConfig: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/lib/hooks/use-world-entries', () => ({
  useWorldEntries: () => ({
    entriesByType: { character: [], location: [], rule: [], timeline: [] },
    addEntry: vi.fn(),
    updateEntryFields: vi.fn(),
  }),
}))

vi.mock('@/lib/hooks/use-relations', () => ({
  useRelations: () => ({
    addRelation: vi.fn(),
  }),
}))

vi.mock('@/lib/hooks/use-dismissed-suggestions', () => ({
  useDismissedSuggestions: () => ({
    dismiss: vi.fn(),
    filterDismissed: (suggestions: unknown[]) => suggestions,
    reset: vi.fn(),
  }),
}))

vi.mock('./message-list', () => ({
  MessageList: () => <div data-testid="message-list" />,
}))

vi.mock('./chat-input', () => ({
  ChatInput: () => <div data-testid="chat-input" />,
}))

vi.mock('../new-entry-dialog', () => ({
  NewEntryDialog: () => null,
}))

vi.mock('../conversation-drawer', () => ({
  ConversationDrawer: () => null,
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('AIChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render the wizard entry point in the header', () => {
    render(<AIChatPanel projectId="project-1" />)

    expect(screen.queryByRole('button', { name: '构思搭档' })).not.toBeInTheDocument()
  })
})
