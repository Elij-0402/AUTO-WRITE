'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Pencil, Copy, Trash2, CheckCircle2 } from 'lucide-react'
import type { Chapter } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
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
        'group relative flex items-center gap-1.5 border-l-2 border-transparent px-3 py-1.5 cursor-pointer transition-colors',
        isActive
          ? 'border-primary bg-accent/60 text-accent-foreground'
          : 'hover:bg-accent/40',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
      onClick={() => {
        if (!isEditing) onSelect()
      }}
    >
      <button
        className="flex-shrink-0 cursor-grab text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
        aria-label="拖动排序"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="flex-shrink-0 font-mono text-xs text-muted-foreground min-w-[1.25rem] text-right tabular-nums">
        {chapter.order + 1}
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
            className="w-full rounded border border-input bg-background px-1.5 py-0 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <span className="block truncate text-sm">
            {chapter.title}
          </span>
        )}
      </div>

      {chapter.wordCount > 0 && (
        <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">
          {chapter.wordCount.toLocaleString()}
        </span>
      )}

      <Badge
        variant={chapter.status === 'draft' ? 'secondary' : 'default'}
        className="text-[10px] px-1.5 py-0 h-4 font-normal"
      >
        {chapter.status === 'draft' ? '草稿' : '完成'}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="章节操作"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleRename}>
            <Pencil className="h-3.5 w-3.5" />
            重命名
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(chapter.id)}>
            <Copy className="h-3.5 w-3.5" />
            复制章节
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onStatusToggle(
                chapter.id,
                chapter.status === 'draft' ? 'completed' : 'draft'
              )
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {chapter.status === 'draft' ? '标记为完成' : '标记为草稿'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(chapter.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
