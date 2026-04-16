'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, BarChart3, Maximize2, Minimize2, Moon, Settings, Settings2, Sun } from 'lucide-react'
import { metaDb } from '@/lib/db/meta-db'
import { useTotalWordCount, useTodayWordCount } from '@/lib/hooks/use-word-count'
import { useTheme } from '@/components/editor/theme-provider'
import { SyncStatusIcon } from '@/components/sync/SyncStatusIcon'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WorkspaceTopbarProps {
  projectId: string
  focusMode: boolean
  onToggleFocusMode: () => void
  onOpenAIConfig: () => void
  onOpenProjectSettings: () => void
}

export function WorkspaceTopbar({
  projectId,
  focusMode,
  onToggleFocusMode,
  onOpenAIConfig,
  onOpenProjectSettings,
}: WorkspaceTopbarProps) {
  const project = useLiveQuery(
    () => metaDb.projectIndex.get(projectId),
    [projectId]
  )
  const totalWordCount = useTotalWordCount(projectId)
  const todayWordCount = useTodayWordCount(projectId)

  return (
    <div className="surface-elevated h-14 shrink-0 flex items-center gap-3 px-4 sticky top-0 z-40">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/" aria-label="返回项目列表">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>返回书斋</TooltipContent>
      </Tooltip>

      <div className="h-5 w-px bg-border/70" />

      <div className="min-w-0 flex items-center gap-3">
        <span
          className="font-display text-[16px] tracking-wide truncate text-foreground"
          title={project?.title ?? ''}
        >
          {project?.title ?? '未命名项目'}
        </span>
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[11px] tabular-nums">
          <span className="text-muted-foreground">今日</span>
          <span className="text-primary font-medium">
            {todayWordCount.toLocaleString()}
          </span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground">总计</span>
          <span className="text-foreground/80">
            {totalWordCount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      <SyncStatusIcon />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/projects/${projectId}/analysis`} aria-label="创作者分析">
              <BarChart3 className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>创作者分析</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenProjectSettings}
            className="h-8 w-8"
            aria-label="项目设置"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>项目设置</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAIConfig}
            className="h-8 w-8"
            aria-label="AI 设置"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>AI 设置</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={focusMode ? 'secondary' : 'ghost'}
            size="icon"
            onClick={onToggleFocusMode}
            className="h-8 w-8"
            aria-label={focusMode ? '退出聚焦模式' : '进入聚焦模式'}
          >
            {focusMode ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{focusMode ? '退出聚焦模式' : '进入聚焦模式'}</TooltipContent>
      </Tooltip>

      <ThemeToggle />
    </div>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
          aria-label={resolvedTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {resolvedTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
      </TooltipContent>
    </Tooltip>
  )
}
