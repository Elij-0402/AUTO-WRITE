import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlanningAiPanel } from './planning-ai-panel'

const createStoryArc = vi.fn().mockResolvedValue({ id: 'arc-new' })
const createChapterPlan = vi.fn().mockResolvedValue(undefined)
const runAction = vi.fn()
const dismissResult = vi.fn()
let planningAiState: {
  loading: boolean
  error: string | null
  runningAction: string | null
  result: unknown
} = {
  loading: false,
  error: null,
  runningAction: null,
  result: null,
}

vi.mock('@/lib/hooks/use-planning', () => ({
  usePlanning: () => ({
    snapshot: {
      ideaNotes: [
        {
          id: 'idea-1',
          projectId: 'project-1',
          title: '雨夜宫变',
          premise: '少女替父顶罪',
          moodKeywords: ['压抑'],
          sourceType: 'manual',
          status: 'seed',
          createdAt: 1,
          updatedAt: 10,
          deletedAt: null,
        },
      ],
      storyArcs: [
        {
          id: 'arc-1',
          projectId: 'project-1',
          title: '第一卷：雨夜入局',
          premise: '主角被迫入局',
          objective: '活下来',
          conflict: '朝堂追杀',
          payoff: '找到幕后主使',
          order: 2,
          status: 'draft',
          sourceIdeaIds: ['idea-1'],
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
          linkedChapterId: null,
          title: '第1章 雨夜押解',
          summary: '押解途中第一次遇袭',
          chapterGoal: '活着进城',
          conflict: '路线暴露',
          turn: '发现内应',
          reveal: '押解令被调包',
          order: 4,
          status: 'planned',
          targetWordCount: 3000,
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
      sceneCards: [
        {
          id: 'scene-1',
          projectId: 'project-1',
          chapterPlanId: 'chapter-1',
          title: '城门前换车',
          viewpoint: '沈夜',
          location: '朱雀门外',
          objective: '确认押解路线被篡改',
          obstacle: '押解官催促启程',
          outcome: '发现有人提前设伏',
          continuityNotes: '保持右臂伤势延续',
          order: 6,
          status: 'planned',
          linkedEntryIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
    },
    createStoryArc,
    createChapterPlan,
  }),
}))

vi.mock('@/lib/hooks/use-project-charter', () => ({
  useProjectCharter: () => ({
    charter: null,
    loading: false,
  }),
}))

vi.mock('@/lib/hooks/use-story-trackers', () => ({
  useStoryTrackers: () => ({
    trackers: [],
    loading: false,
  }),
}))

vi.mock('@/lib/hooks/use-world-entries', () => ({
  useWorldEntries: () => ({
    entries: [],
    loading: false,
  }),
}))

vi.mock('@/lib/hooks/use-chapters', () => ({
  useChapters: () => ({
    chapters: [
      {
        id: 'chapter-linked',
        title: '第1章 雨夜押解',
      },
    ],
  }),
}))

vi.mock('@/lib/hooks/use-planning-ai', () => ({
  usePlanningAi: () => ({
    loading: planningAiState.loading,
    error: planningAiState.error,
    runningAction: planningAiState.runningAction,
    result: planningAiState.result,
    runAction,
    dismissResult,
  }),
}))

describe('PlanningAiPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    planningAiState = {
      loading: false,
      error: null,
      runningAction: null,
      result: null,
    }
  })

  it('enables and disables action buttons by current selection', () => {
    render(
      <PlanningAiPanel
        projectId="project-1"
        selection={{ kind: 'arc', id: 'arc-1' }}
        onSelectItem={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '基于灵感生成卷纲' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '基于卷纲生成章纲' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '基于章纲拆解场景卡' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '推荐下一步' })).toBeEnabled()
  })

  it('falls back to the latest idea for arc generation when no item is selected', async () => {
    render(
      <PlanningAiPanel
        projectId="project-1"
        selection={null}
        onSelectItem={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '基于灵感生成卷纲' }))

    await waitFor(() => {
      expect(runAction).toHaveBeenCalledWith('generate_arc', expect.objectContaining({
        focusIdeaId: 'idea-1',
      }))
    })
  })

  it('applies generated arc preview by creating a new story arc', async () => {
    planningAiState.result = {
      action: 'generate_arc',
      data: {
        item: {
          title: '第二卷：金殿请罪',
          premise: '主角第一次反守为攻',
          objective: '逼出第二层幕后之手',
          conflict: '旧案证据被人截断',
          payoff: '拿到进入皇城的资格',
        },
      },
    }

    render(
      <PlanningAiPanel
        projectId="project-1"
        selection={{ kind: 'idea', id: 'idea-1' }}
        onSelectItem={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '应用结果' }))

    await waitFor(() => {
      expect(createStoryArc).toHaveBeenCalledWith(expect.objectContaining({
        title: '第二卷：金殿请罪',
        order: 3,
        sourceIdeaIds: ['idea-1'],
      }))
    })
  })
})
