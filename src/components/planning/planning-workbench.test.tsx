import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlanningWorkbench } from './planning-workbench'

vi.mock('./planning-ai-panel', () => ({
  PlanningAiPanel: () => <div data-testid="planning-ai-panel" />,
}))

const updateIdeaNote = vi.fn()
const updateStoryArc = vi.fn()
const updateChapterPlan = vi.fn()
const createSceneCard = vi.fn().mockResolvedValue({ id: 'scene-new' })
const updateSceneCard = vi.fn().mockResolvedValue(undefined)
const deleteSceneCard = vi.fn().mockResolvedValue(undefined)
const reorderSceneCards = vi.fn().mockResolvedValue(undefined)
const addChapter = vi.fn().mockResolvedValue('chapter-new')

vi.mock('@/lib/hooks/use-planning', () => ({
  usePlanning: () => ({
    snapshot: {
      ideaNotes: [
        {
          id: 'idea-1',
          title: '雨夜宫变',
          premise: '一个少女替父顶罪',
          moodKeywords: ['压抑'],
          sourceType: 'manual',
          status: 'seed',
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
      storyArcs: [
        {
          id: 'arc-1',
          title: '第一卷：雨夜入局',
          premise: '主角被迫入局',
          objective: '活下来',
          conflict: '朝堂追杀',
          payoff: '找到幕后主使',
          order: 1,
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
          linkedChapterId: 'linked-chapter',
          title: '第1章 雨夜押解',
          summary: '押解途中第一次遇袭',
          chapterGoal: '活着进城',
          conflict: '路线暴露',
          turn: '发现内应',
          reveal: '押解令被调包',
          order: 1,
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
          chapterPlanId: 'chapter-1',
          title: '雨巷伏杀',
          viewpoint: '顾迟',
          location: '南城雨巷',
          objective: '护住关键证人',
          obstacle: '刺客封路',
          outcome: '找到熟悉纹样',
          continuityNotes: '保持雨夜追逐的体力损耗',
          order: 2,
          status: 'drafting',
          linkedEntryIds: [],
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
    },
    createSceneCard,
    updateSceneCard,
    deleteSceneCard,
    reorderSceneCards,
    updateIdeaNote,
    updateStoryArc,
    updateChapterPlan,
  }),
}))

vi.mock('@/lib/hooks/use-autosave', () => ({
  useAutoSave: (saveFn: () => Promise<void>) => ({
    isSaving: false,
    lastSaved: null,
    trigger: saveFn,
  }),
}))

vi.mock('@/lib/hooks/use-chapters', () => ({
  useChapters: () => ({
    chapters: [
      {
        id: 'linked-chapter',
        projectId: 'project-1',
        order: 1,
        title: '第1章 雨夜押解',
        content: null,
        wordCount: 0,
        status: 'draft',
        outlineSummary: '',
        outlineTargetWordCount: null,
        outlineStatus: 'not_started',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: null,
      },
      {
        id: 'chapter-2',
        projectId: 'project-1',
        order: 2,
        title: '第2章 金殿请罪',
        content: null,
        wordCount: 0,
        status: 'draft',
        outlineSummary: '',
        outlineTargetWordCount: null,
        outlineStatus: 'not_started',
        createdAt: new Date('2026-01-03'),
        updatedAt: new Date('2026-01-04'),
        deletedAt: null,
      },
    ],
    addChapter,
  }),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
    'aria-label': ariaLabel,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
    'aria-label'?: string
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}))

describe('PlanningWorkbench', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when nothing is selected', () => {
    render(<PlanningWorkbench projectId="project-1" selection={null} />)

    expect(screen.getByText('开始规划长篇')).toBeInTheDocument()
  })

  it('renders idea form for selected idea', () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'idea', id: 'idea-1' }}
      />
    )

    expect(screen.getByDisplayValue('雨夜宫变')).toBeInTheDocument()
    expect(screen.getByDisplayValue('一个少女替父顶罪')).toBeInTheDocument()
  })

  it('saves edited idea fields on blur', () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'idea', id: 'idea-1' }}
      />
    )

    const titleInput = screen.getByLabelText('标题')
    fireEvent.blur(titleInput)

    expect(updateIdeaNote).toHaveBeenCalledWith('idea-1', {
      title: '雨夜宫变',
      premise: '一个少女替父顶罪',
      moodKeywords: ['压抑'],
    })
  })

  it('renders arc form for selected story arc', () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'arc', id: 'arc-1' }}
      />
    )

    expect(screen.getByDisplayValue('第一卷：雨夜入局')).toBeInTheDocument()
    expect(screen.getByDisplayValue('主角被迫入局')).toBeInTheDocument()
    expect(screen.getByDisplayValue('活下来')).toBeInTheDocument()
    expect(screen.getByText('下挂 1 章')).toBeInTheDocument()
  })

  it('saves story arc fields on blur', () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'arc', id: 'arc-1' }}
      />
    )

    const titleInput = screen.getByLabelText('卷纲标题')
    fireEvent.blur(titleInput)

    expect(updateStoryArc).toHaveBeenCalledWith('arc-1', expect.objectContaining({
      title: '第一卷：雨夜入局',
      premise: '主角被迫入局',
      objective: '活下来',
    }))
  })

  it('renders chapter plan form for selected chapter plan', () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'chapter', id: 'chapter-1' }}
      />
    )

    expect(screen.getByLabelText('章纲标题')).toHaveValue('第1章 雨夜押解')
    expect(screen.getByDisplayValue('押解途中第一次遇袭')).toBeInTheDocument()
    expect(screen.getByDisplayValue('活着进城')).toBeInTheDocument()
    expect(screen.getByLabelText('绑定章节')).toHaveValue('linked-chapter')
    expect(screen.getByText('所属卷纲：第一卷：雨夜入局')).toBeInTheDocument()
    expect(screen.getByText('场景拆解：2 张场景卡，已具备起草骨架')).toBeInTheDocument()
    expect(screen.getByText('场景卡拆解')).toBeInTheDocument()
    expect(screen.getByText('城门前换车')).toBeInTheDocument()
  })

  it('updates linked chapter for selected chapter plan', () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'chapter', id: 'chapter-1' }}
      />
    )

    fireEvent.change(screen.getByLabelText('绑定章节'), {
      target: { value: 'chapter-2' },
    })

    expect(updateChapterPlan).toHaveBeenCalledWith('chapter-1', expect.objectContaining({
      linkedChapterId: 'chapter-2',
    }))
  })

  it('creates and binds a chapter, then forwards the new chapter id', async () => {
    const onOpenLinkedChapter = vi.fn()

    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'chapter', id: 'chapter-1' }}
        onOpenLinkedChapter={onOpenLinkedChapter}
      />
    )

    fireEvent.click(screen.getByText('新建并绑定'))

    await waitFor(() => {
      expect(addChapter).toHaveBeenCalledWith('第1章 雨夜押解')
      expect(updateChapterPlan).toHaveBeenCalledWith('chapter-1', expect.objectContaining({
        linkedChapterId: 'chapter-new',
      }))
      expect(onOpenLinkedChapter).toHaveBeenCalledWith('chapter-new')
    })
  })

  it('updates scene-card fields for the selected chapter plan', () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'chapter', id: 'chapter-1' }}
      />
    )

    fireEvent.click(screen.getByText('城门前换车'))
    const viewpointInput = screen.getByLabelText('视角')
    fireEvent.change(viewpointInput, { target: { value: '顾迟' } })
    fireEvent.blur(viewpointInput)

    expect(updateSceneCard).toHaveBeenCalledWith('scene-1', expect.objectContaining({
      viewpoint: '顾迟',
      title: '城门前换车',
      status: 'planned',
    }))
  })

  it('creates, reorders, and deletes scene cards from the chapter plan view', async () => {
    render(
      <PlanningWorkbench
        projectId="project-1"
        selection={{ kind: 'chapter', id: 'chapter-1' }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '新建场景卡' }))
    fireEvent.click(screen.getAllByLabelText('下移场景卡')[0])
    fireEvent.click(screen.getAllByLabelText('删除场景卡')[0])

    await waitFor(() => {
      expect(createSceneCard).toHaveBeenCalledWith({
        chapterPlanId: 'chapter-1',
        title: '场景 3',
      })
      expect(reorderSceneCards).toHaveBeenCalledWith('chapter-1', ['scene-2', 'scene-1'])
      expect(deleteSceneCard).toHaveBeenCalledWith('scene-1')
    })
  })
})
