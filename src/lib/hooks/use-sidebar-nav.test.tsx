import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  SidebarNavProvider,
  useSidebarNav,
  type SidebarTab,
} from './use-sidebar-nav'

function makeWrapper(initial: {
  activeTab: SidebarTab
  selectedEntryId: string | null
}): {
  wrapper: (props: { children: ReactNode }) => JSX.Element
  setActiveTab: ReturnType<typeof vi.fn>
  setSelectedEntryId: ReturnType<typeof vi.fn>
} {
  const setActiveTab = vi.fn()
  const setSelectedEntryId = vi.fn()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SidebarNavProvider
      activeTab={initial.activeTab}
      selectedEntryId={initial.selectedEntryId}
      setActiveTab={setActiveTab}
      setSelectedEntryId={setSelectedEntryId}
    >
      {children}
    </SidebarNavProvider>
  )
  return { wrapper, setActiveTab, setSelectedEntryId }
}

describe('useSidebarNav', () => {
  it('throws when called outside SidebarNavProvider', () => {
    // React logs the error; silence it in stderr for this test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useSidebarNav())).toThrow(
      /must be used inside <SidebarNavProvider>/
    )
    spy.mockRestore()
  })

  it('exposes the initial state passed to the provider', () => {
    const { wrapper } = makeWrapper({ activeTab: 'chapters', selectedEntryId: null })
    const { result } = renderHook(() => useSidebarNav(), { wrapper })
    expect(result.current.activeTab).toBe('chapters')
    expect(result.current.selectedEntryId).toBeNull()
  })

  it('focusWorldEntry flips the tab to "world" and sets the entry id', () => {
    const { wrapper, setActiveTab, setSelectedEntryId } = makeWrapper({
      activeTab: 'chapters',
      selectedEntryId: null,
    })
    const { result } = renderHook(() => useSidebarNav(), { wrapper })
    act(() => {
      result.current.focusWorldEntry('entry-123')
    })
    expect(setActiveTab).toHaveBeenCalledWith('world')
    expect(setSelectedEntryId).toHaveBeenCalledWith('entry-123')
  })

  it('setActiveTab and setSelectedEntryId forward to the parent handlers', () => {
    const { wrapper, setActiveTab, setSelectedEntryId } = makeWrapper({
      activeTab: 'world',
      selectedEntryId: null,
    })
    const { result } = renderHook(() => useSidebarNav(), { wrapper })
    act(() => {
      result.current.setActiveTab('outline')
      result.current.setSelectedEntryId('xyz')
    })
    expect(setActiveTab).toHaveBeenCalledWith('outline')
    expect(setSelectedEntryId).toHaveBeenCalledWith('xyz')
  })
})
