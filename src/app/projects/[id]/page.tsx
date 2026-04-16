'use client'

import { useState, useCallback, useEffect, useRef, useMemo, type RefObject } from 'react'
import { useParams } from 'next/navigation'
import { Group, Panel, Separator } from '@/components/workspace/resizable-panel'
import { ChapterSidebar } from '@/components/chapter/chapter-sidebar'
import { OutlineEditForm } from '@/components/outline/outline-edit-form'
import { Editor } from '@/components/editor/editor'
import { FloatingToolbar } from '@/components/editor/floating-toolbar'
import { useChapterEditor } from '@/lib/hooks/use-chapter-editor'
import { ThemeProvider, useTheme } from '@/components/editor/theme-provider'
import { DEFAULT_SIDEBAR_WIDTH } from '@/components/workspace/resizable-panel'
import { useLayout } from '@/lib/hooks/use-layout'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { WorldEntryEditForm } from '@/components/world-bible/world-entry-edit-form'
import { AIChatPanel } from '@/components/workspace/ai-chat-panel'
import { AIConfigDialog } from '@/components/workspace/ai-config-dialog'
import { SyncStatusIcon } from '@/components/sync/SyncStatusIcon'
import type { ActiveTab } from '@/lib/hooks/use-layout'
import type { EditorHandle } from '@/components/editor/editor-types'

/** Default chat panel width per D-09 */
const DEFAULT_CHAT_PANEL_WIDTH = 300
/** Minimum chat panel width per D-09 */
const MIN_CHAT_PANEL_WIDTH = 280
/** Maximum chat panel width per D-09 */
const MAX_CHAT_PANEL_WIDTH = 500

/**
 * Project workspace page per D-04.
 * Four-panel layout: sidebar (3 tabs) + editor + AI chat panel per D-02, D-03.
 * Uses nested Group components for three-column layout per D-09.
 * Uses useLayout for per-project layout persistence per D-24, D-25, D-12.
 * Per D-13: tab switching between chapters and outline.
 * Per D-17: clicking outline entry shows outline editing form in editor area.
 *
 * Layout per D-09:
 * - Left sidebar: 280px default, min 200px, max 400px
 * - Editor: flex-1 (takes remaining space)
 * - Right chat panel: 320px default, min 280px, max 500px
 *
 * Theme per D-28 to D-33:
 * - ThemeProvider wraps content for theme switching
 * - Theme toggle button in top bar area per D-29
 */
