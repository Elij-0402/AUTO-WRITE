'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ChapterSidebar } from '@/components/chapter/chapter-sidebar'
import { Editor } from '@/components/editor/editor'
import { useChapterEditor } from '@/lib/hooks/use-chapter-editor'

/**
 * Project workspace page per D-04.
 * Renders ChapterSidebar in sidebar area, editor in main area.
 * 
 * Layout per D-01, D-04, D-05:
 * - Editor does NOT display chapter title (title only in sidebar)
 * - Save status displayed in editor bottom bar ("保存中..." / "已保存")
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

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeChapterId ? (
          <EditorWithStatus projectId={params.id} chapterId={activeChapterId} />
        ) : (
          <Placeholder />
        )}
      </main>
    </>
  )
}

/**
 * Editor wrapper that includes save status display per D-05.
 * "保存中..." when isSaving is true, "已保存" when false.
 * Light gray text, small font, positioned bottom-right of editor area.
 */
function EditorWithStatus({ projectId, chapterId }: { projectId: string; chapterId: string }) {
  const { content, isSaving, updateContent } = useChapterEditor(projectId, chapterId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Editor
        content={content}
        onChange={updateContent}
        className="flex-1"
      />
      <div className="text-xs text-zinc-400 p-2 text-right dark:text-zinc-500">
        {isSaving ? '保存中...' : '已保存'}
      </div>
    </div>
  )
}

/**
 * Placeholder shown when no chapter is selected.
 */
function Placeholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
      <div className="text-center">
        <p className="text-lg mb-1">选择一个章节开始写作</p>
        <p className="text-sm text-zinc-300 dark:text-zinc-600">从左侧章节列表中选择或创建章节</p>
      </div>
    </div>
  )
}
