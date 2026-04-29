import { describe, expect, it } from 'vitest'
import {
  buildPlanningPrompt,
  parsePlanningActionResult,
  type PlanningAction,
} from './planning-prompts'
import type {
  ChapterPlan,
  IdeaNote,
  PlanningSnapshot,
  ProjectCharter,
  StoryArc,
  StoryTracker,
  WorldEntry,
} from '../types'

const charter: ProjectCharter = {
  id: 'charter-1',
  projectId: 'project-1',
  oneLinePremise: '被迫顶罪的少女卷入旧朝暗流',
  storyPromise: '宫廷权谋、慢热关系、连续反转',
  themes: ['权力', '忠诚'],
  tone: '冷峻克制',
  targetReader: '偏好权谋线的中文网文读者',
  styleDos: ['冲突递进', '避免旁白说教'],
  tabooList: ['现代吐槽腔'],
  positiveReferences: ['压抑感'],
  negativeReferences: ['无厘头轻喜'],
  aiUnderstanding: '核心是少女在权力漩涡中活下来',
  createdAt: 1,
  updatedAt: 1,
}

const worldEntries: WorldEntry[] = [
  {
    id: 'faction-1',
    projectId: 'project-1',
    type: 'faction',
    name: '北府司',
    factionGoal: '压住京中兵权',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'event-1',
    projectId: 'project-1',
    type: 'event',
    name: '朱雀门夜袭',
    timePoint: '第一卷末',
    eventDescription: '主角第一次公开暴露身份',
    timeOrder: 120,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
]

const storyTrackers: StoryTracker[] = [
  {
    id: 'tracker-1',
    projectId: 'project-1',
    kind: 'open_promise',
    title: '查清夜袭幕后主使',
    summary: '不能在第二卷前遗忘',
    subjectEntryIds: [],
    relatedEntryIds: ['event-1'],
    status: 'active',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
  },
]

const idea: IdeaNote = {
  id: 'idea-1',
  projectId: 'project-1',
  title: '雨夜宫变',
  premise: '少女替父顶罪，押送途中撞进旧案',
  moodKeywords: ['压抑', '宿命'],
  sourceType: 'manual',
  status: 'seed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
}

const arc: StoryArc = {
  id: 'arc-1',
  projectId: 'project-1',
  title: '第一卷：雨夜入局',
  premise: '主角被迫进入权力旋涡',
  objective: '活下来并看清谁在布局',
  conflict: '朝堂追杀与身份暴露',
  payoff: '找到第一层真相',
  order: 1,
  status: 'draft',
  sourceIdeaIds: ['idea-1'],
  relatedEntryIds: [],
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
}

const chapterPlan: ChapterPlan = {
  id: 'chapter-1',
  projectId: 'project-1',
  arcId: 'arc-1',
  linkedChapterId: null,
  title: '第1章 雨夜押解',
  summary: '押解途中察觉路线被人篡改',
  chapterGoal: '先活着抵达京城',
  conflict: '押解官催促启程',
  turn: '发现有人提前设伏',
  reveal: '押解令被调包',
  order: 1,
  status: 'planned',
  targetWordCount: 3200,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
}

const planningSnapshot: PlanningSnapshot = {
  ideaNotes: [idea],
  storyArcs: [arc],
  chapterPlans: [chapterPlan],
  sceneCards: [],
}

function buildPrompt(action: PlanningAction): string {
  return buildPlanningPrompt({
    action,
    charter,
    worldEntries,
    storyTrackers,
    planningSnapshot,
    focusIdea: action === 'generate_arc' ? idea : undefined,
    focusArc: action === 'generate_chapter_plan' ? arc : undefined,
    focusChapterPlan: action === 'suggest_next_step' ? chapterPlan : undefined,
    currentProgress: {
      totalChapters: 3,
      linkedChapterPlans: 1,
      unlinkedChapterPlans: 0,
    },
  })
}

describe('buildPlanningPrompt', () => {
  it.each([
    'generate_arc',
    'generate_chapter_plan',
    'suggest_next_step',
  ] satisfies PlanningAction[])('builds %s prompt with charter, world, planning and result contract', (action) => {
    const prompt = buildPrompt(action)

    expect(prompt).toContain('【作品宪章】')
    expect(prompt).toContain('【故事圣经】')
    expect(prompt).toContain('【当前规划进度】')
    expect(prompt).toContain('【输出格式】')
    expect(prompt).toContain('"action"')
    expect(prompt).toContain(action)
  })

  it('changes the focus section by action', () => {
    expect(buildPrompt('generate_arc')).toContain('【当前灵感】')
    expect(buildPrompt('generate_chapter_plan')).toContain('【当前卷纲】')
    expect(buildPrompt('suggest_next_step')).toContain('【当前任务】')
  })
})

describe('parsePlanningActionResult', () => {
  it('parses a valid marked JSON result', () => {
    const result = parsePlanningActionResult(`
这里是解释文本
[PLAN_JSON_START]
{"action":"generate_chapter_plan","data":{"items":[{"title":"第1章 雨夜押解","summary":"押解途中第一次遇袭","chapterGoal":"活着进城","conflict":"路线暴露","turn":"发现内应","reveal":"押解令被调包","targetWordCount":3200}]}}
[PLAN_JSON_END]
`)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.action).toBe('generate_chapter_plan')
      expect(result.value.data.items).toHaveLength(1)
      expect(result.value.data.items[0].title).toBe('第1章 雨夜押解')
    }
  })

  it('rejects malformed results', () => {
    const result = parsePlanningActionResult('没有 JSON 结果')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('JSON')
    }
  })
})
