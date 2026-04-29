import type {
  ChapterPlan,
  IdeaNote,
  PlanningSnapshot,
  ProjectCharter,
  StoryArc,
  StoryTracker,
  WorldEntry,
} from '../types'
import { buildPlanningDigestBlock, buildProjectCharterBlock, buildWorldBibleBlock } from './prompts'

export type PlanningAction =
  | 'generate_arc'
  | 'generate_chapter_plan'
  | 'generate_scene_cards'
  | 'suggest_next_step'

export interface PlanningPromptProgress {
  totalChapters: number
  linkedChapterPlans: number
  unlinkedChapterPlans: number
}

export interface BuildPlanningPromptInput {
  action: PlanningAction
  charter?: ProjectCharter | null
  worldEntries: WorldEntry[]
  storyTrackers?: StoryTracker[]
  planningSnapshot: PlanningSnapshot
  focusIdea?: IdeaNote
  focusArc?: StoryArc
  focusChapterPlan?: ChapterPlan
  currentProgress: PlanningPromptProgress
}

export interface PlanningArcDraft {
  title: string
  premise: string
  objective: string
  conflict: string
  payoff: string
}

export interface PlanningChapterPlanDraft {
  title: string
  summary: string
  chapterGoal: string
  conflict: string
  turn: string
  reveal: string
  targetWordCount?: number | null
}

export interface PlanningNextStepDraft {
  summary: string
  reason: string
  targetKind?: 'idea' | 'arc' | 'chapter'
  targetTitle?: string
}

export interface PlanningSceneCardDraft {
  title: string
  viewpoint: string
  location: string
  objective: string
  obstacle: string
  outcome: string
  continuityNotes: string
  status?: 'planned' | 'drafting' | 'done'
}

export type ParsedPlanningActionResult =
  | { action: 'generate_arc'; data: { item: PlanningArcDraft } }
  | { action: 'generate_chapter_plan'; data: { items: PlanningChapterPlanDraft[] } }
  | { action: 'generate_scene_cards'; data: { items: PlanningSceneCardDraft[] } }
  | { action: 'suggest_next_step'; data: { item: PlanningNextStepDraft } }

export function buildPlanningPrompt(input: BuildPlanningPromptInput): string {
  const blocks = [
    buildProjectCharterBlock(input.charter),
    convertWorldBibleToStoryBible(buildWorldBibleBlock(input.worldEntries, input.storyTrackers ?? [])),
    buildPlanningDigestBlock(input.planningSnapshot),
    buildCurrentProgressBlock(input.currentProgress),
    buildFocusBlock(input),
    buildActionInstruction(input.action),
    buildOutputContract(input.action),
  ].filter(Boolean)

  return blocks.join('\n\n')
}

