import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChapterDraftPanel } from './chapter-draft-panel'

let planningSnapshot = {
  ideaNotes: [],
  storyArcs: [],
  chapterPlans: [
    {
      id: 'plan-1',
      projectId: 'project-1',
      arcId: 'arc-1',
      linkedChapterId: 'chapter-1',
      title: '第1章 雨夜押解',
      summary: '押解途中第一次遇袭',
      chapterGoal: '把犯人送进关城',
      conflict: '路线暴露',
      turn: '发现内应',
      reveal: '押解令被调包',
      order: 1,
      status: 'planned' as const,
      targetWordCount: 2800,
      createdAt: 1,
      updatedAt: 10,
      deletedAt: null,
    },
  ],
  sceneCards: [
    {
      id: 'scene-1',
      projectId: 'project-1',
      chapterPlanId: 'plan-1',
      title: '城门前换车',
      viewpoint: '沈夜',
      location: '朱雀门外',
      objective: '确认路线',
      obstacle: '押解官催促启程',
      outcome: '发现有人设伏',
      continuityNotes: '保持右臂旧伤',
      order: 1,
      status: 'planned' as const,
      linkedEntryIds: [],
      createdAt: 1,
      updatedAt: 100,
      deletedAt: null,
    },
    {
      id: 'scene-2',
      projectId: 'project-1',
      chapterPlanId: 'plan-1',
      title: '雨巷伏杀',
      viewpoint: '顾迟',
      location: '南城雨巷',
      objective: '护住证人',
      obstacle: '刺客封路',
      outcome: '找到熟悉纹样',
      continuityNotes: '雨夜压低能见度',
      order: 2,
      status: 'planned' as const,
      linkedEntryIds: [],
      createdAt: 1,
      updatedAt: 200,
      deletedAt: null,
    },
  ],
}

vi.mock('@/lib/hooks/use-planning', () => ({
  usePlanning: () => ({
    snapshot: planningSnapshot,
  }),
}))

vi.mock('@/lib/hooks/use-chapter-draft-generation', () => ({
  useChapterDraftGeneration: () => ({
    state: 'idle',
    draft: '',
    error: null,
    progress: '',
    startGeneration: vi.fn(),
    acceptDraft: vi.fn(),
    dismissDraft: vi.fn(),
    cancelGeneration: vi.fn(),
  }),
}))

