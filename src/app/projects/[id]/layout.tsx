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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)]/50 text-sm">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-2xl font-semibold text-foreground mb-2">
          项目未找到
        </div>
        <p className="text-text-secondary mb-6">该作品不存在或已被删除</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          返回作品列表
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Top bar */}
      <header className="h-14 glass-panel border-b-0 border-[var(--border-subtle)] z-50 sticky top-0 flex items-center px-4 gap-3 flex-shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-text-tertiary hover:text-foreground transition-colors flex items-center gap-1"
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
        <h1 className="text-base font-bold text-[var(--foreground)] truncate ml-2">
          {project.title}
        </h1>
        <span className="text-xs text-[var(--foreground)]/40 ml-4 font-medium bg-[var(--foreground)]/5 px-2 py-0.5 rounded-full">
          {totalWordCount.toLocaleString()}字 <span className="mx-1">•</span> 今日{todayWordCount}字
        </span>
        <button
          onClick={() => setShowSettings(true)}
          className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]/60 hover:text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10 px-3 py-1.5 rounded-lg"
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