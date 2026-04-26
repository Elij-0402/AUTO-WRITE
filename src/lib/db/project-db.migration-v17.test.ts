import { describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { InkForgeProjectDB } from './project-db'

describe('project db v17 migration', () => {
  it('upgrades a v16 database with empty charter tables', async () => {
    const dbName = 'inkforge-project-migration-v17'
    await Dexie.delete(dbName)

    const legacy = new Dexie(dbName)
    legacy.version(16).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      contradictions: 'id, projectId, messageId, entryName, exempted, createdAt, [projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
    })
    await legacy.open()
    await legacy.close()

    const upgraded = new InkForgeProjectDB('migration-v17')
    ;(upgraded as unknown as { name: string }).name = dbName
    await upgraded.open()

    expect(upgraded.tables.some(table => table.name === 'projectCharter')).toBe(true)
    expect(upgraded.tables.some(table => table.name === 'preferenceMemories')).toBe(true)

    await upgraded.close()
    await Dexie.delete(dbName)
  })
})
