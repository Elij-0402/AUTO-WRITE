import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { __resetProjectDBCache, InkForgeProjectDB } from './project-db'

describe('project db v18 migration', () => {
  it('upgrades a v17 database with storyTrackers table', async () => {
    const projectId = 'migration-v18'
    const dbName = `inkforge-project-${projectId}`
    __resetProjectDBCache()
    await Dexie.delete(dbName)

    const legacy = new Dexie(dbName)
    legacy.version(17).stores({
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
    })
    await legacy.open()
    await legacy.table('worldEntries').add({
      id: 'legacy-entry',
      projectId,
      type: 'character',
      name: '迁移前角色',
      tags: [],
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      updatedAt: new Date('2026-04-02T00:00:00.000Z'),
      deletedAt: null,
    })
    legacy.close()

    const upgraded = new InkForgeProjectDB(projectId)
    await upgraded.open()

    expect(upgraded.tables.some(table => table.name === 'storyTrackers')).toBe(true)
    expect(upgraded.storyTrackers).toBeDefined()

    const legacyEntry = await upgraded.worldEntries.get('legacy-entry')
    expect(legacyEntry).toBeDefined()
    expect(legacyEntry?.name).toBe('迁移前角色')

    const trackerRow = {
      id: 'tracker-1',
      projectId,
      kind: 'open_promise' as const,
      title: '升级后可写入追踪项',
      summary: '验证新表和索引可用',
      subjectEntryIds: ['legacy-entry'],
      relatedEntryIds: [],
      status: 'active' as const,
      createdAt: 101,
      updatedAt: 102,
      deletedAt: null,
    }
    await upgraded.storyTrackers.add(trackerRow)

    const rows = await upgraded.storyTrackers
      .where('[projectId+kind]')
      .equals([projectId, 'open_promise'])
      .toArray()

    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe('升级后可写入追踪项')

    upgraded.close()
    await Dexie.delete(dbName)
  })
})
