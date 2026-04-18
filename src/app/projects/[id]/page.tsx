'use client'

import { useState, useCallback, useEffect, useRef, useMemo, type RefObject } from 'react'
import { useParams } from 'next/navigation'
import { Group, Panel, Separator as PanelSeparator } from '@/components/workspace/resizable-panel'
import { ChapterSidebar } from '@/components/chapter/chapter-sidebar'
import { OutlineEditForm } from '@/components/outline/outline-edit-form'
import { Editor } from '@/components/editor/editor'
import { FloatingToolbar } from '@/components/editor/floating-toolbar'
import { HistoryDrawer } from '@/components/editor/history-drawer'
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
import { PanelErrorBoundary } from '@/components/workspace/error-boundary'
import { GenerationDrawer } from '@/components/workspace/generation-drawer'
import { GenerationButton } from '@/components/workspace/generation-button'
import { useChapterGeneration } from '@/lib/hooks/use-chapter-generation'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProjectSettingsForm } from '@/components/project/project-settings-form'
import { useProjects } from '@/lib/hooks/use-projects'
import { Clock, BookOpen, ListTree, Globe2 } from 'lucide-react'
import type { ActiveTab } from '@/lib/hooks/use-layout'
import type { EditorHandle } from '@/components/editor/editor-types'

const DEFAULT_CHAT_PANEL_WIDTH = 340
const MIN_CHAT_PANEL_WIDTH = 300
const MAX_CHAT_PANEL_WIDTH = 520

