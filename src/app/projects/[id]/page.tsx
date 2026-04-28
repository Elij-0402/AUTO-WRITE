'use client'

import { useState, useCallback, useRef, type RefObject } from 'react'
import { useParams } from 'next/navigation'
import { ThemeProvider } from '@/components/editor/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarNavProvider, type SidebarTab } from '@/lib/hooks/use-sidebar-nav'
import { AIConfigDialog } from '@/components/workspace/ai-config-dialog'
import { AIOnboardingDialog } from '@/components/workspace/ai-onboarding-dialog'
import { OnboardingTourDialog } from '@/components/workspace/onboarding-tour-dialog'
import { WorkspaceTopbar } from '@/components/workspace/workspace-topbar'
import { AIChatPanel } from '@/components/workspace/ai-chat-panel'
import { useWorkspaceLayout } from '@/lib/hooks/use-workspace-layout'
import { useAIConfigDialog, useAIOnboardingDialog, useOnboardingTourDialog } from '@/components/workspace/dialogs'
import { NormalLayout } from '@/components/workspace/layouts/normal-layout'
import type { EditorHandle } from '@/components/editor/editor-types'
import type { ActiveTab } from '@/lib/hooks/use-layout'
import { useChapterEditor } from '@/lib/hooks/use-chapter-editor'
import { Editor } from '@/components/editor/editor'
import { FloatingToolbar } from '@/components/editor/floating-toolbar'
import { HistoryDrawer } from '@/components/editor/history-drawer'
import { ChapterMetaStrip } from '@/components/editor/chapter-meta-strip'
import { Button } from '@/components/ui/button'
import { Clock, BookOpen, FileText, ListTree, Globe2 } from 'lucide-react'
import type { Chapter } from '@/lib/types'
import { OutlineEditForm } from '@/components/outline/outline-edit-form'
import { PlanningWorkbench } from '@/components/planning/planning-workbench'
import { WorldEntryEditForm } from '@/components/world-bible/world-entry-edit-form'
import { PanelErrorBoundary } from '@/components/workspace/error-boundary'

export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const editorRef = useRef<EditorHandle>(null)
  const editorContentRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)

  const layout = useWorkspaceLayout({ projectId: params.id })

  const aiConfigDialog = useAIConfigDialog()
  const onboardingDialog = useAIOnboardingDialog()
  const tourDialog = useOnboardingTourDialog(params.id)

  const handleInsertDraft = useCallback((content: string) => {
    editorRef.current?.insertText(content)
  }, [])

  const handleDiscuss = useCallback((text: string) => {
    setSelectedText(text)
  }, [])

  const mainContent = layout.activeTab === 'world' && layout.activeWorldEntryId ? (
    <WorldEntryEditForm
      projectId={params.id}
      entryId={layout.activeWorldEntryId}
      onPrevious={layout.handleWorldPrevious}
      onNext={layout.handleWorldNext}
      hasPrevious={layout.hasWorldPrevious}
      hasNext={layout.hasWorldNext}
      onSelectEntry={layout.handleSelectWorldEntry}
      allEntries={layout.entries || []}
    />
  ) : layout.activeTab === 'planning' ? (
    <PlanningWorkbench
      projectId={params.id}
      selection={layout.activePlanningItem}
      onSelectItem={layout.setActivePlanningItem}
      onOpenLinkedChapter={(chapterId) => {
        layout.handleTabChange('chapters')
        layout.setActivePlanningItem(null)
        layout.setActiveChapterId(chapterId)
      }}
    />
  ) : layout.activeChapterId ? (
    <ChapterWorkspaceView
      projectId={params.id}
      chapterId={layout.activeChapterId}
      chapter={layout.currentChapter}
      chapterNumber={layout.currentChapterNumber}
      chapterView={layout.chapterView}
      onSetChapterView={layout.setChapterView}
      onPrevious={layout.handleOutlinePrevious}
      onNext={layout.handleOutlineNext}
      hasPrevious={layout.hasPrevious}
      hasNext={layout.hasNext}
      editorRef={editorRef}
      editorContentRef={editorContentRef}
      onDiscuss={handleDiscuss}
    />
  ) : (
    <Placeholder activeTab={layout.activeTab} />
  )

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <SidebarNavProvider
          activeTab={layout.activeTab as SidebarTab}
          selectedEntryId={layout.activeWorldEntryId}
          setActiveTab={layout.handleTabChange as (t: SidebarTab) => void}
          setSelectedEntryId={(id) => { if (id) layout.handleSelectWorldEntry(id) }}
        >
          <AIConfigDialog open={aiConfigDialog.open} onClose={aiConfigDialog.onClose} />
          <AIOnboardingDialog open={onboardingDialog.open} onSkip={onboardingDialog.onSkip} onSaveComplete={onboardingDialog.onSaveComplete} />
          <OnboardingTourDialog projectId={params.id} open={tourDialog.open} onComplete={tourDialog.onComplete} />

          <WorkspaceTopbar
            projectId={params.id}
            onOpenAIConfig={aiConfigDialog.onOpen}
            idle={layout.idle}
          />

          <div className="flex-1 flex overflow-hidden transition-[opacity] duration-[var(--dur-slow)] ease-[cubic-bezier(0.16,1,0.3,1)]">
            <NormalLayout
              projectId={params.id}
              activeChapterId={layout.activeChapterId}
              activeTab={layout.activeTab}
              activeWorldEntryId={layout.activeWorldEntryId}
              activePlanningSelection={layout.activePlanningItem}
              mainContent={<PanelErrorBoundary label="编辑器">{mainContent}</PanelErrorBoundary>}
              handleSidebarDoubleClickReset={layout.handleSidebarDoubleClickReset}
              handleChatPanelDoubleClickReset={layout.handleChatPanelDoubleClickReset}
              onSelectChapter={layout.setActiveChapterId}
              onTabChange={layout.handleTabChange}
              onSelectWorldEntry={layout.handleSelectWorldEntry}
              onEditWorldEntry={layout.handleEditWorldEntry}
              onDeleteWorldEntry={layout.handleDeleteWorldEntry}
              onSelectPlanningItem={layout.setActivePlanningItem}
            >
              <AIChatPanel
                projectId={params.id}
                activeChapterId={layout.activeChapterId}
                selectedText={selectedText}
                onDiscussComplete={() => setSelectedText(null)}
                onInsertDraft={handleInsertDraft}
                onOpenAIConfig={aiConfigDialog.onOpen}
              />
            </NormalLayout>
          </div>
        </SidebarNavProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

