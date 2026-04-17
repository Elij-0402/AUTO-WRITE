import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import type { Conversation } from '../db/project-db'

export type { Conversation }

export function useConversations(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const conversations = useLiveQuery(
    () => db.table('conversations')
      .where('projectId').equals(projectId)
      .toArray()
      .then(list => (list as Conversation[]).sort((a, b) => b.updatedAt - a.updatedAt)),
    [db, projectId],
    [] as Conversation[]
  )

  const create = useCallback(async (title = '新对话'): Promise<string> => {
    const now = Date.now()
    const conv: Conversation = {
      id: crypto.randomUUID(),
      projectId,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    }
    await db.table('conversations').add(conv)
    return conv.id
  }, [db, projectId])

  const rename = useCallback(async (id: string, title: string): Promise<void> => {
    await db.table('conversations').update(id, { title, updatedAt: Date.now() })
  }, [db])

  const remove = useCallback(async (id: string): Promise<void> => {
    await db.transaction('rw', db.table('conversations'), db.table('messages'), async () => {
      await db.table('messages').where('conversationId').equals(id).delete()
      await db.table('conversations').delete(id)
    })
  }, [db])

  return {
    conversations: conversations ?? [],
    loading: conversations === undefined,
    create,
    rename,
    remove,
  }
}
