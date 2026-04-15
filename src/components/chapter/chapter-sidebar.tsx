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
import { BookOpen } from 'lucide-react'
import { useChapters } from '@/lib/hooks/use-chapters'
import { ChapterRow } from './chapter-row'
import { CreateChapterInput } from './create-chapter-input'
import { DeleteChapterDialog } from './delete-chapter-dialog'
import { OutlineTab } from '@/components/outline/outline-tab'
import { WorldBibleTab } from '@/components/world-bible/world-bible-tab'
import type { ActiveTab } from '@/lib/hooks/use-layout'
import type { WorldEntryType } from '@/lib/types'

/**
 * ChapterSidebar per D-09, D-12, D-13, D-08.
 * Per D-09: always visible alongside the editor.
 * Per D-12: drag-reorder using @dnd-kit.
 * Per D-13: three tabs — "章节" (chapters), "大纲" (outline), "世界观" (world bible), instant switching, no animation.
 * Per D-14: tab state persists via useLayout (passed from parent).
 * Per D-15: creating a chapter stays on current tab.
 * Per D-08: third tab "世界观" for world bible entries.
 */
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
    // Per D-15: creating a chapter stays on current tab
    // If on chapters tab, select the new chapter; on outline tab, stay
    if (activeTab === 'chapters') {
      onSelectChapter(newId)
    }
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
      <div className="flex items-center justify-center h-full text-stone-400 text-sm">
        加载中...
      </div>
    )
  }

  // Per D-13: instant tab switching, no animation
  const tabClasses = (tab: ActiveTab) =>
    `flex-1 py-2 text-center text-sm font-medium transition-colors border-b-2 ${
      activeTab === tab
        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
    }`

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar per D-13: "章节", "大纲", and "世界观" tabs per D-08 */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 px-3">
        <button
          className={tabClasses('chapters')}
          onClick={() => onTabChange('chapters')}
        >
          章节
          <span className="ml-1 text-xs font-normal text-stone-400">
            {chapters.length}
          </span>
        </button>
        <button
          className={tabClasses('outline')}
          onClick={() => onTabChange('outline')}
        >
          大纲
        </button>
        <button
          className={tabClasses('world')}
          onClick={() => onTabChange('world')}
        >
          <BookOpen className="h-4 w-4 inline mr-1" />
          世界观
        </button>
      </div>

      {/* Tab content — per D-13: no animation, instant switch */}
      {activeTab === 'chapters' ? (
        <>
          {/* Chapter list with DnD per D-12 */}
          <div className="flex-1 overflow-y-auto">
            {chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm gap-2">
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

          {/* Inline creation per D-11 — stays on current tab per D-15 */}
          <CreateChapterInput onCreate={handleCreateChapter} />

          {/* Delete confirmation per D-15 */}
          {deleteTarget && (
            <DeleteChapterDialog
              chapterTitle={deleteTarget.title}
              onConfirm={handleDeleteConfirm}
              onCancel={() => setDeleteTargetId(null)}
            />
          )}
        </>
      ) : activeTab === 'outline' ? (
        /* Outline tab per D-16, D-17 */
        <OutlineTab
          projectId={projectId}
          onSelectOutline={onSelectOutline}
          activeOutlineId={activeOutlineId}
        />
      ) : (
        /* World bible tab per D-08 */
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
  )
}
