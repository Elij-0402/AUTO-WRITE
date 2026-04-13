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

/**
 * ChapterSidebar per D-09, D-12.
 * Per D-09: always visible alongside the editor.
 * Per D-12: drag-reorder using @dnd-kit.
 * Per D-11: inline creation at the bottom.
 * Per D-16: auto-numbering with 第N章 prefix.
 */
interface ChapterSidebarProps {
  projectId: string
  activeChapterId: string | null
  onSelectChapter: (id: string) => void
}

export function ChapterSidebar({
  projectId,
  activeChapterId,
  onSelectChapter,
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

  // D-12: Drag and drop reorder
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = chapters.findIndex((c) => c.id === active.id)
      const newIndex = chapters.findIndex((c) => c.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      // Reorder: create new order array
      const newOrder = [...chapters]
      const [moved] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, moved)

      // Update via chapter IDs
      const newIds = newOrder.map((c) => c.id)
      await reorderChapters(newIds)
    },
    [chapters, reorderChapters]
  )

  const handleCreateChapter = async (title: string) => {
    const newId = await addChapter(title)
    onSelectChapter(newId)
  }

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      // If we're deleting the active chapter, deselect
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
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        加载中...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header per D-09 */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          章节
          <span className="ml-1.5 text-xs text-zinc-400 font-normal">
            {chapters.length}
          </span>
        </h2>
      </div>

      {/* Chapter list with DnD per D-12 */}
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm gap-2">
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

      {/* Inline creation per D-11 */}
      <CreateChapterInput onCreate={handleCreateChapter} />

      {/* Delete confirmation per D-15 */}
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