import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import type { Conversation } from '../db/project-db'
import { enqueueChange } from '../sync/sync-queue'
import { createClient } from '../supabase/client'

export type { Conversation }

async function getUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

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
    const userId = await getUserId()
    if (userId) {
      await enqueueChange({
        table: 'conversations',
        operation: 'create',
        data: conv as unknown as Record<string, unknown>,
        localUpdatedAt: now,
        userId,
      })
    }
    return conv.id
  }, [db, projectId])

  const rename = useCallback(async (id: string, title: string): Promise<void> => {
    const now = Date.now()
    await db.table('conversations').update(id, { title, updatedAt: now })
    const userId = await getUserId()
    if (userId) {
      const conv = await db.table('conversations').get(id) as Conversation | undefined
      if (conv) {
        await enqueueChange({
          table: 'conversations',
          operation: 'update',
          data: conv as unknown as Record<string, unknown>,
          localUpdatedAt: now,
          userId,
        })
      }
    }
  }, [db])

  const remove = useCallback(async (id: string): Promise<void> => {
    await db.transaction('rw', db.table('conversations'), db.table('messages'), async () => {
      await db.table('messages').where('conversationId').equals(id).delete()
      await db.table('conversations').delete(id)
    })
    const userId = await getUserId()
    if (userId) {
      await enqueueChange({
        table: 'conversations',
        operation: 'delete',
        data: { id } as Record<string, unknown>,
        localUpdatedAt: Date.now(),
        userId,
      })
    }
  }, [db])

  return {
    conversations: conversations ?? [],
    loading: conversations === undefined,
    create,
    rename,
    remove,
  }
}
