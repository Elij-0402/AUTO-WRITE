import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspaceLayout } from './use-workspace-layout'

const mockUseLayout = vi.fn()
const mockUseChapters = vi.fn()
const mockUseWorldEntries = vi.fn()
const mockUseIdleMode = vi.fn()

vi.mock('./use-layout', () => ({
  useLayout: (...args: unknown[]) => mockUseLayout(...args),
}))

vi.mock('./use-chapters', () => ({
  useChapters: (...args: unknown[]) => mockUseChapters(...args),
}))

vi.mock('./use-world-entries', () => ({
  useWorldEntries: (...args: unknown[]) => mockUseWorldEntries(...args),
}))

vi.mock('./use-idle-mode', () => ({
  useIdleMode: (...args: unknown[]) => mockUseIdleMode(...args),
}))

describe('useWorkspaceLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', 'http://localhost:3000/projects/p1?tab=chapters&chapter=chapter-2')

    mockUseLayout.mockReturnValue({
      activeTab: 'chapters',
      activeChapterId: 'chapter-2',
      activeOutlineId: null,
      activeWorldEntryId: null,
      activePlanningSelection: null,
      saveSidebarWidth: vi.fn(),
      saveActiveTab: vi.fn(),
      saveChatPanelWidth: vi.fn(),
      saveWorkspaceContext: vi.fn(),
    })

    mockUseWorldEntries.mockReturnValue({
      entries: [],
      entriesByType: {},
      addEntry: vi.fn(),
    })

    mockUseIdleMode.mockReturnValue(false)
  })

  it('does not reset the restored active chapter while chapters are still loading', () => {
    mockUseChapters.mockReturnValue({
      chapters: [],
      loading: true,
    })

    const { result, rerender } = renderHook(() => useWorkspaceLayout({ projectId: 'p1' }))

    expect(result.current.activeChapterId).toBe('chapter-2')

    mockUseChapters.mockReturnValue({
      chapters: [
        {
          id: 'chapter-1',
          deletedAt: null,
          order: 0,
          title: '第一章',
        },
        {
          id: 'chapter-2',
          deletedAt: null,
          order: 1,
          title: '第二章',
        },
      ],
      loading: false,
    })

    rerender()

    expect(result.current.activeChapterId).toBe('chapter-2')
    expect(window.location.search).toContain('chapter=chapter-2')
  })
})
