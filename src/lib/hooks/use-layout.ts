'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { useMemo, useCallback } from 'react'

/**
 * Active sidebar tab type per D-13, D-14, D-08.
 * 'chapters' = chapter list, 'outline' = outline list, 'world' = world bible
 */
export type ActiveTab = 'chapters' | 'outline' | 'world'

/** Default chat panel width in pixels per D-09 */
const DEFAULT_CHAT_PANEL_WIDTH = 320

/**
 * Hook for per-project layout persistence per D-24, D-25, D-26.
 * Stores sidebar width, active tab, and chat panel width in IndexedDB layoutSettings table.
 *
 * Per D-24: Layout data stored per-project in the project's IndexedDB via Dexie.
 * Per D-25: Auto-save on drag end (no explicit save button).
 * Per D-26: No multi-tab sync in V1 (last-write-wins is acceptable).
 */
export function useLayout(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  // Load layout settings reactively per D-24
  const layout = useLiveQuery(
    () => db.layoutSettings.get('default'),
    [db],
    { id: 'default', sidebarWidth: 280, activeTab: 'chapters' as ActiveTab, chatPanelWidth: DEFAULT_CHAT_PANEL_WIDTH }
  )

  // Auto-save sidebar width on change per D-25
  const saveSidebarWidth = useCallback(async (width: number) => {
    await db.layoutSettings.put({
      id: 'default',
      sidebarWidth: width,
      activeTab: layout?.activeTab ?? 'chapters',
      chatPanelWidth: layout?.chatPanelWidth ?? DEFAULT_CHAT_PANEL_WIDTH,
    })
  }, [db, layout])

  // Auto-save active tab on change per D-14
  const saveActiveTab = useCallback(async (tab: ActiveTab) => {
    await db.layoutSettings.put({
      id: 'default',
      sidebarWidth: layout?.sidebarWidth ?? 280,
      activeTab: tab,
      chatPanelWidth: layout?.chatPanelWidth ?? DEFAULT_CHAT_PANEL_WIDTH,
    })
  }, [db, layout])

  // Auto-save chat panel width on change per D-12
  const saveChatPanelWidth = useCallback(async (width: number) => {
    await db.layoutSettings.put({
      id: 'default',
      sidebarWidth: layout?.sidebarWidth ?? 280,
      activeTab: layout?.activeTab ?? 'chapters',
      chatPanelWidth: width,
    })
  }, [db, layout])

  return {
    sidebarWidth: layout?.sidebarWidth ?? 280,
    activeTab: (layout?.activeTab ?? 'chapters') as ActiveTab,
    chatPanelWidth: layout?.chatPanelWidth ?? DEFAULT_CHAT_PANEL_WIDTH,
    saveSidebarWidth,
    saveActiveTab,
    saveChatPanelWidth,
  }
}