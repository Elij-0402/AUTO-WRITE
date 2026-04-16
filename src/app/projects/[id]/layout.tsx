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
import { Button } from '@/components/ui/button'
import { ChevronLeft, Settings } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-2xl font-semibold text-foreground mb-2">
          项目未找到
        </div>
        <p className="text-muted-foreground mb-6">该作品不存在或已被删除</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          返回作品列表
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b bg-background sticky top-0 z-50 flex items-center px-4 gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </Button>

        <div className="h-5 w-px bg-border" />

        <h1 className="text-sm font-semibold text-foreground truncate">
          {project.title}
        </h1>

        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md">
          {totalWordCount.toLocaleString()} 字 · 今日 {todayWordCount}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="ml-auto"
        >
          <Settings className="h-4 w-4" />
          项目设置
        </Button>
      </header>

      <div className="flex flex-col flex-1 overflow-hidden">{children}</div>

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
