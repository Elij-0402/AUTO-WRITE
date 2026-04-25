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
import { GripVertical, ListTree } from 'lucide-react'
import { useChapters } from '@/lib/hooks/use-chapters'
import { cn } from '@/lib/utils'
import type { Chapter, OutlineStatus } from '@/lib/types'

function getStatusDotColor(status: OutlineStatus): string {
  switch (status) {
    case 'not_started':
      return 'bg-muted-foreground/40'
    case 'in_progress':
      return 'bg-[hsl(var(--accent-amber))]'
    case 'completed':
      return 'bg-[hsl(var(--accent-jade))]'
    default:
      return 'bg-muted-foreground/40'
  }
}

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
      className={cn(
        'group relative flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-[background-color,color] duration-[var(--dur-fast)]',
        'border-l-2 border-transparent',
        isActive
          ? 'border-[hsl(var(--accent-amber))] bg-[hsl(var(--surface-3))]/70 text-foreground'
          : 'hover:bg-[hsl(var(--surface-3))]/40 text-foreground/85',
        isDragging && 'opacity-50 shadow-[var(--shadow-md)] z-50'
      )}
      onClick={onSelect}
    >
      <button
        className="flex-shrink-0 cursor-grab text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
        aria-label="拖动排序"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span
        className={cn('flex-shrink-0 w-1.5 h-1.5 rounded-full', getStatusDotColor(chapter.outlineStatus))}
        title={
          chapter.outlineStatus === 'not_started'
            ? '未开始'
            : chapter.outlineStatus === 'in_progress'
              ? '进行中'
              : '已完成'
        }
      />

      <div className="flex-1 min-w-0">
        {isEmptyOutline ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-muted-foreground truncate">
              {chapter.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              className="text-[11px] text-[hsl(var(--accent-amber))] hover:underline shrink-0"
            >
              编辑
            </button>
          </div>
        ) : (
          <span className="block truncate text-[13px]">
            {chapter.title}
          </span>
        )}
      </div>

      {chapter.wordCount > 0 && !isEmptyOutline && (
        <span className="flex-shrink-0 text-mono text-[10px] text-muted-foreground/70 tabular-nums">
          {chapter.wordCount.toLocaleString()}
        </span>
      )}
    </div>
  )
}

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
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        加载中...
      </div>
    )
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-sm text-muted-foreground">
        <ListTree className="h-7 w-7 opacity-50" strokeWidth={1.5} />
        <p className="mt-2">还没有章节</p>
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
