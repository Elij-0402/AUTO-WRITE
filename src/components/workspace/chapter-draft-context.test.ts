import { describe, expect, it } from 'vitest'
import {
  buildPlanningPrefillFingerprint,
  buildDraftOutlineFromPlanning,
  buildDraftGenerationSourceSummary,
  normalizeDraftForInsertion,
} from './chapter-draft-context'
import type { ChapterPlan, SceneCard } from '@/lib/types'

const chapterPlan: ChapterPlan = {
  id: 'chapter-plan-1',
  projectId: 'project-1',
  arcId: 'arc-1',
  linkedChapterId: 'chapter-1',
  title: '第1章 雨夜押解',
  summary: '押解途中第一次遇袭，主角意识到有人灭口。',
  chapterGoal: '活着进城，并确认是谁泄露了路线。',
  conflict: '押解队内部有人提前通风报信。',
  turn: '主角在尸体腰牌上发现熟悉纹样。',
  reveal: '押解令被人调包。',
  order: 1,
  status: 'planned',
  targetWordCount: 3200,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
}

const sceneCards: SceneCard[] = [
  {
    id: 'scene-1',
    projectId: 'project-1',
    chapterPlanId: 'chapter-plan-1',
    title: '城门前换车',
    viewpoint: '沈夜',
    location: '朱雀门外',
    objective: '确认押解路线被改动',
    obstacle: '押解官催促启程',
    outcome: '发现前方有人设伏',
    continuityNotes: '保持右臂旧伤影响动作',
    order: 1,
    status: 'planned',
    linkedEntryIds: [],
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  },
  {
    id: 'scene-2',
    projectId: 'project-1',
    chapterPlanId: 'chapter-plan-1',
    title: '雨巷伏杀',
    viewpoint: '沈夜',
    location: '南城雨巷',
    objective: '护住关键证人',
    obstacle: '刺客提前封死退路',
    outcome: '从尸体上找到熟悉纹样',
    continuityNotes: '雨夜环境压低能见度',
    order: 2,
    status: 'planned',
    linkedEntryIds: [],
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  },
]

describe('buildDraftOutlineFromPlanning', () => {
  it('formats chapter plan and scene cards into a reusable draft outline', () => {
    const outline = buildDraftOutlineFromPlanning(chapterPlan, sceneCards)

    expect(outline).toContain('【章节定位】')
    expect(outline).toContain('章节摘要：押解途中第一次遇袭')
    expect(outline).toContain('章节目标：活着进城，并确认是谁泄露了路线。')
    expect(outline).toContain('【场景拆解】')
    expect(outline).toContain('1. 城门前换车')
    expect(outline).toContain('视角：沈夜')
    expect(outline).toContain('阻碍：刺客提前封死退路')
    expect(outline).toContain('连续性提醒：雨夜环境压低能见度')
  })

  it('falls back to chapter summary only when there are no scene cards', () => {
    const outline = buildDraftOutlineFromPlanning(chapterPlan, [])

    expect(outline).toContain('【章节定位】')
    expect(outline).not.toContain('【场景拆解】')
    expect(outline).toContain('揭示：押解令被人调包。')
  })

  it('builds a concise source summary for draft generation', () => {
    const summary = buildDraftGenerationSourceSummary(chapterPlan, sceneCards)

    expect(summary).toContain('来源章纲：第1章 雨夜押解')
    expect(summary).toContain('场景拆解：2 张场景卡')
    expect(summary).toContain('目标字数：3200 字')
  })

  it('marks missing scene coverage explicitly in the source summary', () => {
    const summary = buildDraftGenerationSourceSummary(chapterPlan, [])

    expect(summary).toContain('场景拆解：尚未补齐')
  })

  it('normalizes draft text before insertion and keeps counting deterministic', () => {
    const normalized = normalizeDraftForInsertion('\n\n# 标题\n\n第一段。\n\n第二段。\n\n')

    expect(normalized).toBe('# 标题\n\n第一段。\n\n第二段。')
  })

  it('builds a fingerprint that changes with scene ordering and updates', () => {
    const initial = buildPlanningPrefillFingerprint(chapterPlan, sceneCards)
    const reordered = buildPlanningPrefillFingerprint(chapterPlan, [
      { ...sceneCards[1], order: 1, updatedAt: 20 },
      { ...sceneCards[0], order: 2, updatedAt: 21 },
    ])

    expect(initial).not.toBe(reordered)
  })
})
