import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { __resetProjectDBCache, InkForgeProjectDB } from './project-db'

describe('project db v19 migration', () => {
  it('upgrades a v18 database with planning tables', async () => {
    const projectId = 'migration-v19'
    const dbName = `inkforge-project-${projectId}`
    __resetProjectDBCache()
    await Dexie.delete(dbName)

    const legacy = new Dexie(dbName)
    legacy.version(18).stores({
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
      contradictions:
        'id, projectId, messageId, entryName, exempted, createdAt, ' +
        '[projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
      projectCharter: 'id, projectId, updatedAt',
      preferenceMemories: 'id, projectId, messageId, createdAt, [projectId+createdAt]',
      storyTrackers:
        'id, projectId, kind, status, createdAt, updatedAt, ' +
        '[projectId+kind], [projectId+status]',
    })
    await legacy.open()
    legacy.close()

    const upgraded = new InkForgeProjectDB(projectId)
    await upgraded.open()

    expect(upgraded.tables.some(table => table.name === 'ideaNotes')).toBe(true)
    expect(upgraded.tables.some(table => table.name === 'storyArcs')).toBe(true)
    expect(upgraded.tables.some(table => table.name === 'chapterPlans')).toBe(true)
    expect(upgraded.tables.some(table => table.name === 'sceneCards')).toBe(true)

    upgraded.close()
    await Dexie.delete(dbName)
  })
})
