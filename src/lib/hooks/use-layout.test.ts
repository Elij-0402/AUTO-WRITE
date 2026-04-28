import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLayout } from './use-layout'

const mockUseLiveQuery = vi.fn()
const mockGet = vi.fn()
const mockPut = vi.fn()
const mockCreateProjectDB = vi.fn()

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

vi.mock('../db/project-db', () => ({
  createProjectDB: (...args: unknown[]) => mockCreateProjectDB(...args),
}))

describe('useLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue(undefined)
    mockPut.mockResolvedValue(undefined)
    mockUseLiveQuery.mockImplementation((_query, _deps, fallback) => fallback)
    mockCreateProjectDB.mockReturnValue({
      layoutSettings: {
        get: mockGet,
        put: mockPut,
      },
    })
  })

  it('reads restored workspace context from layout settings', () => {
    mockUseLiveQuery.mockReturnValue({
      id: 'default',
      sidebarWidth: 300,
      activeTab: 'planning',
      chatPanelWidth: 360,
      activeChapterId: 'chapter-3',
      chapterBriefOpen: true,
      activePlanningSelection: { kind: 'chapter', id: 'plan-2' },
      lastWorkspaceContext: 'planning',
    })

    const { result } = renderHook(() => useLayout('project-1'))

    expect(result.current.activeChapterId).toBe('chapter-3')
    expect(result.current.chapterBriefOpen).toBe(true)
    expect(result.current.activePlanningSelection).toEqual({ kind: 'chapter', id: 'plan-2' })
    expect(result.current.lastWorkspaceContext).toBe('planning')
  })

  it('persists active chapter and planning selection without dropping existing layout fields', async () => {
    mockUseLiveQuery.mockReturnValue({
      id: 'default',
      sidebarWidth: 280,
      activeTab: 'chapters',
      chatPanelWidth: 320,
      activeChapterId: 'chapter-1',
      chapterBriefOpen: false,
      activePlanningSelection: null,
      lastWorkspaceContext: 'chapter',
    })

    const { result } = renderHook(() => useLayout('project-1'))

    await act(async () => {
      await result.current.saveWorkspaceContext({
        activeChapterId: 'chapter-4',
        chapterBriefOpen: true,
        activePlanningSelection: { kind: 'scene', id: 'scene-9' },
        lastWorkspaceContext: 'planning',
      })
    })

    expect(mockPut).toHaveBeenCalledWith({
      id: 'default',
      sidebarWidth: 280,
      activeTab: 'chapters',
      chatPanelWidth: 320,
      activeChapterId: 'chapter-4',
      chapterBriefOpen: true,
      activeWorldEntryId: null,
      activePlanningSelection: { kind: 'scene', id: 'scene-9' },
      lastWorkspaceContext: 'planning',
    })
  })
})