export function parsePlanningActionResult(
  content: string
): { ok: true; value: ParsedPlanningActionResult } | { ok: false; error: string } {
  const match = content.match(/\[PLAN_JSON_START\]\s*([\s\S]*?)\s*\[PLAN_JSON_END\]/)
  if (!match) {
    return { ok: false, error: '未找到规划 JSON 结果块' }
  }

  try {
    const parsed = JSON.parse(match[1]) as ParsedPlanningActionResult
    const validation = validatePlanningActionResult(parsed)
    if (validation) {
      return { ok: false, error: validation }
    }
    return { ok: true, value: parsed }
  } catch (error) {
    return {
      ok: false,
      error: `规划 JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

function buildCurrentProgressBlock(progress: PlanningPromptProgress): string {
  return [
    '【当前规划进度】',
    `总章节数：${progress.totalChapters}`,
    `已绑定章纲：${progress.linkedChapterPlans}`,
    `未绑定章纲：${progress.unlinkedChapterPlans}`,
  ].join('\n')
}

function buildFocusBlock(input: BuildPlanningPromptInput): string {
  if (input.action === 'generate_arc' && input.focusIdea) {
    return [
      '【当前灵感】',
      `标题：${input.focusIdea.title}`,
      `设想：${input.focusIdea.premise || '(待补充)'}`,
      `情绪关键词：${input.focusIdea.moodKeywords.join('、') || '(待补充)'}`,
    ].join('\n')
  }

  if (input.action === 'generate_chapter_plan' && input.focusArc) {
    return [
      '【当前卷纲】',
      `标题：${input.focusArc.title}`,
      `前提：${input.focusArc.premise || '(待补充)'}`,
      `目标：${input.focusArc.objective || '(待补充)'}`,
      `冲突：${input.focusArc.conflict || '(待补充)'}`,
      `兑现：${input.focusArc.payoff || '(待补充)'}`,
    ].join('\n')
  }

  if (input.action === 'generate_scene_cards' && input.focusChapterPlan) {
    return [
      '【当前章纲】',
      `标题：${input.focusChapterPlan.title}`,
      `摘要：${input.focusChapterPlan.summary || '(待补充)'}`,
      `目标：${input.focusChapterPlan.chapterGoal || '(待补充)'}`,
      `冲突：${input.focusChapterPlan.conflict || '(待补充)'}`,
      `转折：${input.focusChapterPlan.turn || '(待补充)'}`,
      `揭示：${input.focusChapterPlan.reveal || '(待补充)'}`,
    ].join('\n')
  }

  return [
    '【当前任务】',
    '请基于现有作品宪章、故事圣经和规划进度，给出最值得推进的下一步。',
  ].join('\n')
}

function buildActionInstruction(action: PlanningAction): string {
  switch (action) {
    case 'generate_arc':
      return [
        '【任务要求】',
        '把当前灵感压成 1 条可执行卷纲。',
        '输出必须体现阶段目标、核心冲突和阶段兑现，不要泛泛而谈。',
      ].join('\n')
    case 'generate_chapter_plan':
      return [
        '【任务要求】',
        '基于当前卷纲拆出 3-5 条连续章纲。',
        '每条章纲都要能看出推进作用，避免重复功能章节。',
      ].join('\n')
    case 'generate_scene_cards':
      return [
        '【任务要求】',
        '基于当前章纲拆出 3-6 张连续场景卡。',
        '每张场景卡都要明确视角、地点、目标、阻碍、结果与连续性提醒，避免空泛描述。',
      ].join('\n')
    case 'suggest_next_step':
      return [
        '【任务要求】',
        '明确指出当前最该推进的一步，并说明原因。',
        '优先选择最能减少后续模糊度的动作。',
      ].join('\n')
  }
}

function buildOutputContract(action: PlanningAction): string {
  const schema = getActionSchema(action)
  return [
    '【输出格式】',
    '先用 1-3 句简要说明，再严格输出以下标记包裹的 JSON：',
    '[PLAN_JSON_START]',
    JSON.stringify(schema, null, 2),
    '[PLAN_JSON_END]',
    '不要输出额外的 JSON 块，不要省略 action 字段。',
  ].join('\n')
}

function getActionSchema(action: PlanningAction): ParsedPlanningActionResult {
  switch (action) {
    case 'generate_arc':
      return {
        action,
        data: {
          item: {
            title: '卷纲标题',
            premise: '卷纲前提',
            objective: '阶段目标',
            conflict: '核心冲突',
            payoff: '阶段兑现',
          },
        },
      }
    case 'generate_chapter_plan':
      return {
        action,
        data: {
          items: [
            {
              title: '第1章 标题',
              summary: '章节摘要',
              chapterGoal: '章节目标',
              conflict: '章节冲突',
              turn: '转折',
              reveal: '揭示',
              targetWordCount: 3000,
            },
          ],
        },
      }
    case 'generate_scene_cards':
      return {
        action,
        data: {
          items: [
            {
              title: '城门前换车',
              viewpoint: '沈夜',
              location: '朱雀门外',
              objective: '确认押解路线是否被篡改',
              obstacle: '押解官催促启程',
              outcome: '发现前方有人提前设伏',
              continuityNotes: '延续右臂旧伤与雨夜能见度受限',
              status: 'planned',
            },
          ],
        },
      }
    case 'suggest_next_step':
      return {
        action,
        data: {
          item: {
            summary: '下一步要做什么',
            reason: '为什么此时最该做这一步',
            targetKind: 'arc',
            targetTitle: '第一卷：雨夜入局',
          },
        },
      }
  }
}

function convertWorldBibleToStoryBible(worldBible: string): string {
  return worldBible.replace('【世界观百科】', '【故事圣经】')
}

function validatePlanningActionResult(result: ParsedPlanningActionResult): string | null {
  if (!result || typeof result !== 'object' || !('action' in result) || !('data' in result)) {
    return '规划结果缺少 action 或 data'
  }

  switch (result.action) {
    case 'generate_arc':
      return hasStringFields(result.data.item, ['title', 'premise', 'objective', 'conflict', 'payoff'])
    case 'generate_chapter_plan':
      return validateItems(result.data.items, ['title', 'summary', 'chapterGoal', 'conflict', 'turn', 'reveal'])
    case 'generate_scene_cards':
      return validateItems(result.data.items, [
        'title',
        'viewpoint',
        'location',
        'objective',
        'obstacle',
        'outcome',
        'continuityNotes',
      ])
    case 'suggest_next_step':
      return hasStringFields(result.data.item, ['summary', 'reason'])
    default:
      return '未知的规划动作'
  }
}

function validateItems(
  items: unknown,
  fields: string[]
): string | null {
  if (!Array.isArray(items) || items.length === 0) {
    return '规划结果 items 不能为空'
  }
  return items.some(item => hasStringFields(item, fields) !== null)
    ? '规划结果 items 字段不完整'
    : null
}

function hasStringFields(value: unknown, fields: string[]): string | null {
  if (!value || typeof value !== 'object') {
    return '规划结果字段格式错误'
  }

  const row = value as Record<string, unknown>
  for (const field of fields) {
    if (typeof row[field] !== 'string') {
      return `规划结果缺少 ${field}`
    }
  }

  return null
}
