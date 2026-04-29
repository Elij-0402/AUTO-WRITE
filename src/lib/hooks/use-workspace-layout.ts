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
  activeWorldEntryId?: string | null
  activePlanningItem?: PlanningSelection | null
}

interface SelectionUpdateOptions {
  syncTab?: boolean
}

function normalizePlanningSelection(selection: PlanningSelection | null | undefined): PlanningSelection | null {
  if (!selection) {
    return null
  }

  return selection.kind === 'idea' || selection.kind === 'arc' || selection.kind === 'chapter'
    ? selection
    : null
}

function readWorkspaceUrlState(): WorkspaceUrlState {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  const activePlanningKind = params.get('planningKind')
  const activePlanningId = params.get('planningId')

  return {
    activeTab: (params.get('tab') as ActiveTab | null) ?? undefined,
    activeChapterId: params.get('chapter'),
    activeWorldEntryId: params.get('entry'),
    activePlanningItem: normalizePlanningSelection(
      activePlanningKind && activePlanningId
        ? { kind: activePlanningKind as PlanningSelection['kind'], id: activePlanningId }
        : null
    ),
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
    chapterBriefOpen: persistedChapterBriefOpen,
    activeWorldEntryId: persistedActiveWorldEntryId,
    activePlanningSelection: persistedActivePlanningSelection,
    saveSidebarWidth,
    saveActiveTab,
    saveChatPanelWidth,
    saveWorkspaceContext,
  } = useLayout(projectId)

  const [activeTabState, setActiveTabState] = useState<ActiveTab>(urlState.activeTab ?? persistedActiveTab)
  const [activeChapterIdState, setActiveChapterIdState] = useState<string | null>(urlState.activeChapterId ?? persistedActiveChapterId)
  const [chapterBriefOpenState, setChapterBriefOpenState] = useState<boolean>(persistedChapterBriefOpen)
  const [activeWorldEntryIdState, setActiveWorldEntryIdState] = useState<string | null>(urlState.activeWorldEntryId ?? persistedActiveWorldEntryId)
  const [activePlanningItemState, setActivePlanningItemState] = useState<PlanningSelection | null>(
    urlState.activePlanningItem ?? normalizePlanningSelection(persistedActivePlanningSelection)
  )

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
    setChapterBriefOpenState(persistedChapterBriefOpen)
  }, [persistedChapterBriefOpen, projectId])

  useEffect(() => {
    setActiveWorldEntryIdState(urlState.activeWorldEntryId ?? persistedActiveWorldEntryId)
  }, [persistedActiveWorldEntryId, projectId, urlState.activeWorldEntryId])

  useEffect(() => {
    setActivePlanningItemState(urlState.activePlanningItem ?? normalizePlanningSelection(persistedActivePlanningSelection))
  }, [persistedActivePlanningSelection, projectId, urlState.activePlanningItem])

  const setActiveChapterId = useCallback((id: string | null, options: SelectionUpdateOptions = {}) => {
    const nextId = id || null
    const syncTab = options.syncTab ?? true
    setActiveChapterIdState(nextId)
    if (syncTab) {
      setActiveTabState('chapters')
    }
    writeWorkspaceUrlState(syncTab
      ? { activeChapterId: nextId, activeTab: 'chapters' }
      : { activeChapterId: nextId })
    void saveWorkspaceContext({
      activeChapterId: nextId,
      lastWorkspaceContext: nextId ? 'chapter' : undefined,
    })
  }, [saveWorkspaceContext])

  const setChapterBriefOpen = useCallback((open: boolean) => {
    setChapterBriefOpenState(open)
    setActiveTabState('chapters')
    writeWorkspaceUrlState({
      activeTab: 'chapters',
      activeChapterId: activeChapterIdState,
    })
    void saveWorkspaceContext({
      chapterBriefOpen: open,
      lastWorkspaceContext: activeChapterIdState ? 'chapter' : undefined,
    })
  }, [activeChapterIdState, saveWorkspaceContext])

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
  const currentChapterIndex = sortedChapters.findIndex(c => c.id === activeChapterIdState)

  const currentWorldEntry = entries?.find(e => e.id === activeWorldEntryIdState)
  const currentEntryType = currentWorldEntry?.type
  const sameTypeEntries = useMemo(
    (): WorldEntry[] => currentEntryType ? (entriesByType[currentEntryType] || []) : [],
    [currentEntryType, entriesByType]
  )
  const currentWorldIndex = sameTypeEntries.findIndex(e => e.id === activeWorldEntryIdState)

  const hasWorldPrevious = currentWorldIndex > 0
  const hasWorldNext = currentWorldIndex < sameTypeEntries.length - 1
  const hasPrevious = currentChapterIndex > 0
  const hasNext = currentChapterIndex < sortedChapters.length - 1 && currentChapterIndex !== -1

  const isEditorMain =
    Boolean(activeChapterIdState) &&
    !(activeTabState === 'world' && activeWorldEntryIdState)

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTabState(tab)
    writeWorkspaceUrlState({ activeTab: tab })
    void saveActiveTab(tab)
    if (tab === 'world') {
      setChapterBriefOpenState(false)
      void saveWorkspaceContext({ chapterBriefOpen: false })
    } else if (tab === 'planning') {
      setChapterBriefOpenState(false)
      void saveWorkspaceContext({ chapterBriefOpen: false })
      setActiveWorldEntryId(null, { syncTab: false })
    }
  }, [saveActiveTab, saveWorkspaceContext, setActiveWorldEntryId])

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
    setChapterBriefOpenState(false)
    void saveWorkspaceContext({ chapterBriefOpen: false })
    setActiveWorldEntryId(id)
  }, [addEntry, saveActiveTab, saveWorkspaceContext, setActiveWorldEntryId])

  const handleOutlinePrevious = useCallback(() => {
    if (currentChapterIndex > 0) setActiveChapterId(sortedChapters[currentChapterIndex - 1].id)
  }, [currentChapterIndex, setActiveChapterId, sortedChapters])

  const handleOutlineNext = useCallback(() => {
    if (currentChapterIndex < sortedChapters.length - 1 && currentChapterIndex !== -1) {
      setActiveChapterId(sortedChapters[currentChapterIndex + 1].id)
    }
  }, [currentChapterIndex, setActiveChapterId, sortedChapters])

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
        if (chapterBriefOpenState) setChapterBriefOpen(false)
        if (activeWorldEntryIdState) setActiveWorldEntryId(null)
      }

      const target = e.target as HTMLElement | null
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isEditable) return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (e.key === '1') { e.preventDefault(); handleTabChange('chapters') }
        else if (e.key === '2') { e.preventDefault(); handleTabChange('world') }
        else if (e.key === '3') { e.preventDefault(); handleTabChange('planning') }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeWorldEntryIdState, chapterBriefOpenState, handleTabChange, setActiveChapterId, setChapterBriefOpen, setActiveWorldEntryId])

  const handleSidebarDoubleClickReset = () => {
    import('@/components/workspace/resizable-panel').then(m => saveSidebarWidth(m.DEFAULT_SIDEBAR_WIDTH))
  }

  const handleChatPanelDoubleClickReset = () => {
    void saveChatPanelWidth(340)
  }

  return {
    activeChapterId: activeChapterIdState, setActiveChapterId,
    chapterBriefOpen: chapterBriefOpenState, setChapterBriefOpen,
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