export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  // Per D-14: active tab persists via useLayout
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null)
  // World bible state per D-13
  const [activeWorldEntryId, setActiveWorldEntryId] = useState<string | null>(null)
  // AI config dialog state
  const [aiConfigOpen, setAiConfigOpen] = useState(false)
  // Editor ref for draft insertion per AI-03
  const editorRef = useRef<EditorHandle>(null)
  // Ref to the editor content div for text selection tracking
  const editorContentRef = useRef<HTMLDivElement>(null)
  // Selected text for AI discussion per D-08
  const [selectedText, setSelectedText] = useState<string | null>(null)

  // Layout persistence per D-24, D-25, D-14, D-12
  const { activeTab, saveSidebarWidth, saveActiveTab, saveChatPanelWidth } = useLayout(params.id)

  // Chapters data for outline prev/next navigation per D-20
  const { chapters } = useChapters(params.id)

  // World entries data for prev/next navigation per D-19
  const { entries, entriesByType } = useWorldEntries(params.id)

  // Per D-18: sidebar stays visible when editing outline
  // Per D-17: clicking outline entry sets editingOutlineId
  const handleSelectOutline = useCallback((chapterId: string) => {
    setActiveOutlineId(chapterId)
  }, [])

  // Per D-13: world bible entry selection
  const handleSelectWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [])

  const handleEditWorldEntry = useCallback((entryId: string) => {
    // Direct edit mode on selection per D-14
    setActiveWorldEntryId(entryId)
  }, [])

  const handleCreateWorldEntry = useCallback((_type: import('@/lib/types').WorldEntryType) => {
    // Entry creation will be handled via WorldBibleTab's internal logic
    // This callback is for parent-level handling if needed
  }, [])

  const handleDeleteWorldEntry = useCallback((entryId: string) => {
    // Deletion confirmation handled by WorldBibleTab
    // Clear selection if deleting the active entry
    if (entryId === activeWorldEntryId) {
      setActiveWorldEntryId(null)
    }
  }, [activeWorldEntryId])

  // Per D-13: instant tab switching, no animation
  const handleTabChange = useCallback((tab: ActiveTab) => {
    saveActiveTab(tab)
    // When switching away from tabs, clear the editing state
    if (tab === 'chapters') {
      setActiveOutlineId(null)
    } else if (tab === 'outline') {
      setActiveWorldEntryId(null)
    } else if (tab === 'world') {
      setActiveOutlineId(null)
    }
  }, [saveActiveTab])

  // Per D-20: Previous/Next navigation in outline editing
  const sortedChapters = chapters.filter(c => !c.deletedAt)
  const currentOutlineIndex = sortedChapters.findIndex(c => c.id === activeOutlineId)
  const handleOutlinePrevious = useCallback(() => {
    if (currentOutlineIndex > 0) {
      setActiveOutlineId(sortedChapters[currentOutlineIndex - 1].id)
    }
  }, [currentOutlineIndex, sortedChapters])

  const handleOutlineNext = useCallback(() => {
    if (currentOutlineIndex < sortedChapters.length - 1 && currentOutlineIndex !== -1) {
      setActiveOutlineId(sortedChapters[currentOutlineIndex + 1].id)
    }
  }, [currentOutlineIndex, sortedChapters])

  // World entry prev/next navigation per D-19
  const currentWorldEntry = entries?.find(e => e.id === activeWorldEntryId)
  const currentEntryType = currentWorldEntry?.type
  const sameTypeEntries = useMemo(
    () => currentEntryType ? entriesByType[currentEntryType] || [] : [],
    [currentEntryType, entriesByType]
  )
  const currentWorldIndex = sameTypeEntries.findIndex(e => e.id === activeWorldEntryId)
  const hasWorldPrevious = currentWorldIndex > 0
  const hasWorldNext = currentWorldIndex < sameTypeEntries.length - 1

  const handleWorldPrevious = useCallback(() => {
    if (currentWorldIndex > 0) {
      setActiveWorldEntryId(sameTypeEntries[currentWorldIndex - 1].id)
    }
  }, [currentWorldIndex, sameTypeEntries])

  const handleWorldNext = useCallback(() => {
    if (currentWorldIndex < sameTypeEntries.length - 1) {
      setActiveWorldEntryId(sameTypeEntries[currentWorldIndex + 1].id)
    }
  }, [currentWorldIndex, sameTypeEntries])

  // Escape key to close outline or world bible editing form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeOutlineId) {
          setActiveOutlineId(null)
        }
        if (activeWorldEntryId) {
          setActiveWorldEntryId(null)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeOutlineId, activeWorldEntryId])

  // Handle sidebar resize end — persists new width per D-25
  const handleSidebarDoubleClickReset = () => {
    saveSidebarWidth(DEFAULT_SIDEBAR_WIDTH)
  }

  const handleChatPanelDoubleClickReset = () => {
    saveChatPanelWidth(DEFAULT_CHAT_PANEL_WIDTH)
  }

  // Draft insertion callback per AI-03
  const handleInsertDraft = useCallback((content: string) => {
    editorRef.current?.insertText(content)
  }, [])

  // Handle text selection for discussion per D-02, D-08
  const handleDiscuss = useCallback((text: string) => {
    setSelectedText(text)
  }, [])

  // Determine main content per D-17:
  // When editing outline → OutlineEditForm
  // When editing chapter → Editor
  // When nothing selected → Placeholder
  const hasPrevious = currentOutlineIndex > 0
  const hasNext = currentOutlineIndex < sortedChapters.length - 1 && currentOutlineIndex !== -1

  const mainContent =
    activeTab === 'outline' && activeOutlineId ? (
      <OutlineEditForm
        projectId={params.id}
        chapterId={activeOutlineId}
        onPrevious={handleOutlinePrevious}
        onNext={handleOutlineNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    ) : activeTab === 'world' && activeWorldEntryId ? (
      <WorldEntryEditForm
        projectId={params.id}
        entryId={activeWorldEntryId}
        onPrevious={handleWorldPrevious}
        onNext={handleWorldNext}
        hasPrevious={hasWorldPrevious}
        hasNext={hasWorldNext}
        onSelectEntry={handleSelectWorldEntry}
        allEntries={entries || []}
      />
    ) : activeChapterId ? (
      <EditorWithStatus projectId={params.id} chapterId={activeChapterId} editorRef={editorRef} editorContentRef={editorContentRef} onDiscuss={handleDiscuss} />
    ) : (
      <Placeholder activeTab={activeTab} />
    )

  return (
    <ThemeProvider>
      {/* AI Config Dialog */}
      <AIConfigDialog
        projectId={params.id}
        open={aiConfigOpen}
        onClose={() => setAiConfigOpen(false)}
      />

      {/* Top bar with AI settings, focus mode, theme toggle, and sync status */}
      <div className="h-12 border-b border-border-subtle glass-panel flex items-center justify-end px-4 gap-3">
        <SyncStatusIcon />
        <button
          onClick={() => setAiConfigOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-tertiary hover:text-foreground"
          title="AI 设置"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <FocusModeToggle focusMode={focusMode} onToggle={() => setFocusMode(!focusMode)} />
        <ThemeToggle />
      </div>

      {/* Four-panel workspace layout: sidebar | (editor | chat panel) per D-02, D-03, D-09 */}
      {focusMode ? (
        /* Focus mode: editor only, with chapter title context */
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeChapterId && (
            <div className="px-4 py-1.5 border-b border-border-subtle text-xs text-text-muted text-center">
              {sortedChapters.find(c => c.id === activeChapterId)?.title || ''}
            </div>
          )}
          {mainContent}
        </div>
      ) : (
        /* Full four-panel layout using nested Group per D-09 */
        <Group orientation="horizontal" className="flex-1 flex overflow-hidden">
          {/* Left sidebar panel per D-09 */}
          <Panel
            id="sidebar"
            defaultSize={DEFAULT_SIDEBAR_WIDTH}
            minSize={200}
            maxSize={400}
            groupResizeBehavior="preserve-pixel-size"
          >
            <div className="h-full flex flex-col overflow-hidden">
              <ChapterSidebar
                projectId={params.id}
                activeChapterId={activeChapterId}
                onSelectChapter={setActiveChapterId}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                activeOutlineId={activeOutlineId}
                onSelectOutline={handleSelectOutline}
                activeWorldEntryId={activeWorldEntryId}
                onSelectWorldEntry={handleSelectWorldEntry}
                onEditWorldEntry={handleEditWorldEntry}
                onDeleteWorldEntry={handleDeleteWorldEntry}
                onCreateWorldEntry={handleCreateWorldEntry}
              />
            </div>
          </Panel>

          {/* Sidebar resize handle */}
          <Separator
            onDoubleClick={handleSidebarDoubleClickReset}
            className="group relative flex items-center justify-center w-1 shrink-0 cursor-col-resize"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/5 group-active:bg-primary/10 transition-colors" />
            <div className="w-px h-full bg-border-subtle group-hover:bg-primary/50 group-active:bg-primary/70 transition-colors" />
          </Separator>

          {/* Right side: editor + chat panel, wrapped in a Panel with minSize to prevent collapse */}
          <Panel id="editor-chat" minSize={500} groupResizeBehavior="preserve-relative-size">
          <Group orientation="horizontal" className="h-full overflow-hidden">
            {/* Editor panel (flex-1) */}
            <Panel id="editor" groupResizeBehavior="preserve-relative-size">
              <div className="h-full flex flex-col overflow-hidden">
                {mainContent}
              </div>
            </Panel>

            {/* Editor/Chat resize handle */}
            <Separator
              onDoubleClick={handleChatPanelDoubleClickReset}
              className="group relative flex items-center justify-center w-1 shrink-0 cursor-col-resize"
            >
              <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/5 group-active:bg-primary/10 transition-colors" />
              <div className="w-px h-full bg-border-subtle group-hover:bg-primary/50 group-active:bg-primary/70 transition-colors" />
            </Separator>

            {/* AI Chat panel per D-09 */}
            <Panel
              id="chat"
              defaultSize={DEFAULT_CHAT_PANEL_WIDTH}
              minSize={MIN_CHAT_PANEL_WIDTH}
              maxSize={MAX_CHAT_PANEL_WIDTH}
              groupResizeBehavior="preserve-pixel-size"
            >
              <AIChatPanel projectId={params.id} onInsertDraft={handleInsertDraft} selectedText={selectedText} onDiscussComplete={() => setSelectedText(null)} />
            </Panel>
          </Group>
          </Panel>
        </Group>
      )}
    </ThemeProvider>
  )
}

