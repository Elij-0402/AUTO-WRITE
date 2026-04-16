'use client'

import { useState, useCallback, useEffect, useRef, useMemo, type RefObject } from 'react'
import { useParams } from 'next/navigation'
import { Group, Panel, Separator as PanelSeparator } from '@/components/workspace/resizable-panel'
import { ChapterSidebar } from '@/components/chapter/chapter-sidebar'
import { OutlineEditForm } from '@/components/outline/outline-edit-form'
import { Editor } from '@/components/editor/editor'
import { FloatingToolbar } from '@/components/editor/floating-toolbar'
import { useChapterEditor } from '@/lib/hooks/use-chapter-editor'
import { ThemeProvider } from '@/components/editor/theme-provider'
import { DEFAULT_SIDEBAR_WIDTH } from '@/components/workspace/resizable-panel'
import { useLayout } from '@/lib/hooks/use-layout'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { WorldEntryEditForm } from '@/components/world-bible/world-entry-edit-form'
import { AIChatPanel } from '@/components/workspace/ai-chat-panel'
import { AIConfigDialog } from '@/components/workspace/ai-config-dialog'
import { WorkspaceTopbar } from '@/components/workspace/workspace-topbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ActiveTab } from '@/lib/hooks/use-layout'
import type { EditorHandle } from '@/components/editor/editor-types'

const DEFAULT_CHAT_PANEL_WIDTH = 300
const MIN_CHAT_PANEL_WIDTH = 280
const MAX_CHAT_PANEL_WIDTH = 500

export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null)
  const [activeWorldEntryId, setActiveWorldEntryId] = useState<string | null>(null)
  const [aiConfigOpen, setAiConfigOpen] = useState(false)
  const editorRef = useRef<EditorHandle>(null)
  const editorContentRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)

  const { activeTab, saveSidebarWidth, saveActiveTab, saveChatPanelWidth } = useLayout(params.id)
  const { chapters } = useChapters(params.id)
  const { entries, entriesByType } = useWorldEntries(params.id)

  const handleSelectOutline = useCallback((chapterId: string) => {
    setActiveOutlineId(chapterId)
  }, [])

  const handleSelectWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [])

  const handleEditWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [])

  const handleCreateWorldEntry = useCallback((_type: import('@/lib/types').WorldEntryType) => {}, [])

  const handleDeleteWorldEntry = useCallback((entryId: string) => {
    if (entryId === activeWorldEntryId) {
      setActiveWorldEntryId(null)
    }
  }, [activeWorldEntryId])

  const handleTabChange = useCallback((tab: ActiveTab) => {
    saveActiveTab(tab)
    if (tab === 'chapters') {
      setActiveOutlineId(null)
    } else if (tab === 'outline') {
      setActiveWorldEntryId(null)
    } else if (tab === 'world') {
      setActiveOutlineId(null)
    }
  }, [saveActiveTab])

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

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const target = e.target as HTMLElement | null
        const isEditable =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable
        if (isEditable) return

        if (e.key === '1') {
          e.preventDefault()
          handleTabChange('chapters')
        } else if (e.key === '2') {
          e.preventDefault()
          handleTabChange('outline')
        } else if (e.key === '3') {
          e.preventDefault()
          handleTabChange('world')
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeOutlineId, activeWorldEntryId, handleTabChange])

  const handleSidebarDoubleClickReset = () => {
    saveSidebarWidth(DEFAULT_SIDEBAR_WIDTH)
  }

  const handleChatPanelDoubleClickReset = () => {
    saveChatPanelWidth(DEFAULT_CHAT_PANEL_WIDTH)
  }

  const handleInsertDraft = useCallback((content: string) => {
    editorRef.current?.insertText(content)
  }, [])

  const handleDiscuss = useCallback((text: string) => {
    setSelectedText(text)
  }, [])

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
      <TooltipProvider delayDuration={300}>
        <AIConfigDialog
          projectId={params.id}
          open={aiConfigOpen}
          onClose={() => setAiConfigOpen(false)}
        />

        <WorkspaceTopbar
          projectId={params.id}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode(!focusMode)}
          onOpenAIConfig={() => setAiConfigOpen(true)}
        />

        {focusMode ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeChapterId && (
              <div className="px-4 py-1.5 border-b text-xs text-muted-foreground text-center">
                {sortedChapters.find(c => c.id === activeChapterId)?.title || ''}
              </div>
            )}
            {mainContent}
          </div>
        ) : (
          <Group orientation="horizontal" className="flex-1 flex overflow-hidden">
            <Panel
              id="sidebar"
              defaultSize={DEFAULT_SIDEBAR_WIDTH}
              minSize={200}
              maxSize={400}
              groupResizeBehavior="preserve-pixel-size"
            >
              <div className="h-full flex flex-col overflow-hidden border-r">
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

            <PanelSeparator
              onDoubleClick={handleSidebarDoubleClickReset}
              className="group relative flex items-center justify-center w-1 shrink-0 cursor-col-resize"
            >
              <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/10 group-active:bg-primary/20 transition-colors" />
            </PanelSeparator>

            <Panel id="editor-chat" minSize={500} groupResizeBehavior="preserve-relative-size">
              <Group orientation="horizontal" className="h-full overflow-hidden">
                <Panel id="editor" groupResizeBehavior="preserve-relative-size">
                  <div className="h-full flex flex-col overflow-hidden">
                    {mainContent}
                  </div>
                </Panel>

                <PanelSeparator
                  onDoubleClick={handleChatPanelDoubleClickReset}
                  className="group relative flex items-center justify-center w-1 shrink-0 cursor-col-resize"
                >
                  <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/10 group-active:bg-primary/20 transition-colors" />
                </PanelSeparator>

                <Panel
                  id="chat"
                  defaultSize={DEFAULT_CHAT_PANEL_WIDTH}
                  minSize={MIN_CHAT_PANEL_WIDTH}
                  maxSize={MAX_CHAT_PANEL_WIDTH}
                  groupResizeBehavior="preserve-pixel-size"
                >
                  <div className="h-full border-l">
                    <AIChatPanel projectId={params.id} onInsertDraft={handleInsertDraft} selectedText={selectedText} onDiscussComplete={() => setSelectedText(null)} />
                  </div>
                </Panel>
              </Group>
            </Panel>
          </Group>
        )}
      </TooltipProvider>
    </ThemeProvider>
  )
}

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
      <div className="text-xs text-muted-foreground px-4 py-1.5 text-right border-t">
        {isSaving ? '保存中...' : '已保存'}
      </div>
    </div>
  )
}

function Placeholder({ activeTab }: { activeTab: ActiveTab }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        {activeTab === 'outline' ? (
          <>
            <p className="text-base text-foreground mb-1">选择一个章节查看大纲</p>
            <p className="text-sm text-muted-foreground">从左侧大纲列表中选择章节</p>
          </>
        ) : activeTab === 'world' ? (
          <>
            <p className="text-base text-foreground mb-1">选择一个世界观条目</p>
            <p className="text-sm text-muted-foreground">从左侧世界观列表中选择条目或创建新条目</p>
          </>
        ) : (
          <>
            <p className="text-base text-foreground mb-1">选择一个章节开始写作</p>
            <p className="text-sm text-muted-foreground">从左侧章节列表中选择或创建章节</p>
          </>
        )}
      </div>
    </div>
  )
}
