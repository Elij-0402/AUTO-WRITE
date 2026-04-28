'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLayout } from './use-layout'
import { useChapters } from './use-chapters'
import { useWorldEntries } from './use-world-entries'
import { useIdleMode } from './use-idle-mode'
import type { ActiveTab, ChapterView } from './use-layout'
import type { PlanningSelection, WorldEntry } from '../types'

interface UseWorkspaceLayoutOptions {
  projectId: string
}

interface WorkspaceUrlState {
  activeTab?: ActiveTab
  activeChapterId?: string | null
  chapterView?: ChapterView
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
    chapterView: (params.get('view') as ChapterView | null) ?? undefined,
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
  if ('chapterView' in partial) assignParam('view', partial.chapterView && partial.chapterView !== 'editor' ? partial.chapterView : null)
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
    chapterView: persistedChapterView,
    activeWorldEntryId: persistedActiveWorldEntryId,
    activePlanningSelection: persistedActivePlanningSelection,
    saveSidebarWidth,
    saveActiveTab,
    saveChatPanelWidth,
    saveWorkspaceContext,
  } = useLayout(projectId)

  const [activeTabState, setActiveTabState] = useState<ActiveTab>(urlState.activeTab ?? persistedActiveTab)
  const [activeChapterIdState, setActiveChapterIdState] = useState<string | null>(urlState.activeChapterId ?? persistedActiveChapterId)
  const [chapterViewState, setChapterViewState] = useState<ChapterView>(urlState.chapterView ?? persistedChapterView)
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
    setChapterViewState(urlState.chapterView ?? persistedChapterView)
  }, [persistedChapterView, projectId, urlState.chapterView])

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
    writeWorkspaceUrlState(syncTab
      ? { activeChapterId: nextId, activeTab: 'chapters', chapterView: chapterViewState }
      : { activeChapterId: nextId })
    void saveWorkspaceContext({
      activeChapterId: nextId,
      lastWorkspaceContext: nextId ? 'chapter' : undefined,
    })
  }, [chapterViewState, saveWorkspaceContext])

  const setChapterView = useCallback((view: ChapterView) => {
    setChapterViewState(view)
    setActiveTabState('chapters')
    writeWorkspaceUrlState({
      activeTab: 'chapters',
      activeChapterId: activeChapterIdState,
      chapterView: view,
    })
    void saveWorkspaceContext({
      chapterView: view,
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
      setChapterViewState('editor')
      writeWorkspaceUrlState({ chapterView: 'editor' })
    } else if (tab === 'planning') {
      setChapterViewState('editor')
      writeWorkspaceUrlState({ chapterView: 'editor' })
      setActiveWorldEntryId(null, { syncTab: false })
    }
  }, [saveActiveTab, setActiveWorldEntryId])

  const handleSelectOutline = useCallback((chapterId: string) => {
    setActiveChapterId(chapterId)
    setChapterView('outline')
  }, [setActiveChapterId, setChapterView])

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
    setChapterViewState('editor')
    setActiveWorldEntryId(id)
  }, [addEntry, saveActiveTab, setActiveWorldEntryId])

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
        if (chapterViewState === 'outline') setChapterView('editor')
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
  }, [activeWorldEntryIdState, chapterViewState, handleTabChange, setActiveChapterId, setChapterView, setActiveWorldEntryId])

  const handleSidebarDoubleClickReset = () => {
    import('@/components/workspace/resizable-panel').then(m => saveSidebarWidth(m.DEFAULT_SIDEBAR_WIDTH))
  }

  const handleChatPanelDoubleClickReset = () => {
    void saveChatPanelWidth(340)
  }

  return {
    activeChapterId: activeChapterIdState, setActiveChapterId,
    chapterView: chapterViewState, setChapterView,
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
