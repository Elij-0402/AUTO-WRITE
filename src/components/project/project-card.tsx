'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pencil, Settings, Trash2 } from 'lucide-react'
import { useProjects } from '@/lib/hooks/use-projects'
import type { ProjectMeta } from '@/lib/types'

/** Genre label map for Chinese display */
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

/** Format relative time in Chinese */
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

/** Generate a gradient color from project ID hash */
function getGradientFromId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${hue}, 40%, 80%), hsl(${(hue + 45) % 360}, 40%, 70%))`
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== project.title) {
      await updateProject(project.id, { title: titleValue.trim() })
    } else {
      setTitleValue(project.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitleValue(project.title)
      setIsEditingTitle(false)
    }
    // Don't interfere with IME composition
    if (e.nativeEvent.isComposing) return
  }

  const handleCardClick = () => {
    if (!isEditingTitle) {
      router.push(`/projects/${project.id}`)
    }
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[var(--surface-0)] border border-[var(--border-subtle)] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] transition-all duration-500 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.2)] hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Cover image placeholder — gradient based on project ID */}
      <div
        className="h-20 w-full"
        style={{ background: getGradientFromId(project.id) }}
      />

      {/* Card content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title — editable inline */}
        <div className="mb-2">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              onCompositionEnd={handleTitleSave}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-lg border border-[var(--primary)] px-2 py-1 text-sm font-semibold text-[var(--foreground)] bg-[var(--surface-1)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
            />
          ) : (
            <h3
              className="text-base font-bold text-[var(--foreground)] truncate hover:text-[var(--primary)] transition-colors duration-200"
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

        {/* Genre badge */}
        {project.genre && (
          <span className="mb-3 inline-flex w-fit rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)] border border-[var(--primary)]/20">
            {GENRE_LABELS[project.genre] ?? project.genre}
          </span>
        )}

        {/* Metadata */}
        <div className="mt-auto flex items-center justify-between text-xs text-[var(--foreground)]/50 font-medium">
          <span>字数：{project.wordCount.toLocaleString()}</span>
          <span>{formatRelativeTime(project.updatedAt)}</span>
        </div>
      </div>

      {/* Three-dot menu */}
      <div ref={menuRef} className="absolute right-2 top-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full glass-panel text-[var(--foreground)] opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100 hover:scale-105 active:scale-95"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full z-10 mt-2 w-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] py-1.5 shadow-xl glass-panel origin-top-right transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setMenuOpen(false); onEdit() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-1)] transition-colors"
            >
              <Pencil className="h-4 w-4" />
              编辑
            </button>
            <button
              onClick={() => { setMenuOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-1)] transition-colors"
            >
              <Settings className="h-4 w-4" />
              设置
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
