import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { __resetProjectDBCache, createProjectDB, type InkForgeProjectDB } from './project-db'
import { addWorldEntry, updateWorldEntryFields } from './world-entry-queries'
import {
  createStoryTracker,
  getUnresolvedStoryTrackerCounts,
  listStoryTrackers,
  listStoryTrackersByKind,
  resolveStoryTracker,
} from './story-tracker-queries'

describe('story-tracker-queries', () => {
  let db: InkForgeProjectDB
  let projectId: string
  let testCounter = 0

  beforeEach(async () => {
    testCounter += 1
    projectId = `phase2-story-bible-${testCounter}`
    __resetProjectDBCache()
    await Dexie.delete(`inkforge-project-${projectId}`)
    db = createProjectDB(projectId)
  })

  afterEach(async () => {
    db.close()
    __resetProjectDBCache()
    await Dexie.delete(`inkforge-project-${projectId}`)
  })

  it('creates and groups long-term trackers', async () => {
    const heroId = await addWorldEntry(db, projectId, 'character', '沈夜')
    const eventId = await addWorldEntry(db, projectId, 'event', '朱雀门夜袭')

    await updateWorldEntryFields(db, eventId, {
      timePoint: '第一卷末',
      timeOrder: 120,
      eventDescription: '主角第一次公开暴露身份',
    })

    await createStoryTracker(projectId, {
      kind: 'open_promise',
      title: '沈夜必须查清夜袭幕后主使',
      summary: '第一卷立下的核心承诺，第二卷前不能丢',
      subjectEntryIds: [heroId],
      relatedEntryIds: [eventId],
      linkedTimelineEntryId: eventId,
    })

    await createStoryTracker(projectId, {
      kind: 'consequence',
      title: '夜袭后各方势力重新站队',
      summary: '确认事件后续影响不会被忘记',
      subjectEntryIds: [],
      relatedEntryIds: [eventId],
    })

    const promises = await listStoryTrackersByKind(projectId, 'open_promise')
    const consequences = await listStoryTrackersByKind(projectId, 'consequence')

    expect(promises).toHaveLength(1)
    expect(promises[0].title).toContain('幕后主使')
    expect(promises[0].status).toBe('active')
    expect(promises[0].linkedTimelineEntryId).toBe(eventId)

    expect(consequences).toHaveLength(1)
    expect(consequences[0].kind).toBe('consequence')
  })

  it('resolves trackers without removing them from history', async () => {
    const tracker = await createStoryTracker(projectId, {
      kind: 'foreshadow',
      title: '玉玺裂痕的伏笔',
      summary: '第三章出现，后续会引出正统问题',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })

    await resolveStoryTracker(projectId, tracker.id)

    const rows = await listStoryTrackersByKind(projectId, 'foreshadow')

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(tracker.id)
    expect(rows[0].status).toBe('resolved')
    expect(rows[0].resolvedAt).toBeTypeOf('number')
    expect(rows[0].deletedAt).toBeNull()
  })

  it('filters soft-deleted trackers of the same kind', async () => {
    const active = await createStoryTracker(projectId, {
      kind: 'open_promise',
      title: '保留的承诺',
      summary: '仍然有效',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const deleted = await createStoryTracker(projectId, {
      kind: 'open_promise',
      title: '已软删除的承诺',
      summary: '不应继续出现在列表里',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })

    await db.storyTrackers.update(deleted.id, { deletedAt: Date.now() })

    const rows = await listStoryTrackersByKind(projectId, 'open_promise')

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(active.id)
    expect(rows.some(row => row.id === deleted.id)).toBe(false)
  })

  it('summarizes unresolved tracker and state counts from active rows only', async () => {
    const activePromise = await createStoryTracker(projectId, {
      kind: 'open_promise',
      title: '仍待兑现的承诺',
      summary: '应计入未解决追踪',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const activeForeshadow = await createStoryTracker(projectId, {
      kind: 'foreshadow',
      title: '仍未回收的伏笔',
      summary: '应计入未解决追踪',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const activeCharacterState = await createStoryTracker(projectId, {
      kind: 'character_state',
      title: '主角伤势',
      summary: '应计入状态挂账',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const activeWorldState = await createStoryTracker(projectId, {
      kind: 'world_state',
      title: '都城戒严',
      summary: '应计入状态挂账',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const resolvedConsequence = await createStoryTracker(projectId, {
      kind: 'consequence',
      title: '已经收束的后果',
      summary: '不应再计入',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const archivedRelationshipState = await createStoryTracker(projectId, {
      kind: 'relationship_state',
      title: '已归档关系状态',
      summary: '不应再计入',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const deletedPromise = await createStoryTracker(projectId, {
      kind: 'open_promise',
      title: '已删除承诺',
      summary: '不应再计入',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })

    await resolveStoryTracker(projectId, resolvedConsequence.id)
    await db.storyTrackers.update(archivedRelationshipState.id, { status: 'archived' })
    await db.storyTrackers.update(deletedPromise.id, { deletedAt: Date.now() })

    const counts = await getUnresolvedStoryTrackerCounts(projectId)

    expect(activePromise.status).toBe('active')
    expect(activeForeshadow.status).toBe('active')
    expect(activeCharacterState.status).toBe('active')
    expect(activeWorldState.status).toBe('active')
    expect(counts).toEqual({
      unresolvedTrackers: 2,
      unresolvedStates: 2,
    })
  })

  it('lists all non-deleted trackers with newest updates first', async () => {
    const older = await createStoryTracker(projectId, {
      kind: 'open_promise',
      title: '先立下的承诺',
      summary: '应该排在后面',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const newer = await createStoryTracker(projectId, {
      kind: 'world_state',
      title: '后出现的状态',
      summary: '应该排在前面',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })
    const deleted = await createStoryTracker(projectId, {
      kind: 'foreshadow',
      title: '被删除的伏笔',
      summary: '不应该出现在总表里',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })

    await resolveStoryTracker(projectId, newer.id)
    await db.storyTrackers.update(deleted.id, { deletedAt: Date.now() })

    const rows = await listStoryTrackers(projectId)

    expect(rows.map(row => row.id)).toEqual([newer.id, older.id])
    expect(rows.some(row => row.id === deleted.id)).toBe(false)
  })
})
