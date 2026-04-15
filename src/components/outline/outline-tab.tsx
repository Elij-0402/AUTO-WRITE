'use client'

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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useChapters } from '@/lib/hooks/use-chapters'
import type { Chapter, OutlineStatus } from '@/lib/types'

/**
 * Outline status color mapping per D-16.
 * gray = not_started, blue = in_progress, green = completed
 */
function getStatusDotColor(status: OutlineStatus): string {
  switch (status) {
    case 'not_started':
      return 'bg-stone-300 dark:bg-stone-600'
    case 'in_progress':
      return 'bg-blue-400 dark:bg-blue-500'
    case 'completed':
      return 'bg-green-400 dark:bg-green-500'
    default:
      return 'bg-stone-300 dark:bg-stone-600'
  }
}

/**
 * OutlineRow — Individual outline entry row per D-16, D-17, D-19.
 * Per D-17: clicking switches editor area to outline editing form.
 * Per D-19: empty entries show "还没有大纲" prompt with "编辑" button.
 */
interface OutlineRowProps {
  chapter: Chapter
  isActive: boolean
  onSelect: () => void
}

function OutlineRow({ chapter, isActive, onSelect }: OutlineRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isEmptyOutline =
    !chapter.outlineSummary && chapter.outlineStatus === 'not_started'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 px-2 py-2 border-b border-stone-100 dark:border-stone-800
        cursor-pointer transition-colors
        ${isActive
          ? 'bg-stone-100 dark:bg-stone-800'
          : 'hover:bg-stone-50 dark:hover:bg-stone-850'}
        ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}
      `}
      onClick={onSelect}
    >
      {/* Drag handle per D-12 — outline and chapters share same order */}
      <button
        className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
        aria-label="拖动排序"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Status color dot per D-16 */}
      <span
        className={`flex-shrink-0 w-2 h-2 rounded-full ${getStatusDotColor(chapter.outlineStatus)}`}
        title={
          chapter.outlineStatus === 'not_started'
            ? '未开始'
            : chapter.outlineStatus === 'in_progress'
              ? '进行中'
              : '已完成'
        }
      />

      {/* Title and content */}
      <div className="flex-1 min-w-0">
        {isEmptyOutline ? (
          <div className="flex items-center gap-1">
            <span className="text-sm text-stone-400 dark:text-stone-500 truncate">
              {chapter.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 shrink-0"
            >
              编辑
            </button>
          </div>
        ) : (
          <span className="block truncate text-sm text-stone-700 dark:text-stone-300">
            {chapter.title}
          </span>
        )}
      </div>

      {/* Word count indicator for entries with outline content */}
      {chapter.wordCount > 0 && !isEmptyOutline && (
        <span className="flex-shrink-0 text-xs text-stone-400">
          {chapter.wordCount.toLocaleString()}字
        </span>
      )}
    </div>
  )
}

/**
 * OutlineTab per D-13, D-16, D-17.
 * Shows outline entries with status color dots.
 * Clicking an entry switches to outline editing form in editor area (per D-17).
 * Drag-reorder shares the same order field as chapters per D-12.
 */
interface OutlineTabProps {
  projectId: string
  onSelectOutline: (chapterId: string) => void
  activeOutlineId: string | null
}

export function OutlineTab({
  projectId,
  onSelectOutline,
  activeOutlineId,
}: OutlineTabProps) {
  const { chapters, loading, reorderChapters } = useChapters(projectId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // Drag reorder per D-12 — outline and chapters share the same order
  const handleDragEnd = async (event: DragEndEvent) => {
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 text-sm">
        加载中...
      </div>
    )
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm gap-2">
        <p>还没有章节</p>
        <p className="text-xs">请先在章节标签中创建章节</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
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
            <OutlineRow
              key={chapter.id}
              chapter={chapter}
              isActive={activeOutlineId === chapter.id}
              onSelect={() => onSelectOutline(chapter.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}