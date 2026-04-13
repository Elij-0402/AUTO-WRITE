'use client'

import { useChapters } from '@/lib/hooks/use-chapters'

/**
 * Minimal ChapterSidebar for Task 1 — will be fully built out in Task 2.
 * Per D-09: chapter sidebar always visible alongside the editor.
 */
export function ChapterSidebar({
  projectId,
  activeChapterId,
  onSelectChapter,
}: {
  projectId: string
  activeChapterId: string | null
  onSelectChapter: (id: string) => void
}) {
  const { chapters, loading } = useChapters(projectId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        加载中...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          章节
          <span className="ml-1.5 text-xs text-zinc-400 font-normal">
            {chapters.length}
          </span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
            还没有章节
          </div>
        ) : (
          chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(chapter.id)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-zinc-100 dark:border-zinc-800 transition-colors ${
                activeChapterId === chapter.id
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
              }`}
            >
              <span className="text-xs text-zinc-400 mr-1">
                第{chapter.order + 1}章
              </span>
              {chapter.title}
            </button>
          ))
        )}
      </div>
    </div>
  )
}