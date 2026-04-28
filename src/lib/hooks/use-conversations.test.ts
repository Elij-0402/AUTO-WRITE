import { describe, expect, it } from 'vitest'
import { deriveConversationPresentation } from './use-conversations'
import type { ChatMessage, Conversation } from '../db/project-db'

const baseConversation: Conversation = {
  id: 'conv-1',
  projectId: 'project-1',
  title: '对话',
  createdAt: 1,
  updatedAt: 2,
  messageCount: 4,
}

describe('deriveConversationPresentation', () => {
  it('derives a readable title and last snippet from meaningful messages', () => {
    const messages: ChatMessage[] = [
      {
        id: 'm1',
        projectId: 'project-1',
        conversationId: 'conv-1',
        role: 'user',
        content: '我想写一个复仇复国，但关系张力要特别狠的故事',
        timestamp: 1,
      },
      {
        id: 'm2',
        projectId: 'project-1',
        conversationId: 'conv-1',
        role: 'assistant',
        content: '可以，我们先把主角的失势处境钉牢，再设计他最想夺回的东西。',
        timestamp: 2,
      },
    ]

    expect(
      deriveConversationPresentation(baseConversation, messages)
    ).toMatchObject({
      displayTitle: '我想写一个复仇复国，但关系张力要特…',
      lastMeaningfulSnippet: '可以，我们先把主角的失势处境钉牢，再设计他最想夺回的东西。',
      conversationKind: 'chat',
    })
  })

  it('keeps a draft-oriented title when the thread already names a chapter draft', () => {
    const draftConversation: Conversation = {
      ...baseConversation,
      title: '第 12 章草稿',
    }
    const messages: ChatMessage[] = [
      {
        id: 'm1',
        projectId: 'project-1',
        conversationId: 'conv-1',
        role: 'assistant',
        content: '以下是草稿：\n\n风雪压城，沈昭第一次踏进王都。',
        timestamp: 3,
        hasDraft: true,
      },
    ]

    expect(
      deriveConversationPresentation(draftConversation, messages)
    ).toMatchObject({
      displayTitle: '第 12 章草稿',
      lastMeaningfulSnippet: '以下是草稿：风雪压城，沈昭第一次踏进王都。',
      conversationKind: 'draft',
    })
  })
})
