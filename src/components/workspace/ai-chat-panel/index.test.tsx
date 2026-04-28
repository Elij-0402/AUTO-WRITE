import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIChatPanel } from './index'

const removeConversationMock = vi.fn()
const addConversationMock = vi.fn()
const conversationDrawerMock = vi.fn()
const useConversationsMock = vi.fn()

vi.mock('@/lib/hooks/use-conversations', () => ({
  useConversations: (...args: unknown[]) => useConversationsMock(...args),
}))

vi.mock('@/lib/db/project-db', () => ({
  createProjectDB: () => ({
    table: () => ({
      add: addConversationMock,
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
    appendDraftTurn: vi.fn().mockResolvedValue(undefined),
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
    config: { apiKey: 'sk-test', model: 'deepseek-v4-flash', availableModels: ['deepseek-v4-flash', 'deepseek-v4-pro'] },
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
  ChatInput: (props: Record<string, unknown>) => (
    <div data-testid="chat-input">
      <button onClick={() => (props.onOpenAIConfig as () => void)?.()}>打开 AI 设置</button>
    </div>
  ),
}))

vi.mock('../new-entry-dialog', () => ({
  NewEntryDialog: () => null,
}))

vi.mock('../chapter-draft-panel', () => ({
  ChapterDraftPanel: (props: Record<string, unknown>) => (
    <div data-testid="draft-panel">
      <div>草稿模式</div>
      <button onClick={() => (props.onOpenAIConfig as () => void)?.()}>草稿去配置</button>
    </div>
  ),
}))

vi.mock('../conversation-drawer', () => ({
  ConversationDrawer: (props: Record<string, unknown>) => {
    conversationDrawerMock(props)
    return (
      <div>
        <div data-testid="drawer-active">{String(props.activeConversationId ?? '')}</div>
        <button onClick={() => (props.onSelect as (id: string) => void)('conv-1')}>切到旧对话</button>
        <button onClick={() => (props.onDelete as (id: string) => Promise<void>)('conv-2')}>删除当前对话</button>
        <button onClick={() => (props.onDelete as (id: string) => Promise<void>)('conv-1')}>删除最后对话</button>
      </div>
    )
  },
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('AIChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    removeConversationMock.mockResolvedValue(undefined)
    addConversationMock.mockResolvedValue(undefined)
    useConversationsMock.mockReturnValue({
      conversations: [
        { id: 'conv-2', title: '新的方向', messageCount: 4, updatedAt: 20, createdAt: 10 },
        { id: 'conv-1', title: '旧对话', messageCount: 2, updatedAt: 10, createdAt: 5 },
      ],
      loading: false,
      remove: removeConversationMock,
    })
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

    expect(screen.getByText('本章助手')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '构思搭档' })).not.toBeInTheDocument()
  })

  it('does not render chapter task tabs when no active chapter is selected', () => {
    render(<AIChatPanel projectId="project-1" />)

    expect(screen.queryByRole('button', { name: '对话' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '起草' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '改写' })).not.toBeInTheDocument()
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

  it('tracks the active conversation explicitly and lets the user switch history items', async () => {
    const user = userEvent.setup()

    render(<AIChatPanel projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('新的方向')).toBeInTheDocument()
    })
    expect(screen.getByTestId('drawer-active')).toHaveTextContent('conv-2')

    await user.click(screen.getByRole('button', { name: '切到旧对话' }))

    await waitFor(() => {
      expect(screen.getByText('旧对话')).toBeInTheDocument()
    })
    expect(screen.getByTestId('drawer-active')).toHaveTextContent('conv-1')
  })

  it('falls back to the next conversation, then creates a fresh one when history becomes empty', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<AIChatPanel projectId="project-1" />)

    await user.click(screen.getByRole('button', { name: '删除当前对话' }))

    expect(removeConversationMock).toHaveBeenCalledWith('conv-2')
    await waitFor(() => {
      expect(screen.getByText('旧对话')).toBeInTheDocument()
    })

    useConversationsMock.mockReturnValue({
      conversations: [],
      loading: false,
      remove: removeConversationMock,
    })

    rerender(<AIChatPanel projectId="project-1" />)

    await user.click(screen.getByRole('button', { name: '删除最后对话' }))

    await waitFor(() => {
      expect(addConversationMock).toHaveBeenCalled()
    })
  })

  it('opens AI settings from the chat composer recovery action', async () => {
    const user = userEvent.setup()
    const onOpenAIConfig = vi.fn()

    render(<AIChatPanel projectId="project-1" onOpenAIConfig={onOpenAIConfig} />)

    await user.click(screen.getByRole('button', { name: '打开 AI 设置' }))

    expect(onOpenAIConfig).toHaveBeenCalledTimes(1)
  })

  it('switches into draft mode and keeps AI settings recoverable there', async () => {
    const user = userEvent.setup()
    const onOpenAIConfig = vi.fn()

    render(
      <AIChatPanel
        projectId="project-1"
        activeChapterId="chapter-1"
        onOpenAIConfig={onOpenAIConfig}
      />
    )

    await user.click(screen.getByRole('button', { name: '起草' }))

    expect(screen.getByTestId('draft-panel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '改写' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '草稿去配置' }))

    expect(onOpenAIConfig).toHaveBeenCalledTimes(1)
  })

  it('shows a rewrite placeholder inside the assistant container', async () => {
    const user = userEvent.setup()

    render(<AIChatPanel projectId="project-1" activeChapterId="chapter-1" />)

    await user.click(screen.getByRole('button', { name: '改写' }))

    expect(screen.getByText('改写功能即将开放')).toBeInTheDocument()
    expect(screen.getByText('后续会在这里提供改写、扩写和续写。')).toBeInTheDocument()
  })
})