describe('ChapterDraftPanel', () => {
  beforeEach(() => {
    planningSnapshot = {
      ideaNotes: [],
      storyArcs: [],
      chapterPlans: [
        {
          id: 'plan-1',
          projectId: 'project-1',
          arcId: 'arc-1',
          linkedChapterId: 'chapter-1',
          title: '第1章 雨夜押解',
          summary: '押解途中第一次遇袭',
          chapterGoal: '把犯人送进关城',
          conflict: '路线暴露',
          turn: '发现内应',
          reveal: '押解令被调包',
          order: 1,
          status: 'planned',
          targetWordCount: 2800,
          createdAt: 1,
          updatedAt: 10,
          deletedAt: null,
        },
      ],
      sceneCards: [
        {
          id: 'scene-1',
          projectId: 'project-1',
          chapterPlanId: 'plan-1',
          title: '城门前换车',
          viewpoint: '沈夜',
          location: '朱雀门外',
          objective: '确认路线',
          obstacle: '押解官催促启程',
          outcome: '发现有人设伏',
          continuityNotes: '保持右臂旧伤',
          order: 1,
          status: 'planned',
          linkedEntryIds: [],
          createdAt: 1,
          updatedAt: 100,
          deletedAt: null,
        },
        {
          id: 'scene-2',
          projectId: 'project-1',
          chapterPlanId: 'plan-1',
          title: '雨巷伏杀',
          viewpoint: '顾迟',
          location: '南城雨巷',
          objective: '护住证人',
          obstacle: '刺客封路',
          outcome: '找到熟悉纹样',
          continuityNotes: '雨夜压低能见度',
          order: 2,
          status: 'planned',
          linkedEntryIds: [],
          createdAt: 1,
          updatedAt: 200,
          deletedAt: null,
        },
      ],
    }
  })

  function renderPanel() {
    return render(
      <ChapterDraftPanel
        projectId="project-1"
        activeChapterId="chapter-1"
        config={{ provider: 'openai-compatible', apiKey: 'mock-api-key', model: 'mock-gpt' }}
        worldEntries={[]}
        onAcceptDraft={vi.fn()}
        onOpenAIConfig={vi.fn()}
      />
    )
  }

  it('auto-refreshes the outline when linked scene cards change before local edits', () => {
    const view = renderPanel()
    const outline = screen.getByLabelText<HTMLTextAreaElement>('章节大纲')

    expect(outline.value).toContain('1. 城门前换车')
    expect(outline.value).toContain('2. 雨巷伏杀')

    planningSnapshot = {
      ...planningSnapshot,
      sceneCards: [
        {
          ...planningSnapshot.sceneCards[1],
          id: 'scene-2',
          title: '雨巷反杀',
          order: 1,
          updatedAt: 500,
        },
        {
          ...planningSnapshot.sceneCards[0],
          id: 'scene-1',
          order: 2,
          updatedAt: 600,
        },
      ],
    }

    view.rerender(
      <ChapterDraftPanel
        projectId="project-1"
        activeChapterId="chapter-1"
        config={{ provider: 'openai-compatible', apiKey: 'mock-api-key', model: 'mock-gpt' }}
        worldEntries={[]}
        onAcceptDraft={vi.fn()}
        onOpenAIConfig={vi.fn()}
      />
    )

    expect(outline.value).toContain('1. 雨巷反杀')
    expect(outline.value).toContain('2. 城门前换车')
    expect(screen.queryByRole('button', { name: '刷新大纲' })).not.toBeInTheDocument()
  })

  it('preserves local edits and shows an explicit refresh action when planning updates later', () => {
    const view = renderPanel()
    const outline = screen.getByLabelText<HTMLTextAreaElement>('章节大纲')

    fireEvent.change(outline, {
      target: { value: '我自己改过的大纲' },
    })

    planningSnapshot = {
      ...planningSnapshot,
      sceneCards: planningSnapshot.sceneCards.map((scene, index) => ({
        ...scene,
        title: index === 0 ? '城门暗哨' : scene.title,
        updatedAt: scene.updatedAt + 1000,
      })),
    }

    view.rerender(
      <ChapterDraftPanel
        projectId="project-1"
        activeChapterId="chapter-1"
        config={{ provider: 'openai-compatible', apiKey: 'mock-api-key', model: 'mock-gpt' }}
        worldEntries={[]}
        onAcceptDraft={vi.fn()}
        onOpenAIConfig={vi.fn()}
      />
    )

    expect(outline.value).toBe('我自己改过的大纲')
    expect(screen.getByText('检测到更新后的章纲或场景卡，当前大纲仍保留你的本地修改。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新大纲' })).toBeVisible()
  })

  it('rebuilds the outline from the latest planning state after explicit refresh', () => {
    const view = renderPanel()
    const outline = screen.getByLabelText<HTMLTextAreaElement>('章节大纲')

    fireEvent.change(outline, {
      target: { value: '我自己改过的大纲' },
    })

    planningSnapshot = {
      ...planningSnapshot,
      sceneCards: [
        {
          ...planningSnapshot.sceneCards[0],
          title: '城门暗哨',
          updatedAt: 700,
        },
        {
          ...planningSnapshot.sceneCards[1],
          title: '雨巷反杀',
          updatedAt: 800,
        },
      ],
    }

    view.rerender(
      <ChapterDraftPanel
        projectId="project-1"
        activeChapterId="chapter-1"
        config={{ provider: 'openai-compatible', apiKey: 'mock-api-key', model: 'mock-gpt' }}
        worldEntries={[]}
        onAcceptDraft={vi.fn()}
        onOpenAIConfig={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '刷新大纲' }))

    expect(outline.value).toContain('1. 城门暗哨')
    expect(outline.value).toContain('2. 雨巷反杀')
    expect(screen.queryByRole('button', { name: '刷新大纲' })).not.toBeInTheDocument()
    expect(screen.getByText(/场景拆解：2 张场景卡/)).toBeInTheDocument()
  })
})