function EditorWithStatus({ projectId, chapterId, editorRef, editorContentRef, onDiscuss }: {
  projectId: string
  chapterId: string
  editorRef: RefObject<EditorHandle | null>
  editorContentRef: RefObject<HTMLDivElement | null>
  onDiscuss: (text: string) => void
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
                ? 'bg-[hsl(var(--warning))] animate-pulse'
                : 'bg-[hsl(var(--success))]')
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

function ChapterWorkspaceView({
  projectId,
  chapterId,
  chapter,
  chapterNumber,
  chapterView,
  onSetChapterView,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  editorRef,
  editorContentRef,
  onDiscuss,
}: {
  projectId: string
  chapterId: string
  chapter: Chapter | undefined
  chapterNumber: number
  chapterView: 'editor' | 'outline'
  onSetChapterView: (view: 'editor' | 'outline') => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious: boolean
  hasNext: boolean
  editorRef: RefObject<EditorHandle | null>
  editorContentRef: RefObject<HTMLDivElement | null>
  onDiscuss: (text: string) => void
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {chapter && chapterNumber > 0 ? (
        <ChapterMetaStrip
          chapterNumber={chapterNumber}
          wordCount={chapter.wordCount}
          status={chapter.status}
          extras={
            <div className="inline-flex rounded-sm border border-border surface-1 p-0.5">
              <Button
                type="button"
                size="sm"
                variant={chapterView === 'editor' ? 'subtle' : 'ghost'}
                className="h-7 px-2.5"
                onClick={() => onSetChapterView('editor')}
                aria-pressed={chapterView === 'editor'}
              >
                <FileText className="h-3.5 w-3.5" />
                正文
              </Button>
              <Button
                type="button"
                size="sm"
                variant={chapterView === 'outline' ? 'subtle' : 'ghost'}
                className="h-7 px-2.5"
                onClick={() => onSetChapterView('outline')}
                aria-pressed={chapterView === 'outline'}
              >
                <ListTree className="h-3.5 w-3.5" />
                大纲
              </Button>
            </div>
          }
        />
      ) : null}

      {chapterView === 'outline' ? (
        <OutlineEditForm
          projectId={projectId}
          chapterId={chapterId}
          onPrevious={onPrevious}
          onNext={onNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      ) : (
        <EditorWithStatus
          projectId={projectId}
          chapterId={chapterId}
          editorRef={editorRef}
          editorContentRef={editorContentRef}
          onDiscuss={onDiscuss}
        />
      )}
    </div>
  )
}

function Placeholder({ activeTab }: { activeTab: ActiveTab }) {
  const copy =
    activeTab === 'world'
      ? { hero: '构建世界', hint: '从左侧世界观列表中选择或创建条目', Icon: Globe2 }
      : { hero: '', hint: '从左侧章节列表中选择章节，再切换正文或大纲视图', Icon: BookOpen }

  const Icon = copy.Icon

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden surface-0">
      <div className="relative flex flex-col items-center gap-5 text-center px-6 animate-fade-up">
        <Icon
          className="h-14 w-14 text-[hsl(var(--accent-amber))]/35"
          strokeWidth={1.25}
          aria-hidden
        />
        {copy.hero ? (
          <h2 className="font-display text-[64px] leading-[1.1] tracking-[0.06em] text-foreground/85">
            {copy.hero}
          </h2>
        ) : null}
        <p className="text-sm text-muted-foreground max-w-xs">{copy.hint}</p>
      </div>
    </div>
  )
}
