import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import type { ChatMessage, Conversation } from '../db/project-db'

export type { Conversation }
export interface ConversationPresentation extends Conversation {
  displayTitle: string
  lastMeaningfulSnippet: string
  conversationKind?: 'chat' | 'draft'
}

function truncateLabel(value: string, maxLength: number): string {
  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}…`
}

function normalizeSnippet(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/([：:])\s+/g, '$1').trim()
}

export function deriveConversationPresentation(
  conversation: Conversation,
  messages: ChatMessage[]
): ConversationPresentation {
  const meaningfulMessages = messages.filter((message) => normalizeSnippet(message.content).length > 0)
  const firstUserMessage = meaningfulMessages.find((message) => message.role === 'user')
  const lastMeaningfulMessage = meaningfulMessages.at(-1)
  const hasDraft = meaningfulMessages.some((message) => message.hasDraft)

  const inferredTitle =
    conversation.title === '对话' || conversation.title === '历史对话'
      ? truncateLabel(firstUserMessage?.content ?? '', 17) || '新对话'
      : conversation.title

  return {
    ...conversation,
    displayTitle: inferredTitle,
    lastMeaningfulSnippet: normalizeSnippet(lastMeaningfulMessage?.content ?? ''),
    conversationKind: hasDraft ? 'draft' : 'chat',
  }
}

export function useConversations(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const conversations = useLiveQuery(
    async () => {
      const list = await db.table('conversations')
        .where('projectId').equals(projectId)
        .toArray() as Conversation[]

      const sorted = list.sort((a, b) => b.updatedAt - a.updatedAt)
      return Promise.all(
        sorted.map(async (conversation) => {
          const messages = await db.table('messages')
            .where('conversationId').equals(conversation.id)
            .sortBy('timestamp') as ChatMessage[]

          return deriveConversationPresentation(conversation, messages)
        })
      )
    },
    [db, projectId],
    [] as ConversationPresentation[]
  )

  const remove = useCallback(async (id: string): Promise<void> => {
    await db.transaction('rw', db.table('conversations'), db.table('messages'), async () => {
      await db.table('messages').where('conversationId').equals(id).delete()
      await db.table('conversations').delete(id)
    })
  }, [db])

  return {
    conversations: conversations ?? [],
    loading: conversations === undefined,
    remove,
  }
}
