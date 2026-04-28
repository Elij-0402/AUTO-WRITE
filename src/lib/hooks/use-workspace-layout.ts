'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLayout } from './use-layout'
import { useChapters } from './use-chapters'
import { useWorldEntries } from './use-world-entries'
import { useIdleMode } from './use-idle-mode'
import type { ActiveTab } from './use-layout'
import type { PlanningSelection, WorldEntry } from '../types'

interface UseWorkspaceLayoutOptions {
  projectId: string
}

interface WorkspaceUrlState {
  activeTab?: ActiveTab
  activeChapterId?: string | null
  activeOutlineId?: string | null
  activeWorldEntryId?: string | null
  activePlanningItem?: PlanningSelection | null
}

interface SelectionUpdateOptions {
  syncTab?: boolean
}

function readWorkspaceUrlState(): WorkspaceUrlState {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  const activePlanningKind = params.get('planningKind')
  const activePlanningId = params.get('planningId')

  return {
    activeTab: (params.get('tab') as ActiveTab | null) ?? undefined,
    activeChapterId: params.get('chapter'),
    activeOutlineId: params.get('outline'),
    activeWorldEntryId: params.get('entry'),
    activePlanningItem:
      activePlanningKind && activePlanningId
        ? { kind: activePlanningKind as PlanningSelection['kind'], id: activePlanningId }
        : null,
  }
}

function writeWorkspaceUrlState(partial: WorkspaceUrlState): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  const assignParam = (key: string, value?: string | null) => {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }

  if ('activeTab' in partial) assignParam('tab', partial.activeTab)
  if ('activeChapterId' in partial) assignParam('chapter', partial.activeChapterId)
  if ('activeOutlineId' in partial) assignParam('outline', partial.activeOutlineId)
  if ('activeWorldEntryId' in partial) assignParam('entry', partial.activeWorldEntryId)
  if ('activePlanningItem' in partial) {
    assignParam('planningKind', partial.activePlanningItem?.kind)
    assignParam('planningId', partial.activePlanningItem?.id)
  }

  window.history.replaceState(window.history.state, '', url.toString())
}

