'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal } from 'lucide-react'
import { getChapterNumber } from '@/lib/db/chapter-queries'
import type { Chapter } from '@/lib/types'
import { ChapterContextMenu } from './chapter-context-menu'

/**
 * ChapterRow — Per D-10: shows chapter number (第N章), title, word count (字数), status badge.
 * Per D-16: chapter number is auto-computed from order position.
 * Per D-13: three-dot menu for context menu actions.
 * Uses @dnd-kit/sortable for drag support.
 */
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
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
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

  // Focus input when editing starts
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
    // IME safety per D-16: only submit on Enter when NOT composing
    if (isComposingRef.current) return

    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditTitle(chapter.title)
      setIsEditing(false)
    }
  }

  const handleRename = () => {
    setMenuOpen(false)
    setEditTitle(chapter.title)
    setIsEditing(true)
  }

  const statusLabel = chapter.status === 'draft' ? '草稿' : '已完成'
  const statusColor = chapter.status === 'draft'
    ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-1 px-2 py-2 border-b border-stone-100 dark:border-stone-800
        cursor-pointer transition-colors
        ${isActive
          ? 'bg-blue-50 border-l-[3px] border-l-blue-500 dark:bg-blue-500/10 dark:border-l-blue-400'
          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}
        ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}
      `}
      onClick={() => {
        if (!isEditing) onSelect()
      }}
    >
      {/* Drag handle */}
      <button
        className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
        aria-label="拖动排序"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Chapter number */}
      <span className="flex-shrink-0 text-xs text-stone-400 min-w-[3rem]">
        {getChapterNumber(chapter.order)}
      </span>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => {
              isComposingRef.current = false
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded border border-stone-300 px-1 py-0 text-sm text-stone-900 dark:text-stone-100 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        ) : (
          <span className="block truncate text-sm text-stone-700 dark:text-stone-300">
            {chapter.title}
          </span>
        )}
      </div>

      {/* Word count */}
      {chapter.wordCount > 0 && (
        <span className={`flex-shrink-0 text-xs ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-stone-400'}`}>
          {chapter.wordCount.toLocaleString()}字
        </span>
      )}

      {/* Status badge */}
      <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${statusColor}`}>
        {statusLabel}
      </span>

      {/* Three-dot menu button */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:text-stone-600 hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="章节操作"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <ChapterContextMenu
            chapter={chapter}
            onRename={handleRename}
            onDuplicate={() => {
              setMenuOpen(false)
              onDuplicate(chapter.id)
            }}
            onDelete={() => {
              setMenuOpen(false)
              onDelete(chapter.id)
            }}
            onStatusToggle={() => {
              setMenuOpen(false)
              onStatusToggle(
                chapter.id,
                chapter.status === 'draft' ? 'completed' : 'draft'
              )
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    </div>
  )
}