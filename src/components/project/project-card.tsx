'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Settings, Trash2 } from 'lucide-react'
import { useProjects } from '@/lib/hooks/use-projects'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ProjectMeta } from '@/lib/types'

const GENRE_LABELS: Record<string, string> = {
  玄幻: '玄幻',
  奇幻: '奇幻',
  武侠: '武侠',
  仙侠: '仙侠',
  都市: '都市',
  现实: '现实',
  科幻: '科幻',
  历史: '历史',
  军事: '军事',
  游戏: '游戏',
  体育: '体育',
  灵异: '灵异',
  其他: '其他',
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const d = date instanceof Date ? date : new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay === 1) return '昨天'
  if (diffDay < 7) return `${diffDay}天前`
  return d.toLocaleDateString('zh-CN')
}

interface ProjectCardProps {
  project: ProjectMeta
  onEdit: () => void
  onDelete: () => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const { updateProject } = useProjects()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(project.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== project.title) {
      await updateProject(project.id, { title: titleValue.trim() })
    } else {
      setTitleValue(project.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitleValue(project.title)
      setIsEditingTitle(false)
    }
  }

  const handleCardClick = () => {
    if (!isEditingTitle) {
      router.push(`/projects/${project.id}`)
    }
  }

  return (
    <Card
      className={cn(
        'group relative cursor-pointer transition-all duration-200',
        'hover:border-primary/30 hover:shadow-md'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                ref={inputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-md border border-input px-2 py-0.5 text-base font-semibold bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            ) : (
              <h3
                className="text-base font-semibold text-foreground truncate transition-colors group-hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingTitle(true)
                }}
                title="点击编辑标题"
              >
                {project.title}
              </h3>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                aria-label="更多操作"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                打开
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <Settings className="h-3.5 w-3.5" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.genre && (
          <Badge variant="secondary" className="font-normal">
            {GENRE_LABELS[project.genre] ?? project.genre}
          </Badge>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-2">
            <span className="tabular-nums">{project.wordCount.toLocaleString()} 字</span>
            {project.todayWordCount > 0 && (
              <span className="text-primary/70">
                今日 +{project.todayWordCount.toLocaleString()}
              </span>
            )}
          </div>
          <span>{formatRelativeTime(project.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
