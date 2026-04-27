import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OutlineEditForm } from './outline-edit-form'

vi.mock('@/lib/hooks/use-autosave', () => ({
  useAutoSave: () => ({
    isSaving: false,
    lastSaved: null,
  }),
}))

vi.mock('@/lib/hooks/use-chapters', () => ({
  useChapters: () => ({
    chapters: [
      {
        id: 'chapter-1',
        projectId: 'project-1',
        order: 1,
        title: '第1章 雨夜押解',
        content: null,
        wordCount: 1200,
        status: 'draft',
        outlineSummary: '旧摘要',
        outlineTargetWordCount: 3000,
        outlineStatus: 'in_progress',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: null,
      },
    ],
    renameChapter: vi.fn(),
    updateOutlineFields: vi.fn(),
  }),
}))

vi.mock('@/lib/hooks/use-planning', () => ({
  usePlanning: () => ({
    snapshot: {
      ideaNotes: [],
      storyArcs: [],
      chapterPlans: [
        {
          id: 'plan-1',
          projectId: 'project-1',
          arcId: null,
          linkedChapterId: 'chapter-1',
          title: '第1章 雨夜押解',
          summary: '该章已关联章纲，建议优先在规划台维护结构信息。',
          chapterGoal: '活着进城',
          conflict: '',
          turn: '',
          reveal: '',
          order: 1,
          status: 'planned',
          targetWordCount: 3000,
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
      sceneCards: [],
    },
  }),
}))

describe('OutlineEditForm', () => {
  it('shows a linked chapter-plan notice when planning data exists', () => {
    render(
      <OutlineEditForm
        projectId="project-1"
        chapterId="chapter-1"
        hasPrevious={false}
        hasNext={false}
      />
    )

    expect(screen.getByText('该章已关联章纲，建议优先在规划台维护结构信息。')).toBeInTheDocument()
  })
})
