'use client'

import { Copy, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import type { Chapter } from '@/lib/types'

/**
 * ChapterContextMenu per D-13: rename, duplicate, status toggle, delete.
 * All text in Simplified Chinese.
 */
interface ChapterContextMenuProps {
  chapter: Chapter
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
  onStatusToggle: () => void
  onClose: () => void
}

export function ChapterContextMenu({
  chapter,
  onRename,
  onDuplicate,
  onDelete,
  onStatusToggle,
  onClose,
}: ChapterContextMenuProps) {
  return (
    <div
      className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Rename */}
      <button
        onClick={onRename}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <Pencil className="h-4 w-4" />
        重命名
      </button>

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <Copy className="h-4 w-4" />
        复制
      </button>

      {/* Status toggle */}
      <button
        onClick={onStatusToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        {chapter.status === 'draft' ? (
          <>
            <ToggleRight className="h-4 w-4" />
            标记为已完成
          </>
        ) : (
          <>
            <ToggleLeft className="h-4 w-4" />
            标记为草稿
          </>
        )}
      </button>

      {/* Separator */}
      <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        <Trash2 className="h-4 w-4" />
        删除
      </button>
    </div>
  )
}