'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useAutoSave } from '@/lib/hooks/use-autosave'
import type { Chapter, OutlineStatus } from '@/lib/types'

/**
 * Outline editing form per D-17, D-20, D-21, D-22, D-23.
 * 
 * Per D-17: clicking outline entry switches editor area to this form.
 * Per D-18: sidebar stays visible when editing outline.
 * Per D-20: Previous/Next buttons navigate between chapters sequentially.
 * Per D-21: Summary textarea auto-grows — no fixed height with scrollbar.
 * Per D-22: Form shows title, summary, target word count, status dropdown, timestamps.
 * Per D-23: Word count comparison shows target vs actual.
 * Per D-25: Auto-save with 500ms debounce (same pattern as editor autosave).
 */
interface OutlineEditFormProps {
  projectId: string
  chapterId: string
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious: boolean
  hasNext: boolean
}

/**
 * Auto-growing textarea per D-21.
 * Starts at 3 rows minimum, grows with content, no fixed height with scrollbar.
 */
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize on content change
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to recalculate
      textarea.style.height = 'auto'
      // Set to scrollHeight to grow with content
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      rows={3}
      style={{ minHeight: '5rem', overflowY: 'auto' }}
    />
  )
}

/**
 * Status label mapping per D-07.
 */
const STATUS_OPTIONS: { value: OutlineStatus; label: string }[] = [
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
]

/**
 * Format date in Chinese locale per D-22.
 */
function formatDateCN(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function OutlineEditForm({
  projectId,
  chapterId,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: OutlineEditFormProps) {
  const { chapters, renameChapter, updateOutlineFields } = useChapters(projectId)
  const chapter = chapters.find((c) => c.id === chapterId)

  // Local state for immediate responsiveness (auto-saved per D-25)
  const [localSummary, setLocalSummary] = useState('')
  const [localTargetWordCount, setLocalTargetWordCount] = useState<string>('')
  const [localOutlineStatus, setLocalOutlineStatus] = useState<OutlineStatus>('not_started')

  // Sync local state when chapter changes (switching between outline entries)
  useEffect(() => {
    if (chapter) {
      setLocalSummary(chapter.outlineSummary || '')
      setLocalTargetWordCount(
        chapter.outlineTargetWordCount !== null
          ? String(chapter.outlineTargetWordCount)
          : ''
      )
      setLocalOutlineStatus(chapter.outlineStatus || 'not_started')
    }
  }, [chapter?.id, chapter?.outlineSummary, chapter?.outlineTargetWordCount, chapter?.outlineStatus])

  // Local title state for editing
  const [localTitle, setLocalTitle] = useState('')
  useEffect(() => {
    if (chapter) {
      setLocalTitle(chapter.title)
    }
  }, [chapter?.id, chapter?.title])

  // Auto-save outline fields per D-25 (500ms debounce)
  const { isSaving } = useAutoSave(
    async () => {
      if (!chapterId) return
      await updateOutlineFields(chapterId, {
        outlineSummary: localSummary,
        outlineTargetWordCount: localTargetWordCount === '' ? null : Number(localTargetWordCount),
        outlineStatus: localOutlineStatus,
      })
    },
    [localSummary, localTargetWordCount, localOutlineStatus, chapterId],
    500
  )

  // Auto-save title via renameChapter per plan
  useAutoSave(
    async () => {
      if (!chapterId || !localTitle.trim()) return
      if (localTitle.trim() !== chapter?.title) {
        await renameChapter(chapterId, localTitle.trim())
      }
    },
    [localTitle, chapterId],
    500
  )

  // Handle target word count input — allow empty (null) or positive numbers
  const handleTargetWordCountChange = (value: string) => {
    if (value === '' || /^\d*$/.test(value)) {
      setLocalTargetWordCount(value)
    }
  }

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        <p>章节未找到</p>
      </div>
    )
  }

  // Word count comparison per D-23
  const targetWordCount = chapter.outlineTargetWordCount
  const actualWordCount = chapter.wordCount
  const wordCountDisplay = targetWordCount !== null && targetWordCount > 0
    ? `目标: ${targetWordCount.toLocaleString()}字 / 当前: ${actualWordCount.toLocaleString()}字`
    : `目标: 未设定 / 当前: ${actualWordCount.toLocaleString()}字`

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with save status */}
      <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{isSaving ? '保存中...' : '已保存'}</span>
      </div>

      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Title per D-22 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            标题
          </label>
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            placeholder="章节标题"
          />
        </div>

        {/* Summary — auto-growing textarea per D-21 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            大纲摘要
          </label>
          <AutoGrowTextarea
            value={localSummary}
            onChange={setLocalSummary}
            placeholder="输入章节大纲摘要..."
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 resize-none"
          />
        </div>

        {/* Target word count per D-22, D-23 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            目标字数
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={localTargetWordCount}
              onChange={(e) => handleTargetWordCountChange(e.target.value)}
              className="w-32 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              placeholder="不设定"
            />
            <span className="text-sm text-zinc-400">字</span>
            {localTargetWordCount && (
              <button
                onClick={() => setLocalTargetWordCount('')}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                title="清除目标字数"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status dropdown per D-07, D-22 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            状态
          </label>
          <select
            value={localOutlineStatus}
            onChange={(e) => setLocalOutlineStatus(e.target.value as OutlineStatus)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Word count comparison per D-23 */}
        <div className="mb-4 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">{wordCountDisplay}</span>
        </div>

        {/* Timestamps per D-22 */}
        <div className="text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
          <p>创建于 {formatDateCN(chapter.createdAt)}</p>
          <p>更新于 {formatDateCN(chapter.updatedAt)}</p>
        </div>
      </div>

      {/* Previous/Next navigation per D-20 */}
      <div className="flex gap-2 px-6 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← 上一章
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed ml-auto transition-colors"
        >
          下一章 →
        </button>
      </div>
    </div>
  )
}