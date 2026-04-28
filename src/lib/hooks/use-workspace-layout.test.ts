import { renderHook, act } from '@testing-library/react'
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
    expect(result.current).not.toHaveProperty('focusMode')

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

  it('updates activeTab immediately when switching tabs', () => {
    const saveActiveTab = vi.fn()

    mockUseLayout.mockReturnValue({
      activeTab: 'chapters',
      activeChapterId: 'chapter-2',
      activeOutlineId: null,
      activeWorldEntryId: null,
      activePlanningSelection: null,
      saveSidebarWidth: vi.fn(),
      saveActiveTab,
      saveChatPanelWidth: vi.fn(),
      saveWorkspaceContext: vi.fn(),
    })

    mockUseChapters.mockReturnValue({
      chapters: [
        { id: 'chapter-1', deletedAt: null, order: 0, title: '第一章' },
        { id: 'chapter-2', deletedAt: null, order: 1, title: '第二章' },
      ],
      loading: false,
    })

    const { result } = renderHook(() => useWorkspaceLayout({ projectId: 'p1' }))

    act(() => {
      result.current.handleTabChange('outline')
    })

    expect(result.current.activeTab).toBe('outline')
    expect(window.location.search).toContain('tab=outline')
    expect(saveActiveTab).toHaveBeenCalledWith('outline')
  })

  it('syncs URL params for world and planning tab state', () => {
    mockUseChapters.mockReturnValue({
      chapters: [
        { id: 'chapter-1', deletedAt: null, order: 0, title: '第一章' },
      ],
      loading: false,
    })

    const { result } = renderHook(() => useWorkspaceLayout({ projectId: 'p1' }))

    act(() => {
      result.current.handleTabChange('world')
      result.current.setActiveWorldEntryId('entry-7')
    })

    expect(result.current.activeTab).toBe('world')
    expect(window.location.search).toContain('tab=world')
    expect(window.location.search).toContain('entry=entry-7')

    act(() => {
      result.current.setActivePlanningItem({ kind: 'arc', id: 'arc-1' })
    })

    expect(result.current.activeTab).toBe('planning')
    expect(window.location.search).toContain('tab=planning')
    expect(window.location.search).toContain('planningKind=arc')
    expect(window.location.search).toContain('planningId=arc-1')
  })

  it('prefers URL tab state during initialization', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/projects/p1?tab=world&entry=entry-2')

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
      entries: [{ id: 'entry-2', type: 'character', name: '主角' }],
      entriesByType: { character: [{ id: 'entry-2', type: 'character', name: '主角' }] },
      addEntry: vi.fn(),
    })

    mockUseChapters.mockReturnValue({
      chapters: [],
      loading: false,
    })

    const { result } = renderHook(() => useWorkspaceLayout({ projectId: 'p1' }))

    expect(result.current.activeTab).toBe('world')
    expect(result.current.activeWorldEntryId).toBe('entry-2')
  })
})
