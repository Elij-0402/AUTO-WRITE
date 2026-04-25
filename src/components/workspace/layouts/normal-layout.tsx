'use client'

import { Group, Panel, Separator as PanelSeparator } from '../resizable-panel'
import { ChapterSidebar } from '../../chapter/chapter-sidebar'
import { DEFAULT_SIDEBAR_WIDTH } from '../resizable-panel'
import { PanelErrorBoundary } from '../error-boundary'
import type { ActiveTab } from '@/lib/hooks/use-layout'

const DEFAULT_CHAT_PANEL_WIDTH = 340
const MIN_CHAT_PANEL_WIDTH = 300
const MAX_CHAT_PANEL_WIDTH = 520

interface NormalLayoutProps {
  projectId: string
  activeChapterId: string | null
  activeTab: ActiveTab
  activeOutlineId: string | null
  activeWorldEntryId: string | null
  mainContent: React.ReactNode
  handleSidebarDoubleClickReset: () => void
  handleChatPanelDoubleClickReset: () => void
  onSelectChapter: (id: string) => void
  onTabChange: (tab: ActiveTab) => void
  onSelectOutline: (id: string) => void
  onSelectWorldEntry: (id: string) => void
  onEditWorldEntry: (id: string) => void
  onDeleteWorldEntry: (id: string) => void
  children?: React.ReactNode
}

export function NormalLayout({
  projectId,
  activeChapterId,
  activeTab,
  activeOutlineId,
  activeWorldEntryId,
  mainContent,
  handleSidebarDoubleClickReset,
  handleChatPanelDoubleClickReset,
  onSelectChapter,
  onTabChange,
  onSelectOutline,
  onSelectWorldEntry,
  onEditWorldEntry,
  onDeleteWorldEntry,
  children,
}: NormalLayoutProps) {
  return (
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
              projectId={projectId}
              activeChapterId={activeChapterId}
              onSelectChapter={onSelectChapter}
              activeTab={activeTab}
              onTabChange={onTabChange}
              activeOutlineId={activeOutlineId}
              onSelectOutline={onSelectOutline}
              activeWorldEntryId={activeWorldEntryId}
              onSelectWorldEntry={onSelectWorldEntry}
              onEditWorldEntry={onEditWorldEntry}
              onDeleteWorldEntry={onDeleteWorldEntry}
            />
          </PanelErrorBoundary>
        </div>
      </Panel>

      <PanelSeparator
        onDoubleClick={handleSidebarDoubleClickReset}
        className="group relative flex items-center justify-center w-px shrink-0 cursor-col-resize bg-[hsl(var(--border))]"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
        <div className="absolute inset-y-0 left-0 w-px group-hover:w-[3px] group-hover:bg-[hsl(var(--accent))] group-active:bg-[hsl(var(--accent))] transition-[width,background-color] duration-150" />
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
            <div className="absolute inset-y-0 left-0 w-px group-hover:w-[3px] group-hover:bg-[hsl(var(--accent))] group-active:bg-[hsl(var(--accent))] transition-[width,background-color] duration-150" />
          </PanelSeparator>

          <Panel
            id="chat"
            defaultSize={DEFAULT_CHAT_PANEL_WIDTH}
            minSize={MIN_CHAT_PANEL_WIDTH}
            maxSize={MAX_CHAT_PANEL_WIDTH}
            groupResizeBehavior="preserve-pixel-size"
          >
            <div className="h-full">
              {children}
            </div>
          </Panel>
        </Group>
      </Panel>
    </Group>
  )
}
