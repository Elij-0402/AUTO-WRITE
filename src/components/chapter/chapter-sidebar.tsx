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
import { useChapters } from '@/lib/hooks/use-chapters'
import { ChapterRow } from './chapter-row'
import { CreateChapterInput } from './create-chapter-input'
import { DeleteChapterDialog } from './delete-chapter-dialog'
import { OutlineTab } from '@/components/outline/outline-tab'
import { WorldBibleTab } from '@/components/world-bible/world-bible-tab'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
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

  const handleAccordionChange = (value: string) => {
    if (!value) return
    onTabChange(value as ActiveTab)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="single"
          collapsible={false}
          value={activeTab}
          onValueChange={handleAccordionChange}
        >
          <AccordionItem value="chapters" className="border-b">
            <AccordionTrigger className="text-sm py-2.5 px-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span>章节</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {chapters.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div>
                {chapters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-1 px-3">
                    <p>还没有章节</p>
                    <p className="text-xs">点击下方按钮创建第一个章节</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
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
                          onRename={renameChapter}
                          onDuplicate={duplicateChapter}
                          onDelete={(id) => setDeleteTargetId(id)}
                          onStatusToggle={updateChapterStatus}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              <CreateChapterInput onCreate={handleCreateChapter} />

              {deleteTarget && (
                <DeleteChapterDialog
                  chapterTitle={deleteTarget.title}
                  onConfirm={handleDeleteConfirm}
                  onCancel={() => setDeleteTargetId(null)}
                />
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="outline" className="border-b">
            <AccordionTrigger className="text-sm py-2.5 px-3 hover:no-underline">
              大纲
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <OutlineTab
                projectId={projectId}
                onSelectOutline={onSelectOutline}
                activeOutlineId={activeOutlineId}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="world" className="border-b">
            <AccordionTrigger className="text-sm py-2.5 px-3 hover:no-underline">
              世界观
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <WorldBibleTab
                projectId={projectId}
                activeEntryId={activeWorldEntryId}
                onSelectEntry={onSelectWorldEntry}
                onEditEntry={onEditWorldEntry}
                onDeleteEntry={onDeleteWorldEntry}
                onCreateEntry={onCreateWorldEntry}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
