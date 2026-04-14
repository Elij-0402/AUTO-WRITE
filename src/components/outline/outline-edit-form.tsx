'use client'

import { useChapters } from '@/lib/hooks/use-chapters'
import type { OutlineStatus } from '@/lib/types'

/**
 * OutlineEditForm — Stub for Task 1 integration.
 * Full implementation in Task 2 per D-17, D-20, D-21, D-22, D-23.
 */
interface OutlineEditFormProps {
  projectId: string
  chapterId: string
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious: boolean
  hasNext: boolean
}

export function OutlineEditForm({
  projectId,
  chapterId,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: OutlineEditFormProps) {
  const { chapters } = useChapters(projectId)
  const chapter = chapters.find((c) => c.id === chapterId)

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        <p>章节未找到</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        {chapter.title}
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        大纲编辑（即将完成）
      </p>
      {/* Navigation per D-20 */}
      <div className="flex gap-2 mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← 上一章
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          下一章 →
        </button>
      </div>
    </div>
  )
}