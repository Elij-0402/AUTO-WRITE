import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChapterSidebar } from './chapter-sidebar'

vi.mock('@/lib/hooks/use-chapters', () => ({
  useChapters: () => ({
    chapters: [],
    loading: false,
    addChapter: vi.fn(),
    reorderChapters: vi.fn(),
    renameChapter: vi.fn(),
    softDeleteChapter: vi.fn(),
    duplicateChapter: vi.fn(),
    updateChapterStatus: vi.fn(),
  }),
}))

vi.mock('@/components/outline/outline-tab', () => ({
  OutlineTab: () => <div>outline-tab</div>,
}))

vi.mock('@/components/world-bible/world-bible-tab', () => ({
  WorldBibleTab: () => <div>world-bible-tab</div>,
}))

vi.mock('@/components/planning/planning-sidebar-tab', () => ({
  PlanningSidebarTab: () => <div>planning-sidebar-tab</div>,
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('ChapterSidebar', () => {
  it('renders a planning rail item', () => {
    render(
      <ChapterSidebar
        projectId="project-1"
        activeChapterId={null}
        onSelectChapter={vi.fn()}
        activeTab="chapters"
        onTabChange={vi.fn()}
        activeOutlineId={null}
        onSelectOutline={vi.fn()}
        activeWorldEntryId={null}
        onSelectWorldEntry={vi.fn()}
        onEditWorldEntry={vi.fn()}
        onDeleteWorldEntry={vi.fn()}
        activePlanningSelection={null}
        onSelectPlanningItem={vi.fn()}
      />
    )

    expect(screen.getByLabelText('规划')).toBeInTheDocument()
  })
})
