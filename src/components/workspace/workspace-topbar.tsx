'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, BarChart3, Bot, Maximize2, Minimize2, Moon, Settings, Sun } from 'lucide-react'
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
  /** True after the user has been idle for the configured timeout (T6). */
  idle?: boolean
}

export function WorkspaceTopbar({
  projectId,
  focusMode,
  onToggleFocusMode,
  onOpenAIConfig,
  onOpenProjectSettings,
  idle = false,
}: WorkspaceTopbarProps) {
  const project = useLiveQuery(
    () => metaDb.projectIndex.get(projectId),
    [projectId]
  )
  const totalWordCount = useTotalWordCount(projectId)
  const todayWordCount = useTodayWordCount(projectId)

  return (
    <div
      className={
        'surface-elevated h-12 shrink-0 flex items-center gap-2 px-4 sticky top-0 z-40 ' +
        'transition-opacity duration-[var(--t-slow)] ease-[cubic-bezier(0.2,0,0,1)] ' +
        (idle ? 'opacity-60' : 'opacity-100')
      }
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/" aria-label="返回项目列表">
              <ArrowLeft />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>返回书斋</TooltipContent>
      </Tooltip>

      <div className="h-4 divider-hair-v" />

      <div className="min-w-0 flex items-center gap-3">
        <span
          className="text-[15px] font-semibold truncate text-foreground"
          title={project?.title ?? ''}
        >
          {project?.title ?? '未命名项目'}
        </span>
        <div className="hidden sm:inline-flex items-center gap-2 text-[12px] tabular-nums">
          <span className="text-muted-foreground">今日</span>
          <span className="text-primary font-medium">
            {todayWordCount.toLocaleString()}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-muted-foreground">总</span>
          <span className="text-foreground/80">
            {totalWordCount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      <SyncStatusIcon />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={`/projects/${projectId}/analysis`} aria-label="创作者分析">
              <BarChart3 />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>创作者分析</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenProjectSettings}
            aria-label="项目设置"
          >
            <Settings />
          </Button>
        </TooltipTrigger>
        <TooltipContent>项目设置</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenAIConfig}
            aria-label="AI 设置"
          >
            <Bot />
          </Button>
        </TooltipTrigger>
        <TooltipContent>AI 设置</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={focusMode ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={onToggleFocusMode}
            aria-label={focusMode ? '退出深夜模式' : '深夜模式'}
          >
            {focusMode ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{focusMode ? '退出深夜模式' : '深夜模式'}</TooltipContent>
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
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? '切换稿纸模式' : '切换暗色模式'}
        >
          {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {resolvedTheme === 'dark' ? '切换稿纸模式' : '切换暗色模式'}
      </TooltipContent>
    </Tooltip>
  )
}