/**
 * Focus mode toggle button per D-09:
 * Hides the chapter sidebar for distraction-free writing.
 * Icon: expand arrows or "⇱" symbol.
 */
function FocusModeToggle({ focusMode, onToggle }: { focusMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg transition-colors ${
        focusMode
          ? 'bg-primary-muted text-primary'
          : 'hover:bg-surface-hover text-text-tertiary hover:text-foreground'
      }`}
      title={focusMode ? '退出聚焦模式' : '进入聚焦模式'}
    >
      {focusMode ? (
        // Compress/grid icon - indicates exit focus mode
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        </svg>
      ) : (
        // Expand icon - indicates enter focus mode
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      )}
    </button>
  )
}

/**
 * Theme toggle button per D-29:
 * Shows sun icon for light mode, moon icon for dark mode
 * Clicking cycles: system → light → dark → system (or just toggles light/dark)
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
      title={resolvedTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
    >
      {resolvedTheme === 'dark' ? (
        // Sun icon for light mode switch
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon for dark mode switch
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

/**
 * Editor wrapper that includes save status display per D-05.
 * "保存中..." when isSaving is true, "已保存" when false.
 * Light gray text, small font, positioned bottom-right of editor area.
 */
function EditorWithStatus({ projectId, chapterId, editorRef, editorContentRef, onDiscuss }: { 
  projectId: string; 
  chapterId: string; 
  editorRef: RefObject<EditorHandle | null>
  editorContentRef: RefObject<HTMLDivElement | null>
  onDiscuss: (text: string) => void
}) {
  const { content, isSaving, updateContent } = useChapterEditor(projectId, chapterId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <FloatingToolbar onDiscuss={onDiscuss} editorRef={editorContentRef} />
      <Editor
        ref={editorRef}
        content={content}
        onChange={updateContent}
        className="flex-1"
      />
      <div className="text-xs text-text-tertiary p-2 text-right">
        {isSaving ? '保存中...' : '已保存'}
      </div>
    </div>
  )
}

/**
 * Placeholder shown when no chapter is selected.
 * Per D-17: shows appropriate message based on active tab.
 */
function Placeholder({ activeTab }: { activeTab: ActiveTab }) {
  return (
    <div className="flex-1 flex items-center justify-center text-text-tertiary">
      <div className="text-center">
        {activeTab === 'outline' ? (
          <>
            <p className="text-lg mb-1">选择一个章节查看大纲</p>
            <p className="text-sm text-text-muted">从左侧大纲列表中选择章节</p>
          </>
        ) : activeTab === 'world' ? (
          <>
            <p className="text-lg mb-1">选择一个世界观条目</p>
            <p className="text-sm text-text-muted">从左侧世界观列表中选择条目或创建新条目</p>
          </>
        ) : (
          <>
            <p className="text-lg mb-1">选择一个章节开始写作</p>
            <p className="text-sm text-text-muted">从左侧章节列表中选择或创建章节</p>
          </>
        )}
      </div>
    </div>
  )
}