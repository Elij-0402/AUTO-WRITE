import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { __resetProjectDBCache, createProjectDB, type InkForgeProjectDB } from './project-db'
import {
  createChapterPlan,
  createIdeaNote,
  createSceneCard,
  createStoryArc,
  deleteSceneCard,
  listPlanningSnapshot,
  reorderSceneCards,
  updateSceneCard,
} from './planning-queries'

describe('planning-queries', () => {
  let db: InkForgeProjectDB
  let projectId: string
  let testCounter = 0

  beforeEach(async () => {
    testCounter += 1
    projectId = `phase3-planning-${testCounter}`
    __resetProjectDBCache()
    await Dexie.delete(`inkforge-project-${projectId}`)
    db = createProjectDB(projectId)
  })

  afterEach(async () => {
    db.close()
    __resetProjectDBCache()
    await Dexie.delete(`inkforge-project-${projectId}`)
  })

  it('creates a top-down planning chain', async () => {
    const idea = await createIdeaNote(db, projectId, {
      title: '皇城夜雨',
      premise: '少女替父顶罪后卷入旧朝复辟',
      moodKeywords: ['压抑', '宫廷', '宿命'],
    })
    const arc = await createStoryArc(db, projectId, {
      title: '第一卷：雨夜入局',
      premise: '主角被迫进入权力旋涡',
      objective: '活下来并找出真正的操盘者',
      sourceIdeaIds: [idea.id],
    })
    const chapterPlan = await createChapterPlan(db, projectId, {
      arcId: arc.id,
      title: '第1章 雨夜押解',
      summary: '押解途中第一次看见追杀者',
      order: 1,
    })
    await createSceneCard(db, projectId, {
      chapterPlanId: chapterPlan.id,
      title: '城门前换车',
      objective: '确认押解路线被人动过手脚',
      order: 1,
    })

    const snapshot = await listPlanningSnapshot(db, projectId)

    expect(snapshot.ideaNotes).toHaveLength(1)
    expect(snapshot.storyArcs).toHaveLength(1)
    expect(snapshot.chapterPlans).toHaveLength(1)
    expect(snapshot.sceneCards).toHaveLength(1)
    expect(snapshot.storyArcs[0].sourceIdeaIds).toEqual([idea.id])
    expect(snapshot.chapterPlans[0].arcId).toBe(arc.id)
    expect(snapshot.sceneCards[0].chapterPlanId).toBe(chapterPlan.id)
  })

  it('soft deletes planning rows without breaking sibling ordering', async () => {
    const first = await createStoryArc(db, projectId, { title: '卷一', order: 1 })
    await createStoryArc(db, projectId, { title: '卷二', order: 2 })

    await db.storyArcs.update(first.id, { deletedAt: Date.now() })

    const snapshot = await listPlanningSnapshot(db, projectId)

    expect(snapshot.storyArcs).toHaveLength(1)
    expect(snapshot.storyArcs[0].title).toBe('卷二')
  })

  it('updates, reorders, and deletes scene cards within a chapter plan', async () => {
    const chapterPlan = await createChapterPlan(db, projectId, {
      title: '第1章 雨夜押解',
      order: 1,
    })
    const first = await createSceneCard(db, projectId, {
      chapterPlanId: chapterPlan.id,
      title: '城门前换车',
      order: 1,
    })
    const second = await createSceneCard(db, projectId, {
      chapterPlanId: chapterPlan.id,
      title: '雨巷伏杀',
      order: 2,
    })
    const third = await createSceneCard(db, projectId, {
      chapterPlanId: chapterPlan.id,
      title: '金殿请罪',
      order: 3,
    })

    await updateSceneCard(db, second.id, {
      viewpoint: '沈夜',
      status: 'drafting',
    })
    await reorderSceneCards(db, projectId, chapterPlan.id, [third.id, first.id, second.id])
    await deleteSceneCard(db, first.id)

    const snapshot = await listPlanningSnapshot(db, projectId)

    expect(snapshot.sceneCards).toHaveLength(2)
    expect(snapshot.sceneCards.map((item) => item.id)).toEqual([third.id, second.id])
    expect(snapshot.sceneCards.map((item) => item.order)).toEqual([1, 2])
    expect(snapshot.sceneCards[1].viewpoint).toBe('沈夜')
    expect(snapshot.sceneCards[1].status).toBe('drafting')
  })
})