export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null)
  const [activeWorldEntryId, setActiveWorldEntryId] = useState<string | null>(null)
  const [aiConfigOpen, setAiConfigOpen] = useState(false)
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false)
  const editorRef = useRef<EditorHandle>(null)
  const editorContentRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [generationDrawerOpen, setGenerationDrawerOpen] = useState(false)

  const { activeTab, saveSidebarWidth, saveActiveTab, saveChatPanelWidth } = useLayout(params.id)
  const { chapters } = useChapters(params.id)
  const { entries, entriesByType, addEntry } = useWorldEntries(params.id)
  const { projects, updateProject } = useProjects()
  const currentProject = projects.find((p) => p.id === params.id)
  const generation = useChapterGeneration(params.id, activeChapterId ?? '')

  const handleSelectOutline = useCallback((chapterId: string) => {
    setActiveOutlineId(chapterId)
  }, [])

  const handleSelectWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [])

  const handleEditWorldEntry = useCallback((entryId: string) => {
    setActiveWorldEntryId(entryId)
  }, [])

  const handleCreateWorldEntry = useCallback(async (type: import('@/lib/types').WorldEntryType) => {
    const id = await addEntry(type)
    saveActiveTab('world')
    setActiveOutlineId(null)
    setActiveWorldEntryId(id)
  }, [addEntry, saveActiveTab])

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
      <EditorWithStatus projectId={params.id} chapterId={activeChapterId} editorRef={editorRef} editorContentRef={editorContentRef} onDiscuss={handleDiscuss} onOpenGenerationDrawer={() => setGenerationDrawerOpen(true)} generation={generation} />
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
          onOpenProjectSettings={() => setProjectSettingsOpen(true)}
        />

        <Dialog open={projectSettingsOpen} onOpenChange={setProjectSettingsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl tracking-wide">
                项目设置
              </DialogTitle>
            </DialogHeader>
            {currentProject && (
              <ProjectSettingsForm
                project={currentProject}
                onSave={async (data) => {
                  await updateProject(currentProject.id, data)
                  setProjectSettingsOpen(false)
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <GenerationDrawer
          open={generationDrawerOpen}
          onClose={() => setGenerationDrawerOpen(false)}
          onAccept={async () => {
            if (editorRef.current) {
              editorRef.current.insertText(generation.streamingContent)
            }
            setGenerationDrawerOpen(false)
            generation.resetGeneration()
          }}
          onRegenerate={() => generation.startGeneration()}
          streamingContent={generation.streamingContent}
          status={generation.status}
          error={generation.error}
        />

        <div
          className={`flex-1 flex overflow-hidden transition-[opacity] duration-[var(--dur-slow)] ease-[cubic-bezier(0.16,1,0.3,1)]`}
        >
        {focusMode ? (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            {activeChapterId && (
              <div className="px-4 py-1.5 divider-hair text-[11px] text-muted-foreground text-center uppercase tracking-[0.2em]">
                {sortedChapters.find(c => c.id === activeChapterId)?.title || ''}
              </div>
            )}
            <PanelErrorBoundary label="编辑器">{mainContent}</PanelErrorBoundary>
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
              <div className="h-full flex flex-col overflow-hidden surface-1">
                <PanelErrorBoundary label="侧边栏">
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
                </PanelErrorBoundary>
              </div>
            </Panel>

            <PanelSeparator
              onDoubleClick={handleSidebarDoubleClickReset}
              className="group relative flex items-center justify-center w-px shrink-0 cursor-col-resize bg-[hsl(var(--border))]"
            >
              <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
              <div className="absolute inset-y-0 left-0 w-px group-hover:w-[3px] group-hover:bg-[hsl(var(--accent-amber))] group-active:bg-[hsl(var(--accent-amber))] transition-[width,background-color] duration-150" />
            </PanelSeparator>

            <Panel id="editor-chat" minSize={500} groupResizeBehavior="preserve-relative-size">
              <Group orientation="horizontal" className="h-full overflow-hidden">
                <Panel id="editor" groupResizeBehavior="preserve-relative-size">
                  <div className="h-full flex flex-col overflow-hidden surface-0">
                    <PanelErrorBoundary label="编辑器">{mainContent}</PanelErrorBoundary>
                  </div>
                </Panel>

                <PanelSeparator
                  onDoubleClick={handleChatPanelDoubleClickReset}
                  className="group relative flex items-center justify-center w-px shrink-0 cursor-col-resize bg-[hsl(var(--border))]"
                >
                  <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
                  <div className="absolute inset-y-0 left-0 w-px group-hover:w-[3px] group-hover:bg-[hsl(var(--accent-amber))] group-active:bg-[hsl(var(--accent-amber))] transition-[width,background-color] duration-150" />
                </PanelSeparator>

                <Panel
                  id="chat"
                  defaultSize={DEFAULT_CHAT_PANEL_WIDTH}
                  minSize={MIN_CHAT_PANEL_WIDTH}
                  maxSize={MAX_CHAT_PANEL_WIDTH}
                  groupResizeBehavior="preserve-pixel-size"
                >
                  <div className="h-full">
                    <PanelErrorBoundary label="AI 对话">
                      <AIChatPanel projectId={params.id} onInsertDraft={handleInsertDraft} selectedText={selectedText} onDiscussComplete={() => setSelectedText(null)} />
                    </PanelErrorBoundary>
                  </div>
                </Panel>
              </Group>
            </Panel>
          </Group>
        )}
        </div>
      </TooltipProvider>
    </ThemeProvider>
  )
}

function EditorWithStatus({ projectId, chapterId, editorRef, editorContentRef, onDiscuss, onOpenGenerationDrawer, generation }: {
  projectId: string;
  chapterId: string;
  editorRef: RefObject<EditorHandle | null>
  editorContentRef: RefObject<HTMLDivElement | null>
  onDiscuss: (text: string) => void
  onOpenGenerationDrawer: () => void
  generation: ReturnType<typeof useChapterGeneration>
}) {
  const { content, isSaving, updateContent } = useChapterEditor(projectId, chapterId)
  const [historyOpen, setHistoryOpen] = useState(false)

  const handleRestore = useCallback((snapshot: object) => {
    editorRef.current?.setContent(snapshot)
    updateContent(snapshot)
  }, [editorRef, updateContent])

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <FloatingToolbar onDiscuss={onDiscuss} editorRef={editorContentRef} />
      <Editor
        ref={editorRef}
        content={content}
        onChange={updateContent}
        className="flex-1"
      />
      <div className="surface-elevated flex items-center justify-between px-3 py-1.5 film-edge">
        <div className="flex items-center gap-2">
          <GenerationButton
            onOpenDrawer={onOpenGenerationDrawer}
            generation={generation}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground uppercase tracking-wider"
            onClick={() => setHistoryOpen(true)}
          >
            <Clock className="h-3 w-3 mr-1" />
            版本历史
          </Button>
        </div>
        <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider">
          <span
            aria-hidden
            className={
              'h-1.5 w-1.5 rounded-full ' +
              (isSaving
                ? 'bg-[hsl(var(--accent-amber))] animate-amber-pulse'
                : 'bg-[hsl(var(--accent-jade))]')
            }
          />
          {isSaving ? '保存中' : '已保存'}
        </span>
      </div>
      <HistoryDrawer
        projectId={projectId}
        chapterId={chapterId}
        currentContent={content}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestore={handleRestore}
      />
    </div>
  )
}

function Placeholder({ activeTab }: { activeTab: ActiveTab }) {
  const copy =
    activeTab === 'outline'
      ? { hero: '梳理脉络', hint: '从左侧大纲列表中选择章节', Icon: ListTree }
      : activeTab === 'world'
        ? { hero: '构建世界', hint: '从左侧世界观列表中选择或创建条目', Icon: Globe2 }
        : { hero: '夜色正好', hint: '从左侧章节列表中选择或创建章节', Icon: BookOpen }

  const Icon = copy.Icon

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden surface-0 bg-amber-vignette bg-grain">
      <div className="relative flex flex-col items-center gap-5 text-center px-6 animate-fade-up">
        <Icon
          className="h-14 w-14 text-[hsl(var(--accent-amber))]/35"
          strokeWidth={1.25}
          aria-hidden
        />
        <h2 className="font-display text-[64px] leading-[1.1] tracking-[0.06em] text-foreground/85">
          {copy.hero}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">{copy.hint}</p>
      </div>
    </div>
  )
}
