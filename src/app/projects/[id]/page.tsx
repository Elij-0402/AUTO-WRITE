'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ChapterSidebar } from '@/components/chapter/chapter-sidebar'

/**
 * Project workspace page per D-04.
 * Renders ChapterSidebar in sidebar area, placeholder content in main area.
 * Phase 2 will add the editor.
 */
export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  return (
    <>
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 flex flex-col overflow-hidden">
        <ChapterSidebar
          projectId={params.id}
          activeChapterId={activeChapterId}
          onSelectChapter={setActiveChapterId}
        />
      </aside>

      {/* Main content area - placeholder until Phase 2 adds the editor */}
      <main className="flex-1 flex items-center justify-center text-zinc-400">
        {activeChapterId ? (
          <div className="text-center">
            <p className="text-lg mb-1">选择了一个章节</p>
            <p className="text-sm text-zinc-300">编辑器将在后续版本中实现</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-1">选择一个章节开始写作</p>
            <p className="text-sm text-zinc-300">从左侧章节列表中选择或创建章节</p>
          </div>
        )}
      </main>
    </>
  )
}