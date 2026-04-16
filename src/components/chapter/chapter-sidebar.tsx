'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { BookOpen, ListTree, Globe2 } from 'lucide-react'
import { useChapters } from '@/lib/hooks/use-chapters'
import { ChapterRow } from './chapter-row'
import { CreateChapterInput } from './create-chapter-input'
import { DeleteChapterDialog } from './delete-chapter-dialog'
import { OutlineTab } from '@/components/outline/outline-tab'
import { WorldBibleTab } from '@/components/world-bible/world-bible-tab'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ActiveTab } from '@/lib/hooks/use-layout'
import type { WorldEntryType } from '@/lib/types'

interface ChapterSidebarProps {
  projectId: string
  activeChapterId: string | null
  onSelectChapter: (id: string) => void
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  activeOutlineId: string | null
  onSelectOutline: (chapterId: string) => void
  activeWorldEntryId: string | null
  onSelectWorldEntry: (id: string) => void
  onEditWorldEntry: (id: string) => void
  onDeleteWorldEntry: (id: string) => void
  onCreateWorldEntry: (type: WorldEntryType) => void
}

type RailItem = {
  value: ActiveTab
  label: string
  shortcut: string
  icon: typeof BookOpen
}

const RAIL_ITEMS: RailItem[] = [
  { value: 'chapters', label: '章节', shortcut: 'Ctrl+1', icon: BookOpen },
  { value: 'outline', label: '大纲', shortcut: 'Ctrl+2', icon: ListTree },
  { value: 'world', label: '世界观', shortcut: 'Ctrl+3', icon: Globe2 },
]

export function ChapterSidebar({
  projectId,
  activeChapterId,
  onSelectChapter,
  activeTab,
  onTabChange,
  activeOutlineId,
  onSelectOutline,
  activeWorldEntryId,
  onSelectWorldEntry,
  onEditWorldEntry,
  onDeleteWorldEntry,
  onCreateWorldEntry,
}: ChapterSidebarProps) {
  const {
    chapters,
    loading,
    addChapter,
    reorderChapters,
    renameChapter,
    softDeleteChapter,
    duplicateChapter,
    updateChapterStatus,
  } = useChapters(projectId)

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = chapters.findIndex((c) => c.id === active.id)
      const newIndex = chapters.findIndex((c) => c.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = [...chapters]
      const [moved] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, moved)

      const newIds = newOrder.map((c) => c.id)
      await reorderChapters(newIds)
    },
    [chapters, reorderChapters]
  )

  const handleCreateChapter = async (title: string) => {
    const newId = await addChapter(title)
    if (activeTab === 'chapters') {
      onSelectChapter(newId)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      if (deleteTargetId === activeChapterId) {
        onSelectChapter('')
      }
      await softDeleteChapter(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  const deleteTarget = deleteTargetId
    ? chapters.find((c) => c.id === deleteTargetId)
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        加载中...
      </div>
    )
  }

  const chaptersHeaderCount = chapters.length
  const activeItem = RAIL_ITEMS.find((i) => i.value === activeTab) ?? RAIL_ITEMS[0]

  return (
    <div className="flex h-full overflow-hidden">
      <nav
        aria-label="侧栏导航"
        className="flex w-14 shrink-0 flex-col border-r bg-gradient-to-b from-card/60 to-background py-2"
      >
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.value
          return (
            <Tooltip key={item.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onTabChange(item.value)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex h-12 w-full items-center justify-center transition-all',
                    'text-muted-foreground/55 hover:text-foreground hover:bg-primary/5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    isActive && 'text-primary'
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary shadow-[0_0_12px_0_hsl(var(--primary)/0.5)]"
                    />
                  )}
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{item.label}</span>
                <kbd className="rounded border border-border bg-muted px-1 text-[10px] font-mono text-muted-foreground">
                  {item.shortcut}
                </kbd>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-9 shrink-0 items-center justify-between border-b px-3 text-[13px] font-medium tracking-wide">
          <span>{activeItem.label}</span>
          {activeTab === 'chapters' && chaptersHeaderCount > 0 && (
            <span className="text-[11px] font-normal tabular-nums text-muted-foreground">
              {chaptersHeaderCount}
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === 'chapters' && (
            <ChaptersPanel
              chapters={chapters}
              sensors={sensors}
              activeChapterId={activeChapterId}
              onSelectChapter={onSelectChapter}
              onRename={renameChapter}
              onDuplicate={duplicateChapter}
              onDelete={setDeleteTargetId}
              onStatusToggle={updateChapterStatus}
              onDragEnd={handleDragEnd}
              onCreate={handleCreateChapter}
            />
          )}

          {activeTab === 'outline' && (
            <OutlineTab
              projectId={projectId}
              onSelectOutline={onSelectOutline}
              activeOutlineId={activeOutlineId}
            />
          )}

          {activeTab === 'world' && (
            <WorldBibleTab
              projectId={projectId}
              activeEntryId={activeWorldEntryId}
              onSelectEntry={onSelectWorldEntry}
              onEditEntry={onEditWorldEntry}
              onDeleteEntry={onDeleteWorldEntry}
              onCreateEntry={onCreateWorldEntry}
            />
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteChapterDialog
          chapterTitle={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  )
}

interface ChaptersPanelProps {
  chapters: ReturnType<typeof useChapters>['chapters']
  sensors: ReturnType<typeof useSensors>
  activeChapterId: string | null
  onSelectChapter: (id: string) => void
  onRename: ReturnType<typeof useChapters>['renameChapter']
  onDuplicate: ReturnType<typeof useChapters>['duplicateChapter']
  onDelete: (id: string) => void
  onStatusToggle: ReturnType<typeof useChapters>['updateChapterStatus']
  onDragEnd: (event: DragEndEvent) => void
  onCreate: (title: string) => Promise<string | void>
}

function ChaptersPanel({
  chapters,
  sensors,
  activeChapterId,
  onSelectChapter,
  onRename,
  onDuplicate,
  onDelete,
  onStatusToggle,
  onDragEnd,
  onCreate,
}: ChaptersPanelProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-sm text-muted-foreground">
            <BookOpen className="h-7 w-7 opacity-50" strokeWidth={1.5} />
            <p className="mt-2">还没有章节</p>
            <p className="text-xs">在下方输入标题创建第一个章节</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {chapters.map((chapter) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  isActive={activeChapterId === chapter.id}
                  onSelect={() => onSelectChapter(chapter.id)}
                  onRename={onRename}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onStatusToggle={onStatusToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="shrink-0 border-t">
        <CreateChapterInput onCreate={onCreate} />
      </div>
    </>
  )
}
