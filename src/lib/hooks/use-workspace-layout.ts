'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useLayout } from './use-layout'
import { useChapters } from './use-chapters'
import { useWorldEntries } from './use-world-entries'
import { useIdleMode } from './use-idle-mode'
import type { ActiveTab } from './use-layout'

interface UseWorkspaceLayoutOptions {
  projectId: string
}

export function useWorkspaceLayout({ projectId }: UseWorkspaceLayoutOptions) {
  const { activeTab, saveSidebarWidth, saveActiveTab, saveChatPanelWidth } = useLayout(projectId)

  // ── Selection state ──────────────────────────────────────────────
  const [focusMode, setFocusMode] = useState(false)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null)
  const [activeWorldEntryId, setActiveWorldEntryId] = useState<string | null>(null)
  const [wizardModeActive, setWizardModeActive] = useState(false)

  // ── Derived data ─────────────────────────────────────────────────
  const { chapters } = useChapters(projectId)
  const idle = useIdleMode()
  const { entries, entriesByType, addEntry } = useWorldEntries(projectId)

  const sortedChapters = chapters.filter(c => !c.deletedAt)
  const currentChapter = activeChapterId ? sortedChapters.find(c => c.id === activeChapterId) : undefined
  const currentChapterNumber = activeChapterId ? sortedChapters.findIndex(c => c.id === activeChapterId) + 1 : 0
  const currentOutlineIndex = sortedChapters.findIndex(c => c.id === activeOutlineId)

  const currentWorldEntry = entries?.find(e => e.id === activeWorldEntryId)
  const currentEntryType = currentWorldEntry?.type
  const sameTypeEntries = useMemo(
    () => currentEntryType ? (entriesByType[currentEntryType] || []) : [],
    [currentEntryType, entriesByType]
  )
  const currentWorldIndex = sameTypeEntries.findIndex(e => e.id === activeWorldEntryId)

  const hasWorldPrevious = currentWorldIndex > 0
  const hasWorldNext = currentWorldIndex < sameTypeEntries.length - 1
  const hasPrevious = currentOutlineIndex > 0
  const hasNext = currentOutlineIndex < sortedChapters.length - 1 && currentOutlineIndex !== -1

  const isEditorMain =
    Boolean(activeChapterId) &&
    !(activeTab === 'outline' && activeOutlineId) &&
    !(activeTab === 'world' && activeWorldEntryId)

  // ── Navigation handlers ───────────────────────────────────────────
  const handleTabChange = useCallback((tab: ActiveTab) => {
    saveActiveTab(tab)
    if (tab === 'chapters') setActiveOutlineId(null)
    else if (tab === 'outline') setActiveWorldEntryId(null)
    else if (tab === 'world') setActiveOutlineId(null)
  }, [saveActiveTab])

  const handleSelectOutline = useCallback((chapterId: string) => {
    setActiveOutlineId(chapterId)
  }, [])

  const handleSelectWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [])

  const handleEditWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [])

  const handleDeleteWorldEntry = useCallback((entryId: string) => {
    if (entryId === activeWorldEntryId) setActiveWorldEntryId(null)
  }, [activeWorldEntryId])

  const handleCreateWorldEntry = useCallback(async (type: import('../types').WorldEntryType) => {
    const id = await addEntry(type)
    saveActiveTab('world')
    setActiveOutlineId(null)
    setActiveWorldEntryId(id)
  }, [addEntry, saveActiveTab])

  const handleOutlinePrevious = useCallback(() => {
    if (currentOutlineIndex > 0) setActiveOutlineId(sortedChapters[currentOutlineIndex - 1].id)
  }, [currentOutlineIndex, sortedChapters])

  const handleOutlineNext = useCallback(() => {
    if (currentOutlineIndex < sortedChapters.length - 1 && currentOutlineIndex !== -1) {
      setActiveOutlineId(sortedChapters[currentOutlineIndex + 1].id)
    }
  }, [currentOutlineIndex, sortedChapters])

  const handleWorldPrevious = useCallback(() => {
    if (currentWorldIndex > 0) setActiveWorldEntryId(sameTypeEntries[currentWorldIndex - 1].id)
  }, [currentWorldIndex, sameTypeEntries])

  const handleWorldNext = useCallback(() => {
    if (currentWorldIndex < sameTypeEntries.length - 1) setActiveWorldEntryId(sameTypeEntries[currentWorldIndex + 1].id)
  }, [currentWorldIndex, sameTypeEntries])

  useEffect(() => {
    if (activeTab !== 'chapters') return
    if (sortedChapters.length === 0) {
      if (activeChapterId !== null) setActiveChapterId(null)
      return
    }

    const hasActiveChapter = activeChapterId
      ? sortedChapters.some(chapter => chapter.id === activeChapterId)
      : false

    if (!hasActiveChapter) {
      setActiveChapterId(sortedChapters[0].id)
    }
  }, [activeChapterId, activeTab, sortedChapters])

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeOutlineId) setActiveOutlineId(null)
        if (activeWorldEntryId) setActiveWorldEntryId(null)
      }

      const target = e.target as HTMLElement | null
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isEditable) return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (e.key === '1') { e.preventDefault(); handleTabChange('chapters') }
        else if (e.key === '2') { e.preventDefault(); handleTabChange('outline') }
        else if (e.key === '3') { e.preventDefault(); handleTabChange('world') }
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        setWizardModeActive(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeOutlineId, activeWorldEntryId, handleTabChange])

  // ── Layout helpers ───────────────────────────────────────────────
  const handleSidebarDoubleClickReset = () => {
    import('@/components/workspace/resizable-panel').then(m => saveSidebarWidth(m.DEFAULT_SIDEBAR_WIDTH))
  }

  const handleChatPanelDoubleClickReset = () => {
    saveChatPanelWidth(340)
  }

  return {
    // State
    focusMode, setFocusMode,
    activeChapterId, setActiveChapterId,
    activeOutlineId, setActiveOutlineId,
    activeWorldEntryId, setActiveWorldEntryId,
    wizardModeActive, setWizardModeActive,
    activeTab,
    // Derived
    sortedChapters,
    currentChapter,
    currentChapterNumber,
    currentWorldEntry,
    sameTypeEntries,
    isEditorMain,
    entries,
    // Navigation
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
    // Layout helpers
    handleSidebarDoubleClickReset,
    handleChatPanelDoubleClickReset,
    // Shared
    projectId,
    saveChatPanelWidth,
    idle,
  }
}
