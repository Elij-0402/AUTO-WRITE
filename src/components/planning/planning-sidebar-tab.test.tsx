import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlanningSidebarTab } from './planning-sidebar-tab'

const createIdeaNote = vi.fn()
const createStoryArc = vi.fn()
const createChapterPlan = vi.fn()

vi.mock('@/lib/hooks/use-planning', () => ({
  usePlanning: () => ({
    snapshot: {
      ideaNotes: [{ id: 'idea-1', title: '雨夜宫变', premise: '', moodKeywords: [], sourceType: 'manual', status: 'seed', createdAt: 1, updatedAt: 1, deletedAt: null }],
      storyArcs: [{ id: 'arc-1', title: '第一卷', premise: '', objective: '', conflict: '', payoff: '', order: 1, status: 'draft', sourceIdeaIds: [], relatedEntryIds: [], createdAt: 1, updatedAt: 1, deletedAt: null }],
      chapterPlans: [{ id: 'chapter-1', projectId: 'project-1', arcId: 'arc-1', linkedChapterId: null, title: '第1章 雨夜押解', summary: '', chapterGoal: '', conflict: '', turn: '', reveal: '', order: 1, status: 'planned', targetWordCount: null, createdAt: 1, updatedAt: 1, deletedAt: null }],
      sceneCards: [{ id: 'scene-1', projectId: 'project-1', chapterPlanId: 'chapter-1', title: '城门前换车', viewpoint: '', location: '', objective: '', obstacle: '', outcome: '', continuityNotes: '', order: 1, status: 'planned', linkedEntryIds: [], createdAt: 1, updatedAt: 1, deletedAt: null }],
    },
    loading: false,
    createIdeaNote,
    createStoryArc,
    createChapterPlan,
  }),
}))

describe('PlanningSidebarTab', () => {
  it('renders grouped planning sections and create actions', () => {
    render(
      <PlanningSidebarTab
        projectId="project-1"
        activeSelection={null}
        onSelectItem={vi.fn()}
      />
    )

    expect(screen.getByText('灵感')).toBeInTheDocument()
    expect(screen.getByText('卷纲')).toBeInTheDocument()
    expect(screen.getByText('章纲')).toBeInTheDocument()
    expect(screen.getByText('雨夜宫变')).toBeInTheDocument()
    expect(screen.getAllByText('第一卷')).toHaveLength(2)
    expect(screen.getByText('第1章 雨夜押解')).toBeInTheDocument()
  })

  it('creates an idea note from the section action', async () => {
    render(
      <PlanningSidebarTab
        projectId="project-1"
        activeSelection={null}
        onSelectItem={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('新建灵感'))

    expect(createIdeaNote).toHaveBeenCalled()
  })

  it('shows chapter plans grouped under their story arc', () => {
    render(
      <PlanningSidebarTab
        projectId="project-1"
        activeSelection={null}
        onSelectItem={vi.fn()}
      />
    )

    const chapterListRow = screen.getByText('第1章 雨夜押解').closest('div')

    expect(screen.getAllByText('第一卷')).toHaveLength(2)
    expect(chapterListRow?.className).toContain('pl-6')
  })
})
