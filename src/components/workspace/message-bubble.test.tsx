import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '@/lib/hooks/use-ai-chat'
import { MessageBubble } from './message-bubble'

const assistantMessage: ChatMessage = {
  id: 'msg-1',
  projectId: 'proj-1',
  conversationId: 'conv-1',
  role: 'assistant',
  content: '这是一条回复。',
  timestamp: Date.now(),
}

const directionAdjustmentMessage: ChatMessage = {
  id: 'msg-2',
  projectId: 'proj-1',
  conversationId: 'conv-1',
  role: 'assistant',
  kind: 'direction-adjustment',
  content: '收到，我按这个理解继续。后面如果你想改，我们就边写边调。',
  timestamp: Date.now(),
}

describe('MessageBubble', () => {
  it('reports preference payload through the panel-owned callback', async () => {
    const onRecordPreference = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <MessageBubble
        message={assistantMessage}
        projectId="proj-1"
        onRecordPreference={onRecordPreference}
      />
    )

    await user.click(screen.getByRole('button', { name: '记录偏差' }))
    await user.click(screen.getByLabelText('人物不对味'))
    await user.type(screen.getByLabelText('具体偏差'), '主角说话太轻浮')
    await user.click(screen.getByRole('button', { name: '记录偏差' }))

    await waitFor(() => {
      expect(onRecordPreference).toHaveBeenCalledWith({
        messageId: 'msg-1',
        category: 'character',
        note: '主角说话太轻浮',
      })
    })
  })

  it('renders direction-adjustment messages as lighter acknowledgements', () => {
    render(
      <MessageBubble
        message={directionAdjustmentMessage}
        projectId="proj-1"
      />
    )

    expect(screen.getByText('墨客已记下')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '记录偏差' })).not.toBeInTheDocument()
  })
})
