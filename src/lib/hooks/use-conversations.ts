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
