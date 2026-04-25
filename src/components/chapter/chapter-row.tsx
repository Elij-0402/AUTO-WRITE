'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Pencil, Copy, Trash2, CheckCircle2 } from 'lucide-react'
import type { Chapter } from '@/lib/types'
import { playChapterCompleteTick } from '@/lib/audio/tick'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ChapterRowProps {
  chapter: Chapter
  isActive: boolean
  onSelect: () => void
  onRename: (id: string, title: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onStatusToggle: (id: string, status: 'draft' | 'completed') => void
}

export function ChapterRow({
  chapter,
  isActive,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onStatusToggle,
}: ChapterRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chapter.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const isComposingRef = useRef(false)

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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSaveTitle = async () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== chapter.title) {
      await onRename(chapter.id, trimmed)
    } else {
      setEditTitle(chapter.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComposingRef.current) return
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditTitle(chapter.title)
      setIsEditing(false)
    }
  }

  const handleRename = () => {
    setEditTitle(chapter.title)
    setIsEditing(true)
  }

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
      isDragging && 'opacity-50 elev-md z-50'
      )}
      onClick={() => {
        if (!isEditing) onSelect()
      }}
    >
      <button
        className="flex-shrink-0 cursor-grab text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
        aria-label="拖动排序"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className={cn(
        'flex-shrink-0 text-mono text-[11px] min-w-[1.5rem] text-right tabular-nums',
        isActive ? 'text-[hsl(var(--accent-amber))]' : 'text-muted-foreground/60'
      )}>
        {String(chapter.order + 1).padStart(2, '0')}
      </span>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => { isComposingRef.current = false }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-[var(--radius-control)] border border-[hsl(var(--border-strong))] surface-2 px-1.5 py-0 text-[13px] text-foreground focus:outline-none focus:border-[hsl(var(--accent-amber))]"
          />
        ) : (
          <span className="block truncate text-[13px]">
            {chapter.title}
          </span>
        )}
      </div>

      {chapter.wordCount > 0 && (
        <span className="flex-shrink-0 text-mono text-[10px] text-muted-foreground/70 tabular-nums">
          {chapter.wordCount.toLocaleString()}
        </span>
      )}

      {chapter.status === 'completed' && (
        <span
          aria-label="已完成"
          className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-jade))]"
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            className="flex h-5 w-5 items-center justify-center rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-3))] opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="章节操作"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleRename}>
            <Pencil />
            重命名
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(chapter.id)}>
            <Copy />
            复制章节
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const nextStatus = chapter.status === 'draft' ? 'completed' : 'draft'
              onStatusToggle(chapter.id, nextStatus)
              if (nextStatus === 'completed') {
                // T6: fire the once-only atmosphere tick on draft → completed transitions.
                // Audio module respects the global localStorage kill switch.
                playChapterCompleteTick()
              }
            }}
          >
            <CheckCircle2 />
            {chapter.status === 'draft' ? '标记为完成' : '标记为草稿'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(chapter.id)}
            className="text-[hsl(var(--accent-coral))] focus:text-[hsl(var(--accent-coral))]"
          >
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
