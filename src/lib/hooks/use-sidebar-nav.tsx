'use client'

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'

/**
 * Sidebar navigation state — per /autoplan CEO-1D + ENG-1C.
 *
 * The workspace has three left-sidebar tabs (chapters / outline / world)
 * plus selection inside each. Historically each consumer managed its own
 * local state and the parent page coordinated via prop drilling. That
 * worked fine until T2: a citation chip rendered deep in the AI chat
 * panel needs to flip the sidebar to the world tab AND select a specific
 * entry. Drilling two setters through 5+ components would be noisy.
 *
 * This context is scoped to the workspace route and stays tiny on purpose
 * (no global store, no Zustand). State lives in the parent page so there
 * is a single source of truth; the provider just forwards it.
 *
 * Consumers read via the hook:
 *
 *   const { activeTab, selectedEntryId, focusWorldEntry } = useSidebarNav()
 */

export type SidebarTab = 'chapters' | 'outline' | 'world'

export interface SidebarNavState {
  activeTab: SidebarTab
  selectedEntryId: string | null
  /** Jump to the world tab + select the given entry. */
  focusWorldEntry: (entryId: string) => void
  /** Low-level setters for pre-existing tab/selection flows. */
  setActiveTab: (tab: SidebarTab) => void
  setSelectedEntryId: (id: string | null) => void
}

const SidebarNavContext = createContext<SidebarNavState | null>(null)

export interface SidebarNavProviderProps {
  children: ReactNode
  activeTab: SidebarTab
  selectedEntryId: string | null
  setActiveTab: (tab: SidebarTab) => void
  setSelectedEntryId: (id: string | null) => void
}

export function SidebarNavProvider({
  children,
  activeTab,
  selectedEntryId,
  setActiveTab,
  setSelectedEntryId,
}: SidebarNavProviderProps) {
  const focusWorldEntry = useCallback(
    (entryId: string) => {
      setActiveTab('world')
      setSelectedEntryId(entryId)
    },
    [setActiveTab, setSelectedEntryId]
  )

  const value = useMemo<SidebarNavState>(
    () => ({
      activeTab,
      selectedEntryId,
      focusWorldEntry,
      setActiveTab,
      setSelectedEntryId,
    }),
    [activeTab, selectedEntryId, focusWorldEntry, setActiveTab, setSelectedEntryId]
  )

  return <SidebarNavContext.Provider value={value}>{children}</SidebarNavContext.Provider>
}

/**
 * Read the sidebar navigation state. Throws if called outside the provider —
 * that's intentional so mis-wired components fail loudly in dev.
 */
export function useSidebarNav(): SidebarNavState {
  const ctx = useContext(SidebarNavContext)
  if (!ctx) {
    throw new Error('useSidebarNav must be used inside <SidebarNavProvider>')
  }
  return ctx
}
