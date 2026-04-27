import { describe, expect, it } from 'vitest'
import { buildPlanningDigestBlock } from './prompts'
import type { PlanningSnapshot } from '../types'

const planningSnapshot: PlanningSnapshot = {
  ideaNotes: [],
  storyArcs: [
    {
      id: 'arc-1',
      projectId: 'project-1',
      title: '第一卷：雨夜入局',
      premise: '主角被迫卷入朝堂追杀。',
      objective: '活下来并找出幕后主使。',
      conflict: '押解线和朝堂线同时逼近。',
      payoff: '确认真正的敌人来自宫中。',
      order: 1,
      status: 'active',
      sourceIdeaIds: [],
      relatedEntryIds: [],
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
    },
  ],
  chapterPlans: [
    {
      id: 'chapter-1',
      projectId: 'project-1',
      arcId: 'arc-1',
      linkedChapterId: 'linked-chapter-1',
      title: '第1章 雨夜押解',
      summary: '押解途中第一次遇袭。',
      chapterGoal: '活着进城。',
      conflict: '路线暴露。',
      turn: '发现内应。',
      reveal: '押解令被调包。',
      order: 1,
      status: 'planned',
      targetWordCount: 3200,
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
    },
    {
      id: 'chapter-2',
      projectId: 'project-1',
      arcId: 'arc-1',
      linkedChapterId: null,
      title: '第2章 金殿请罪',
      summary: '主角被迫入殿陈情。',
      chapterGoal: '拖住追责。',
      conflict: '旧案被当庭翻出。',
      turn: '',
      reveal: '',
      order: 2,
      status: 'not_started',
      targetWordCount: null,
      createdAt: 2,
      updatedAt: 2,
      deletedAt: null,
    },
  ],
  sceneCards: [
    {
      id: 'scene-1',
      projectId: 'project-1',
      chapterPlanId: 'chapter-2',
      title: '金殿问罪',
      viewpoint: '',
      location: '',
      objective: '',
      obstacle: '',
      outcome: '',
      continuityNotes: '',
      order: 1,
      status: 'planned',
      linkedEntryIds: [],
      createdAt: 1,
      updatedAt: 1,
      deletedAt: null,
    },
  ],
}

describe('buildPlanningDigestBlock', () => {
  it('summarizes current arcs, chapter plans, and pending decomposition', () => {
    const block = buildPlanningDigestBlock(planningSnapshot)

    expect(block).toContain('【当前规划】')
    expect(block).toContain('【当前卷纲】')
    expect(block).toContain('第一卷：雨夜入局｜活跃')
    expect(block).toContain('【当前章纲】')
    expect(block).toContain('第1章 雨夜押解｜已绑定章节｜已拆 0/0 场景')
    expect(block).toContain('第2章 金殿请罪｜未绑定章节｜已拆 1/1 场景')
    expect(block).toContain('【待推进】')
    expect(block).toContain('待写章节：1')
  })

  it('returns empty string when no planning data exists', () => {
    const block = buildPlanningDigestBlock({
      ideaNotes: [],
      storyArcs: [],
      chapterPlans: [],
      sceneCards: [],
    })

    expect(block).toBe('')
  })
})
