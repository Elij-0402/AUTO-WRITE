'use client'

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Maximize2, Minimize2, Moon, Settings2, Sun } from 'lucide-react'
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
}

export function WorkspaceTopbar({
  projectId,
  focusMode,
  onToggleFocusMode,
  onOpenAIConfig,
}: WorkspaceTopbarProps) {
  const project = useLiveQuery(
    () => metaDb.projectIndex.get(projectId),
    [projectId]
  )
  const totalWordCount = useTotalWordCount(projectId)
  const todayWordCount = useTodayWordCount(projectId)

  return (
    <div className="h-12 shrink-0 border-b bg-background flex items-center gap-2 px-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/" aria-label="返回项目列表">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>返回</TooltipContent>
      </Tooltip>

      <div className="min-w-0 flex items-center gap-3">
        <span className="truncate text-sm font-medium" title={project?.title ?? ''}>
          {project?.title ?? '未命名项目'}
        </span>
        <span className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <WordStat label="今日" value={todayWordCount} />
          <span className="text-border">·</span>
          <WordStat label="总计" value={totalWordCount} />
        </span>
      </div>

      <div className="flex-1" />

      <SyncStatusIcon />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAIConfig}
            className="h-8 w-8"
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

function WordStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
      <span className="tabular-nums text-foreground/80">
        {value.toLocaleString()}
      </span>
    </span>
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
