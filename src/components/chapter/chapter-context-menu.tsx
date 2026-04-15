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
      className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-border-subtle bg-surface-0 py-1 shadow-lg glass-panel"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Rename */}
      <button
        onClick={onRename}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
      >
        <Pencil className="h-4 w-4" />
        重命名
      </button>

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
      >
        <Copy className="h-4 w-4" />
        复制
      </button>

      {/* Status toggle */}
      <button
        onClick={onStatusToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
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
      <div className="my-1 border-t border-border-subtle" />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-muted"
      >
        <Trash2 className="h-4 w-4" />
        删除
      </button>
    </div>
  )
}