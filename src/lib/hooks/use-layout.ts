'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import { useMemo, useCallback } from 'react'
import type { PlanningSelection } from '../types'
import type { LayoutSettings } from '../db/project-db'

/**
 * Active sidebar tab type per D-13, D-14, D-08.
 * 'chapters' = chapter list, 'world' = world bible,
 * 'planning' = planning chain
 */
export type ActiveTab = 'chapters' | 'world' | 'planning'
export type ChapterView = 'editor' | 'outline'

/** Default chat panel width in pixels per D-09 */
const DEFAULT_CHAT_PANEL_WIDTH = 320
const DEFAULT_SIDEBAR_WIDTH = 280

export interface WorkspaceContextSnapshot {
  activeChapterId?: string | null
  chapterView?: ChapterView
  activeWorldEntryId?: string | null
  activePlanningSelection?: PlanningSelection | null
  lastWorkspaceContext?: 'chapter' | 'world' | 'planning'
}

type PersistedLayout = LayoutSettings & {
  chatPanelWidth: number
  activeChapterId: string | null
  chapterView: ChapterView
  activeWorldEntryId: string | null
  activePlanningSelection: PlanningSelection | null
  lastWorkspaceContext: NonNullable<LayoutSettings['lastWorkspaceContext']>
}

const DEFAULT_LAYOUT: PersistedLayout = {
  id: 'default',
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  activeTab: 'chapters' as ActiveTab,
  chatPanelWidth: DEFAULT_CHAT_PANEL_WIDTH,
  activeChapterId: null,
  chapterView: 'editor',
  activeWorldEntryId: null,
  activePlanningSelection: null,
  lastWorkspaceContext: 'chapter' as const,
}

function getLayoutStorageKey(projectId: string): string {
  return `inkforge:layout:${projectId}`
}

function readLocalLayout(projectId: string): Partial<PersistedLayout> | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(getLayoutStorageKey(projectId))
    return raw ? JSON.parse(raw) as Partial<PersistedLayout> : null
  } catch {
    return null
  }
}

function writeLocalLayout(projectId: string, layout: Partial<PersistedLayout>): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(getLayoutStorageKey(projectId), JSON.stringify(layout))
  } catch {
    // Ignore quota or serialization issues; IndexedDB remains the durable store.
  }
}

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
  const localLayout = useMemo(() => readLocalLayout(projectId), [projectId])

  // Load layout settings reactively per D-24
  const layout = useLiveQuery(
    () => db.layoutSettings.get('default'),
    [db],
    {
      ...DEFAULT_LAYOUT,
      ...localLayout,
    }
  )
  const effectiveLayout = useMemo(() => ({
    ...DEFAULT_LAYOUT,
    ...layout,
    ...localLayout,
  }), [layout, localLayout])

  const persistLayout = useCallback(async (partial: Partial<PersistedLayout>) => {
    const nextLayout: PersistedLayout = {
      ...effectiveLayout,
      ...partial,
    }

    writeLocalLayout(projectId, nextLayout)
    await db.layoutSettings.put(nextLayout)
  }, [db, effectiveLayout, projectId])

  // Auto-save sidebar width on change per D-25
  const saveSidebarWidth = useCallback(async (width: number) => {
    await persistLayout({ sidebarWidth: width })
  }, [persistLayout])

  // Auto-save active tab on change per D-14
  const saveActiveTab = useCallback(async (tab: ActiveTab) => {
    await persistLayout({ activeTab: tab })
  }, [persistLayout])

  // Auto-save chat panel width on change per D-12
  const saveChatPanelWidth = useCallback(async (width: number) => {
    await persistLayout({ chatPanelWidth: width })
  }, [persistLayout])

  const saveWorkspaceContext = useCallback(async (snapshot: WorkspaceContextSnapshot) => {
    await persistLayout(snapshot)
  }, [persistLayout])

  return {
    sidebarWidth: effectiveLayout.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH,
    activeTab: (effectiveLayout.activeTab ?? 'chapters') as ActiveTab,
    chatPanelWidth: effectiveLayout.chatPanelWidth ?? DEFAULT_CHAT_PANEL_WIDTH,
    activeChapterId: effectiveLayout.activeChapterId ?? null,
    chapterView: effectiveLayout.chapterView ?? 'editor',
    activeWorldEntryId: effectiveLayout.activeWorldEntryId ?? null,
    activePlanningSelection: effectiveLayout.activePlanningSelection ?? null,
    lastWorkspaceContext: effectiveLayout.lastWorkspaceContext ?? 'chapter',
    saveSidebarWidth,
    saveActiveTab,
    saveChatPanelWidth,
    saveWorkspaceContext,
  }
}
