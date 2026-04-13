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
  return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${(hue + 45) % 360}, 70%, 45%))`
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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Cover image placeholder — gradient based on project ID */}
      <div
        className="h-36 w-full"
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
              className="w-full rounded border border-zinc-300 px-1 py-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-50 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          ) : (
            <h3
              className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate hover:text-zinc-600 dark:hover:text-zinc-300"
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
          <span className="mb-2 inline-flex w-fit rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {GENRE_LABELS[project.genre] ?? project.genre}
          </span>
        )}

        {/* Metadata */}
        <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/40"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setMenuOpen(false); onEdit() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Pencil className="h-4 w-4" />
              编辑
            </button>
            <button
              onClick={() => { setMenuOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Settings className="h-4 w-4" />
              设置
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
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
