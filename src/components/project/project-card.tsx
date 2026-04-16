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

/** Genre-based solid accent colors — warm OKLCH tones */
const GENRE_COLORS: Record<string, string> = {
  玄幻: 'oklch(0.55 0.12 300)',  // plum
  奇幻: 'oklch(0.55 0.11 290)',  // indigo-plum
  武侠: 'oklch(0.58 0.13 70)',   // amber-gold
  仙侠: 'oklch(0.55 0.12 80)',   // warm gold
  都市: 'oklch(0.55 0.08 185)',   // muted teal
  现实: 'oklch(0.53 0.07 180)',   // quiet teal
  科幻: 'oklch(0.55 0.08 240)',   // slate-blue
  历史: 'oklch(0.52 0.08 55)',    // warm brown
  军事: 'oklch(0.50 0.06 50)',    // deep brown
  游戏: 'oklch(0.55 0.10 145)',   // muted green
  体育: 'oklch(0.58 0.11 155)',   // fresh green
  灵异: 'oklch(0.50 0.10 310)',   // muted purple
  其他: 'oklch(0.55 0.005 60)',   // warm neutral
}

function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] || 'oklch(0.50 0.005 60)'
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

  const genreColor = getGenreColor(project.genre)

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg bg-[var(--surface-1)] transition-all duration-300 ease-[var(--ease-out-quint)] hover:bg-[var(--surface-hover)] hover:-translate-y-0.5 cursor-pointer shadow-[0_2px_12px_-4px_oklch(0.10_0.01_55_/_0.15)] dark:shadow-[0_2px_12px_-4px_oklch(0.05_0.01_55_/_0.4)]"
      onClick={handleCardClick}
    >
      {/* Genre color top band */}
      <div
        className="h-0.5 w-full"
        style={{ background: genreColor }}
      />

      {/* Card content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title — editable inline */}
        <div className="mb-1.5">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-md border border-[var(--primary)] px-2 py-1 text-[1.125rem] font-semibold text-[var(--foreground)] bg-[var(--surface-0)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-muted)] transition-colors"
            />
          ) : (
            <h3
              className="text-[1.125rem] font-bold text-[var(--foreground)] truncate transition-colors duration-200 hover:text-[var(--primary)]"
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
          <span
            className="mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              background: `color-mix(in oklch, ${genreColor} 12%, transparent)`,
              color: genreColor,
            }}
          >
            {GENRE_LABELS[project.genre] ?? project.genre}
          </span>
        )}

        {/* Metadata */}
        <div className="mt-auto flex flex-col gap-1 text-xs text-[var(--text-tertiary)]">
          <div className="flex items-center gap-2">
            <span>{project.wordCount.toLocaleString()} 字</span>
            {project.todayWordCount > 0 && (
              <span className="text-[var(--text-muted)]">
                今日 +{project.todayWordCount.toLocaleString()}
              </span>
            )}
          </div>
          <span>{formatRelativeTime(project.updatedAt)}</span>
        </div>
      </div>

      {/* Three-dot menu */}
      <div ref={menuRef} className="absolute right-3 top-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--surface-0)] text-[var(--text-tertiary)] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full z-10 mt-1.5 w-36 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] py-1 shadow-lg origin-top-right"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setMenuOpen(false); onEdit() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              编辑
            </button>
            <button
              onClick={() => { setMenuOpen(false) }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              设置
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
