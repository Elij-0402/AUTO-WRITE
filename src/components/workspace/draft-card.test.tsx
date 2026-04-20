import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { createProjectDB, __resetProjectDBCache, type AIUsageEvent } from '@/lib/db/project-db'
import { DraftCard } from './draft-card'

const PROJECT_ID = 'draft-card-test-proj'

async function seedChatUsage(messageId: string): Promise<string> {
  const db = createProjectDB(PROJECT_ID)
  const id = `chat:${messageId}`
  const row: AIUsageEvent = {
    id,
    projectId: PROJECT_ID,
    conversationId: 'conv-1',
    kind: 'chat',
    provider: 'anthropic',
    model: 'claude-sonnet-4',
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    latencyMs: 1200,
    createdAt: Date.now(),
  }
  await db.aiUsage.put(row)
  return id
}

describe('DraftCard T1 adoption telemetry', () => {
  beforeEach(async () => {
    __resetProjectDBCache()
    indexedDB.deleteDatabase(`inkforge-project-${PROJECT_ID}`)
  })

  afterEach(async () => {
    __resetProjectDBCache()
  })

  it('renders nothing when draft content is empty or whitespace (CEO-4A)', () => {
    const { container } = render(
      <DraftCard
        draftId="d-1"
        content={'   \n   '}
        projectId={PROJECT_ID}
        messageId="m-1"
        onInsert={() => {}}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('insert click patches the chat aiUsage row with draftAccepted=true + deadline', async () => {
    const onInsert = vi.fn()
    const messageId = 'm-accept-1'
    const rowId = await seedChatUsage(messageId)

    render(
      <DraftCard
        draftId="d-1"
        content="这是一段草稿内容。"
        projectId={PROJECT_ID}
        messageId={messageId}
        onInsert={onInsert}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /插入到正文/ }))
    expect(onInsert).toHaveBeenCalledTimes(1)

    await waitFor(async () => {
      const db = createProjectDB(PROJECT_ID)
      const row = await db.aiUsage.get(rowId)
      expect(row?.draftOffered).toBe(true)
      expect(row?.draftAccepted).toBe(true)
      expect(row?.editedPctDeadline).toBeGreaterThan(Date.now())
      // Deadline is ~30 min out; tolerate ±1s slack.
      expect(row?.editedPctDeadline).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000 + 1000)
    })
  })

  it('reject flow: opens dialog, submits reason + note, patches aiUsage', async () => {
    const messageId = 'm-reject-1'
    const rowId = await seedChatUsage(messageId)

    render(
      <DraftCard
        draftId="d-1"
        content="草稿内容。"
        projectId={PROJECT_ID}
        messageId={messageId}
        onInsert={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /不采纳/ }))
    await waitFor(() => expect(screen.getByText('为什么不采纳？')).toBeVisible())

    // Pick the 'style' reason
    fireEvent.click(screen.getByLabelText('文风不对'))

    // Type a note and cap behavior
    const note = screen.getByPlaceholderText('具体是哪里不对？')
    fireEvent.change(note, { target: { value: '语气太冷' } })

    fireEvent.click(screen.getByRole('button', { name: '提交' }))

    await waitFor(async () => {
      const db = createProjectDB(PROJECT_ID)
      const row = await db.aiUsage.get(rowId)
      expect(row?.draftOffered).toBe(true)
      expect(row?.draftAccepted).toBe(false)
      expect(row?.draftRejectedReason).toBe('style')
      expect(row?.draftRejectedNote).toBe('语气太冷')
    })
  })

  it('caps free-form note at 500 chars (CEO-3B)', async () => {
    const messageId = 'm-note-cap'
    await seedChatUsage(messageId)

    render(
      <DraftCard
        draftId="d-1"
        content="草稿"
        projectId={PROJECT_ID}
        messageId={messageId}
        onInsert={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /不采纳/ }))
    const note = screen.getByPlaceholderText('具体是哪里不对？') as HTMLTextAreaElement
    const over = 'A'.repeat(600)
    fireEvent.change(note, { target: { value: over } })
    expect(note.value).toHaveLength(500)
  })
})