export function useWorkspaceLayout({ projectId }: UseWorkspaceLayoutOptions) {
  const urlState = useMemo(() => readWorkspaceUrlState(), [])
  const {
    activeTab: persistedActiveTab,
    activeChapterId: persistedActiveChapterId,
    activeOutlineId: persistedActiveOutlineId,
    activeWorldEntryId: persistedActiveWorldEntryId,
    activePlanningSelection: persistedActivePlanningSelection,
    saveSidebarWidth,
    saveActiveTab,
    saveChatPanelWidth,
    saveWorkspaceContext,
  } = useLayout(projectId)

  const [activeTabState, setActiveTabState] = useState<ActiveTab>(urlState.activeTab ?? persistedActiveTab)
  const [activeChapterIdState, setActiveChapterIdState] = useState<string | null>(urlState.activeChapterId ?? persistedActiveChapterId)
  const [activeOutlineIdState, setActiveOutlineIdState] = useState<string | null>(urlState.activeOutlineId ?? persistedActiveOutlineId)
  const [activeWorldEntryIdState, setActiveWorldEntryIdState] = useState<string | null>(urlState.activeWorldEntryId ?? persistedActiveWorldEntryId)
  const [activePlanningItemState, setActivePlanningItemState] = useState<PlanningSelection | null>(urlState.activePlanningItem ?? persistedActivePlanningSelection)

  const { chapters, loading: chaptersLoading } = useChapters(projectId)
  const idle = useIdleMode()
  const { entries, entriesByType, addEntry } = useWorldEntries(projectId)

  useEffect(() => {
    setActiveTabState(urlState.activeTab ?? persistedActiveTab)
  }, [persistedActiveTab, projectId, urlState.activeTab])

  useEffect(() => {
    setActiveChapterIdState(urlState.activeChapterId ?? persistedActiveChapterId)
  }, [persistedActiveChapterId, projectId, urlState.activeChapterId])

  useEffect(() => {
    setActiveOutlineIdState(urlState.activeOutlineId ?? persistedActiveOutlineId)
  }, [persistedActiveOutlineId, projectId, urlState.activeOutlineId])

  useEffect(() => {
    setActiveWorldEntryIdState(urlState.activeWorldEntryId ?? persistedActiveWorldEntryId)
  }, [persistedActiveWorldEntryId, projectId, urlState.activeWorldEntryId])

  useEffect(() => {
    setActivePlanningItemState(urlState.activePlanningItem ?? persistedActivePlanningSelection)
  }, [persistedActivePlanningSelection, projectId, urlState.activePlanningItem])

  const setActiveChapterId = useCallback((id: string | null, options: SelectionUpdateOptions = {}) => {
    const nextId = id || null
    const syncTab = options.syncTab ?? true
    setActiveChapterIdState(nextId)
    if (syncTab) {
      setActiveTabState('chapters')
    }
    writeWorkspaceUrlState(syncTab ? { activeChapterId: nextId, activeTab: 'chapters' } : { activeChapterId: nextId })
    void saveWorkspaceContext({
      activeChapterId: nextId,
      lastWorkspaceContext: nextId ? 'chapter' : undefined,
    })
  }, [saveWorkspaceContext])

  const setActiveOutlineId = useCallback((id: string | null, options: SelectionUpdateOptions = {}) => {
    const nextId = id || null
    const syncTab = options.syncTab ?? true
    setActiveOutlineIdState(nextId)
    if (syncTab) {
      setActiveTabState('outline')
    }
    writeWorkspaceUrlState(syncTab ? { activeOutlineId: nextId, activeTab: 'outline' } : { activeOutlineId: nextId })
    void saveWorkspaceContext({
      activeOutlineId: nextId,
      lastWorkspaceContext: nextId ? 'outline' : undefined,
    })
  }, [saveWorkspaceContext])

  const setActiveWorldEntryId = useCallback((id: string | null, options: SelectionUpdateOptions = {}) => {
    const nextId = id || null
    const syncTab = options.syncTab ?? true
    setActiveWorldEntryIdState(nextId)
    if (syncTab) {
      setActiveTabState('world')
    }
    writeWorkspaceUrlState(syncTab ? { activeWorldEntryId: nextId, activeTab: 'world' } : { activeWorldEntryId: nextId })
    void saveWorkspaceContext({
      activeWorldEntryId: nextId,
      lastWorkspaceContext: nextId ? 'world' : undefined,
    })
  }, [saveWorkspaceContext])

  const setActivePlanningItem = useCallback((selection: PlanningSelection | null, options: SelectionUpdateOptions = {}) => {
    const syncTab = options.syncTab ?? true
    setActivePlanningItemState(selection)
    if (syncTab) {
      setActiveTabState('planning')
    }
    writeWorkspaceUrlState(syncTab ? { activePlanningItem: selection, activeTab: 'planning' } : { activePlanningItem: selection })
    void saveWorkspaceContext({
      activePlanningSelection: selection,
      lastWorkspaceContext: selection ? 'planning' : undefined,
    })
  }, [saveWorkspaceContext])

  const sortedChapters = chapters.filter(c => !c.deletedAt)
  const currentChapter = activeChapterIdState ? sortedChapters.find(c => c.id === activeChapterIdState) : undefined
  const currentChapterNumber = activeChapterIdState ? sortedChapters.findIndex(c => c.id === activeChapterIdState) + 1 : 0
  const currentOutlineIndex = sortedChapters.findIndex(c => c.id === activeOutlineIdState)

  const currentWorldEntry = entries?.find(e => e.id === activeWorldEntryIdState)
  const currentEntryType = currentWorldEntry?.type
  const sameTypeEntries = useMemo(
    (): WorldEntry[] => currentEntryType ? (entriesByType[currentEntryType] || []) : [],
    [currentEntryType, entriesByType]
  )
  const currentWorldIndex = sameTypeEntries.findIndex(e => e.id === activeWorldEntryIdState)

  const hasWorldPrevious = currentWorldIndex > 0
  const hasWorldNext = currentWorldIndex < sameTypeEntries.length - 1
  const hasPrevious = currentOutlineIndex > 0
  const hasNext = currentOutlineIndex < sortedChapters.length - 1 && currentOutlineIndex !== -1

  const isEditorMain =
    Boolean(activeChapterIdState) &&
    !(activeTabState === 'outline' && activeOutlineIdState) &&
    !(activeTabState === 'world' && activeWorldEntryIdState)

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTabState(tab)
    writeWorkspaceUrlState({ activeTab: tab })
    void saveActiveTab(tab)
    if (tab === 'chapters') setActiveOutlineId(null, { syncTab: false })
    else if (tab === 'outline') setActiveWorldEntryId(null, { syncTab: false })
    else if (tab === 'world') setActiveOutlineId(null, { syncTab: false })
    else if (tab === 'planning') {
      setActiveOutlineId(null, { syncTab: false })
      setActiveWorldEntryId(null, { syncTab: false })
    }
  }, [saveActiveTab, setActiveOutlineId, setActiveWorldEntryId])

  const handleSelectOutline = useCallback((chapterId: string) => {
    setActiveOutlineId(chapterId)
  }, [setActiveOutlineId])

  const handleSelectWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [setActiveWorldEntryId])

  const handleEditWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [setActiveWorldEntryId])

  const handleDeleteWorldEntry = useCallback((entryId: string) => {
    if (entryId === activeWorldEntryIdState) setActiveWorldEntryId(null)
  }, [activeWorldEntryIdState, setActiveWorldEntryId])

  const handleCreateWorldEntry = useCallback(async (type: import('../types').WorldEntryType) => {
    const id = await addEntry(type)
    void saveActiveTab('world')
    setActiveOutlineId(null)
    setActiveWorldEntryId(id)
  }, [addEntry, saveActiveTab, setActiveOutlineId, setActiveWorldEntryId])

  const handleOutlinePrevious = useCallback(() => {
    if (currentOutlineIndex > 0) setActiveOutlineId(sortedChapters[currentOutlineIndex - 1].id)
  }, [currentOutlineIndex, setActiveOutlineId, sortedChapters])

  const handleOutlineNext = useCallback(() => {
    if (currentOutlineIndex < sortedChapters.length - 1 && currentOutlineIndex !== -1) {
      setActiveOutlineId(sortedChapters[currentOutlineIndex + 1].id)
    }
  }, [currentOutlineIndex, setActiveOutlineId, sortedChapters])

  const handleWorldPrevious = useCallback(() => {
    if (currentWorldIndex > 0) setActiveWorldEntryId(sameTypeEntries[currentWorldIndex - 1].id)
  }, [currentWorldIndex, sameTypeEntries, setActiveWorldEntryId])

  const handleWorldNext = useCallback(() => {
    if (currentWorldIndex < sameTypeEntries.length - 1) {
      setActiveWorldEntryId(sameTypeEntries[currentWorldIndex + 1].id)
    }
  }, [currentWorldIndex, sameTypeEntries, setActiveWorldEntryId])

  useEffect(() => {
    if (activeTabState !== 'chapters') return
    if (chaptersLoading) return
    if (sortedChapters.length === 0) {
      if (activeChapterIdState !== null) setActiveChapterId(null)
      return
    }

    const hasActiveChapter = activeChapterIdState
      ? sortedChapters.some(chapter => chapter.id === activeChapterIdState)
      : false

    if (!hasActiveChapter) {
      setActiveChapterId(sortedChapters[0].id)
    }
  }, [activeChapterIdState, activeTabState, chaptersLoading, setActiveChapterId, sortedChapters])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeOutlineIdState) setActiveOutlineId(null)
        if (activeWorldEntryIdState) setActiveWorldEntryId(null)
      }

      const target = e.target as HTMLElement | null
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isEditable) return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (e.key === '1') { e.preventDefault(); handleTabChange('chapters') }
        else if (e.key === '2') { e.preventDefault(); handleTabChange('outline') }
        else if (e.key === '3') { e.preventDefault(); handleTabChange('world') }
        else if (e.key === '4') { e.preventDefault(); handleTabChange('planning') }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeOutlineIdState, activeWorldEntryIdState, handleTabChange, setActiveOutlineId, setActiveWorldEntryId])

  const handleSidebarDoubleClickReset = () => {
    import('@/components/workspace/resizable-panel').then(m => saveSidebarWidth(m.DEFAULT_SIDEBAR_WIDTH))
  }

  const handleChatPanelDoubleClickReset = () => {
    void saveChatPanelWidth(340)
  }

  return {
    activeChapterId: activeChapterIdState, setActiveChapterId,
    activeOutlineId: activeOutlineIdState, setActiveOutlineId,
    activeWorldEntryId: activeWorldEntryIdState, setActiveWorldEntryId,
    activePlanningItem: activePlanningItemState, setActivePlanningItem,
    activeTab: activeTabState,
    sortedChapters,
    currentChapter,
    currentChapterNumber,
    currentWorldEntry,
    sameTypeEntries,
    isEditorMain,
    entries,
    handleTabChange,
    handleSelectOutline,
    handleSelectWorldEntry,
    handleEditWorldEntry,
    handleDeleteWorldEntry,
    handleCreateWorldEntry,
    handleOutlinePrevious,
    handleOutlineNext,
    handleWorldPrevious,
    handleWorldNext,
    hasPrevious,
    hasNext,
    hasWorldPrevious,
    hasWorldNext,
    handleSidebarDoubleClickReset,
    handleChatPanelDoubleClickReset,
    projectId,
    saveChatPanelWidth,
    idle,
  }
}
