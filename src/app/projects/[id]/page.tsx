'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ChapterSidebar } from '@/components/chapter/chapter-sidebar'
import { Editor } from '@/components/editor/editor'
import { useChapterEditor } from '@/lib/hooks/use-chapter-editor'
import { ThemeProvider, useTheme } from '@/components/editor/theme-provider'
import { ResizablePanelGroup, DEFAULT_SIDEBAR_WIDTH } from '@/components/workspace/resizable-panel'
import { useLayout } from '@/lib/hooks/use-layout'

/**
 * Project workspace page per D-04.
 * Renders ChapterSidebar in sidebar area, editor in main area.
 * Uses ResizablePanelGroup for drag-to-resize sidebar per D-01.
 * Uses useLayout for per-project layout persistence per D-24, D-25.
 * 
 * Layout per D-01, D-04, D-05:
 * - Editor does NOT display chapter title (title only in sidebar)
 * - Save status displayed in editor bottom bar ("保存中..." / "已保存")
 * 
 * Theme per D-28 to D-33:
 * - ThemeProvider wraps content for theme switching
 * - Theme toggle button in top bar area per D-29
 */
export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)

  // Layout persistence per D-24, D-25
  const { sidebarWidth, saveSidebarWidth } = useLayout(params.id)

  // Handle resize end — persists new width per D-25
  const handleResizeEnd = (newWidth: number) => {
    saveSidebarWidth(newWidth)
  }

  // Handle double-click reset — resets to default 280px per D-03
  const handleDoubleClickReset = () => {
    saveSidebarWidth(DEFAULT_SIDEBAR_WIDTH)
  }

  return (
    <ThemeProvider>
      {/* Top bar with theme toggle and focus mode */}
      <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-end px-4 gap-2">
        <FocusModeToggle focusMode={focusMode} onToggle={() => setFocusMode(!focusMode)} />
        <ThemeToggle />
      </div>

      <ResizablePanelGroup
        sidebarWidth={sidebarWidth}
        onResizeEnd={handleResizeEnd}
        onDoubleClickReset={handleDoubleClickReset}
        showSidebar={!focusMode}
        sidebarContent={
          <ChapterSidebar
            projectId={params.id}
            activeChapterId={activeChapterId}
            onSelectChapter={setActiveChapterId}
          />
        }
        mainContent={
          activeChapterId ? (
            <EditorWithStatus projectId={params.id} chapterId={activeChapterId} />
          ) : (
            <Placeholder />
          )
        }
      />
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
          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
      }`}
      title={focusMode ? '退出聚焦模式' : '进入聚焦模式'}
    >
      {focusMode ? (
        // Compress icon - indicates exit focus mode
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      ) : (
        // Expand icon - indicates enter focus mode
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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
      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
function EditorWithStatus({ projectId, chapterId }: { projectId: string; chapterId: string }) {
  const { content, isSaving, updateContent } = useChapterEditor(projectId, chapterId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Editor
        content={content}
        onChange={updateContent}
        className="flex-1"
      />
      <div className="text-xs text-zinc-400 p-2 text-right dark:text-zinc-500">
        {isSaving ? '保存中...' : '已保存'}
      </div>
    </div>
  )
}

/**
 * Placeholder shown when no chapter is selected.
 */
function Placeholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
      <div className="text-center">
        <p className="text-lg mb-1">选择一个章节开始写作</p>
        <p className="text-sm text-zinc-300 dark:text-zinc-600">从左侧章节列表中选择或创建章节</p>
      </div>
    </div>
  )
}