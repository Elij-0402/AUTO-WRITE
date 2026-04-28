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
    appendDirectionAdjustment: vi.fn().mockResolvedValue(undefined),
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

const useProjectCharterMock = vi.fn(() => ({
  charter: {
    oneLinePremise: '',
    storyPromise: '',
    themes: [],
    aiUnderstanding: '',
  },
  save: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/hooks/use-project-charter', () => ({
  useProjectCharter: (...args: unknown[]) => useProjectCharterMock(...args),
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
    useProjectCharterMock.mockReturnValue({
      charter: {
        oneLinePremise: '',
        storyPromise: '',
        themes: [],
        aiUnderstanding: '',
      },
      save: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('does not render the wizard entry point in the header', () => {
    render(<AIChatPanel projectId="project-1" />)

    expect(screen.queryByRole('button', { name: '构思搭档' })).not.toBeInTheDocument()
  })

  it('shows the AI understanding section once charter content exists', () => {
    useProjectCharterMock.mockReturnValue({
      charter: {
        oneLinePremise: '这是一个关于失势太子回到帝京争回身份的故事。',
        storyPromise: '核心体验偏压迫感与关系反噬。',
        themes: ['复国', '关系反噬'],
        aiUnderstanding: '一句话 premise：这是一个关于失势太子回到帝京争回身份的故事。',
      },
      save: vi.fn().mockResolvedValue(undefined),
    })

    render(<AIChatPanel projectId="project-1" />)

    expect(screen.getByText('我先这样理解')).toBeInTheDocument()
  })
})
