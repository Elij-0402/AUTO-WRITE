'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB, type InkForgeProjectDB } from '../db/project-db'
import type { LayoutSettings } from '../db/project-db'
import { useMemo, useCallback } from 'react'

/**
 * Active sidebar tab type per D-13, D-14.
 * 'chapters' = chapter list, 'outline' = outline list
 */
export type ActiveTab = 'chapters' | 'outline'

/**
 * Hook for per-project layout persistence per D-24, D-25, D-26.
 * Stores sidebar width and active tab in IndexedDB layoutSettings table.
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
    { id: 'default', sidebarWidth: 280, activeTab: 'chapters' as ActiveTab }
  )

  // Auto-save sidebar width on change per D-25
  const saveSidebarWidth = useCallback(async (width: number) => {
    await db.layoutSettings.put({
      id: 'default',
      sidebarWidth: width,
      activeTab: layout?.activeTab ?? 'chapters',
    })
  }, [db, layout])

  // Auto-save active tab on change per D-14
  const saveActiveTab = useCallback(async (tab: ActiveTab) => {
    await db.layoutSettings.put({
      id: 'default',
      sidebarWidth: layout?.sidebarWidth ?? 280,
      activeTab: tab,
    })
  }, [db, layout])

  return {
    sidebarWidth: layout?.sidebarWidth ?? 280,
    activeTab: (layout?.activeTab ?? 'chapters') as ActiveTab,
    saveSidebarWidth,
    saveActiveTab,
  }
}