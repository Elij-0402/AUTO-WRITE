import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConversationDrawer } from './conversation-drawer'

const conversations = [
  {
    id: 'conv-2',
    projectId: 'project-1',
    title: '新的方向',
    updatedAt: Date.now(),
    createdAt: Date.now(),
    messageCount: 6,
  },
  {
    id: 'conv-1',
    projectId: 'project-1',
    title: '旧对话',
    updatedAt: Date.now() - 60_000,
    createdAt: Date.now() - 60_000,
    messageCount: 3,
  },
]

describe('ConversationDrawer', () => {
  it('lets the user switch to a conversation and highlights the current one', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <ConversationDrawer
        open
        onClose={vi.fn()}
        conversations={conversations}
        activeConversationId="conv-2"
        onSelect={onSelect}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '打开对话：新的方向' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: '打开对话：旧对话' }))

    expect(onSelect).toHaveBeenCalledWith('conv-1')
  })

  it('deletes without also triggering selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onDelete = vi.fn()

    render(
      <ConversationDrawer
        open
        onClose={vi.fn()}
        conversations={conversations}
        activeConversationId="conv-2"
        onSelect={onSelect}
        onDelete={onDelete}
      />
    )

    await user.click(screen.getAllByRole('button', { name: '删除对话' })[1])

    expect(onDelete).toHaveBeenCalledWith('conv-1')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
