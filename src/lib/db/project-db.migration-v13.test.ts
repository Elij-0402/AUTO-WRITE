/**
 * Dexie v13 migration test (CEO-6B, REGRESSION rule).
 *
 * Ensures v12 data — including the abTestMetrics table that predates v13 —
 * survives the upgrade to v13 intact, and that the new contradictions table
 * exists empty post-upgrade.
 *
 * fake-indexeddb is loaded globally via src/test/setup.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Dexie from 'dexie'
import { createProjectDB, __resetProjectDBCache } from './project-db'

const PROJECT_ID = 'migration-test-project'

/** Open the DB at v12 schema exactly as v12 shipped (abTestMetrics present, contradictions absent). */
async function openV12(): Promise<Dexie> {
  const db = new Dexie(`inkforge-project-${PROJECT_ID}`)
  db.version(1).stores({
    projects: 'id, updatedAt, deletedAt',
    chapters: 'id, projectId, order, deletedAt',
  })
  db.version(12).stores({
    projects: 'id, updatedAt, deletedAt',
    chapters: 'id, projectId, order, deletedAt',
    layoutSettings: 'id',
    worldEntries: 'id, projectId, type, name, deletedAt',
    relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
    aiConfig: 'id',
    messages: 'id, projectId, conversationId, role, timestamp',
    consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
    revisions: 'id, projectId, chapterId, createdAt',
    embeddings: 'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
    analyses: 'id, kind, invalidationKey, createdAt',
    conversations: 'id, projectId, updatedAt',
    aiUsage: 'id, projectId, conversationId, createdAt, model',
    abTestMetrics: 'id, projectId, conversationId, createdAt, [projectId+createdAt]',
  })
  await db.open()
  return db
}

describe('project-db v13 migration', () => {
  beforeEach(() => {
    __resetProjectDBCache()
    indexedDB.deleteDatabase(`inkforge-project-${PROJECT_ID}`)
  })

  it('upgrades v12 → v13 without data loss', async () => {
    const v12 = await openV12()

    // Seed data in several tables
    await v12.table('aiUsage').add({
      id: 'usage-1',
      projectId: PROJECT_ID,
      conversationId: null,
      kind: 'chat',
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      latencyMs: 1200,
      createdAt: Date.now(),
    })
    await v12.table('abTestMetrics').add({
      id: 'metric-1',
      projectId: PROJECT_ID,
      conversationId: null,
      messageId: 'msg-1',
      experimentGroup: { citations: true, extendedCacheTtl: false, thinking: false },
      latencyMs: 1200,
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      citationCount: 2,
      createdAt: Date.now(),
    })
    await v12.table('worldEntries').add({
      id: 'we-1',
      projectId: PROJECT_ID,
      type: 'character',
      name: '小明',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    v12.close()

    // Reopen through the production factory — Dexie auto-upgrades to v13.
    const v13 = createProjectDB(PROJECT_ID)
    await v13.open()

    // Pre-existing rows intact.
    const usage = await v13.aiUsage.toArray()
    expect(usage).toHaveLength(1)
    expect(usage[0].id).toBe('usage-1')

    const metrics = await v13.abTestMetrics.toArray()
    expect(metrics).toHaveLength(1)
    expect(metrics[0].id).toBe('metric-1')

    const entries = await v13.worldEntries.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe('小明')
    // New optional v13 column defaults to undefined on unmigrated rows.
    expect(entries[0].inferredVoice).toBeUndefined()

    // New contradictions table is accessible and empty.
    const contradictions = await v13.contradictions.toArray()
    expect(contradictions).toHaveLength(0)
  })

  it('writes and reads contradictions with the compound [projectId+entryName] index', async () => {
    const db = createProjectDB(PROJECT_ID)
    await db.open()

    const now = Date.now()
    await db.contradictions.bulkAdd([
      {
        id: 'c-1',
        projectId: PROJECT_ID,
        conversationId: null,
        messageId: 'm-1',
        entryName: '小明',
        entryType: 'character',
        description: '第 50 章称他剑客，但第 10 章是刀客。',
        exempted: false,
        createdAt: now,
      },
      {
        id: 'c-2',
        projectId: PROJECT_ID,
        conversationId: null,
        messageId: 'm-2',
        entryName: '小明',
        entryType: 'character',
        description: '称号与性格描写不符。',
        exempted: true,
        createdAt: now + 1,
      },
      {
        id: 'c-3',
        projectId: PROJECT_ID,
        conversationId: null,
        messageId: 'm-3',
        entryName: '师父',
        entryType: 'character',
        description: '师父的年龄与第 3 章设定冲突。',
        exempted: false,
        createdAt: now + 2,
      },
    ])

    const smallMing = await db.contradictions
      .where('[projectId+entryName]')
      .equals([PROJECT_ID, '小明'])
      .toArray()
    expect(smallMing).toHaveLength(2)
    expect(smallMing.map(c => c.id).sort()).toEqual(['c-1', 'c-2'])
  })

  it('aiUsage rows without draft fields read back with undefined — no default pollution', async () => {
    const db = createProjectDB(PROJECT_ID)
    await db.open()

    await db.aiUsage.add({
      id: 'plain-1',
      projectId: PROJECT_ID,
      conversationId: null,
      kind: 'chat',
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      latencyMs: 1200,
      createdAt: Date.now(),
    })

    const [row] = await db.aiUsage.toArray()
    expect(row.draftOffered).toBeUndefined()
    expect(row.draftAccepted).toBeUndefined()
    expect(row.draftEditedPct).toBeUndefined()
    expect(row.draftRejectedReason).toBeUndefined()
    expect(row.editedPctDeadline).toBeUndefined()
  })

  it('supports aiUsage.kind = "citation_click" without optional token fields', async () => {
    const db = createProjectDB(PROJECT_ID)
    await db.open()

    await db.aiUsage.add({
      id: 'click-1',
      projectId: PROJECT_ID,
      conversationId: 'conv-1',
      kind: 'citation_click',
      provider: 'anthropic',
      model: '',
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      latencyMs: 0,
      createdAt: Date.now(),
    })

    const [row] = await db.aiUsage.toArray()
    expect(row.kind).toBe('citation_click')
  })
})
