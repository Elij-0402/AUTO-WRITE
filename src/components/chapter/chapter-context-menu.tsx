'use client'

import { Copy, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import type { Chapter } from '@/lib/types'

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
}: ChapterContextMenuProps) {
  return (
    <div
      className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border bg-popover py-1 shadow-md"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onRename}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
      >
        <Pencil className="h-4 w-4" />
        重命名
      </button>

      <button
        onClick={onDuplicate}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
      >
        <Copy className="h-4 w-4" />
        复制
      </button>

      <button
        onClick={onStatusToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
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

      <div className="my-1 border-t" />

      <button
        onClick={onDelete}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        删除
      </button>
    </div>
  )
}
