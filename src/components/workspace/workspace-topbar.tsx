'use client'

import Link from 'next/link'
import { ArrowLeft, Bot, Moon, Sun } from 'lucide-react'
import { useTotalWordCount, useTodayWordCount } from '@/lib/hooks/use-word-count'
import { useProjectMeta } from '@/lib/hooks/use-project-meta'
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
  onOpenAIConfig: () => void
  /** True after the user has been idle for the configured timeout (T6). */
  idle?: boolean
}

export function WorkspaceTopbar({
  projectId,
  onOpenAIConfig,
  idle = false,
}: WorkspaceTopbarProps) {
  const { project } = useProjectMeta(projectId)
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
