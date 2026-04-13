'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useProjects } from '@/lib/hooks/use-projects'
import { useTotalWordCount, useTodayWordCount } from '@/lib/hooks/use-word-count'
import { ProjectSettingsForm } from '@/components/project/project-settings-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Settings } from 'lucide-react'

/**
 * Project workspace layout per D-04: full project workspace replaces the dashboard view.
 * Per D-09: chapter sidebar always visible alongside the editor.
 * Per D-07: project settings accessible from workspace.
 */
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { projects, loading, updateProject } = useProjects()
  const [showSettings, setShowSettings] = useState(false)

  const project = projects.find((p) => p.id === params.id)
  const totalWordCount = useTotalWordCount(params.id)
  const todayWordCount = useTodayWordCount(params.id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-400 text-sm">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          项目未找到
        </div>
        <p className="text-zinc-500 mb-6">该作品不存在或已被删除</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          返回作品列表
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-4 gap-3 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回
        </button>
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {project.title}
        </h1>
        <span className="text-xs text-zinc-400">
          {totalWordCount.toLocaleString()}字 | 今日{todayWordCount}字
        </span>
        <button
          onClick={() => setShowSettings(true)}
          className="ml-auto flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          aria-label="项目设置"
        >
          <Settings className="h-4 w-4" />
          项目设置
        </button>
      </header>

      {/* Main workspace area */}
      <div className="flex flex-1 overflow-hidden">{children}</div>

      {/* Project settings dialog per D-07 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>项目设置</DialogTitle>
          </DialogHeader>
          <ProjectSettingsForm
            project={project}
            onSave={async (data) => {
              await updateProject(project.id, data)
              setShowSettings(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}