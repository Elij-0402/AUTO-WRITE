import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OutlineTab } from './outline-tab'

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: {},
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: () => ([]),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
}))

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: {},
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
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
        wordCount: 0,
        status: 'draft',
        outlineSummary: '',
        outlineTargetWordCount: null,
        outlineStatus: 'not_started',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        deletedAt: null,
      },
    ],
    loading: false,
    reorderChapters: vi.fn(),
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
          summary: '主角在押解途中确认有人想灭口',
          chapterGoal: '活着进城',
          conflict: '',
          turn: '',
          reveal: '',
          order: 1,
          status: 'planned',
          targetWordCount: null,
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
        },
      ],
      sceneCards: [],
    },
  }),
}))

describe('OutlineTab', () => {
  it('shows linked chapter-plan summary before local outline fallback', () => {
    render(
      <OutlineTab
        projectId="project-1"
        onSelectOutline={vi.fn()}
        activeOutlineId={null}
      />
    )

    expect(screen.getByText('主角在押解途中确认有人想灭口')).toBeInTheDocument()
  })
})
