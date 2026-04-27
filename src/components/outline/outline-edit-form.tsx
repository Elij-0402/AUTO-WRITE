'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useAutoSave } from '@/lib/hooks/use-autosave'
import { usePlanning } from '@/lib/hooks/use-planning'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OutlineStatus } from '@/lib/types'

interface OutlineEditFormProps {
  projectId: string
  chapterId: string
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious: boolean
  hasNext: boolean
}

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

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  return (
    <Textarea
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

const STATUS_OPTIONS: { value: OutlineStatus; label: string }[] = [
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
]

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
  const { snapshot } = usePlanning(projectId)
  const chapter = chapters.find((c) => c.id === chapterId)
  const linkedPlan = snapshot.chapterPlans.find((plan) => plan.linkedChapterId === chapterId)

  const [localSummary, setLocalSummary] = useState('')
  const [localTargetWordCount, setLocalTargetWordCount] = useState<string>('')
  const [localOutlineStatus, setLocalOutlineStatus] = useState<OutlineStatus>('not_started')
  const [localTitle, setLocalTitle] = useState('')

  // Sync form state when switching to a different chapter.
  // Using the "set state during render" pattern per React docs
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // to avoid useEffect cascading renders.
  const [prevChapterId, setPrevChapterId] = useState<string | null>(chapter?.id ?? null)
  if (chapter && chapter.id !== prevChapterId) {
    setPrevChapterId(chapter.id)
    setLocalSummary(chapter.outlineSummary || '')
    setLocalTargetWordCount(
      chapter.outlineTargetWordCount !== null
        ? String(chapter.outlineTargetWordCount)
        : ''
    )
    setLocalOutlineStatus(chapter.outlineStatus || 'not_started')
    setLocalTitle(chapter.title)
  }

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

  const handleTargetWordCountChange = (value: string) => {
    if (value === '' || /^\d*$/.test(value)) {
      setLocalTargetWordCount(value)
    }
  }

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>章节未找到</p>
      </div>
    )
  }

  const targetWordCount = chapter.outlineTargetWordCount
  const actualWordCount = chapter.wordCount
  const wordCountDisplay = targetWordCount !== null && targetWordCount > 0
    ? `目标: ${targetWordCount.toLocaleString()}字 / 当前: ${actualWordCount.toLocaleString()}字`
    : `目标: 未设定 / 当前: ${actualWordCount.toLocaleString()}字`

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <span className="text-sm font-medium">章节大纲</span>
        <span className="text-xs text-muted-foreground">{isSaving ? '保存中...' : '已保存'}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {linkedPlan ? (
          <div className="px-3 py-2 divider-hair text-[12px] text-muted-foreground">
            <p>{linkedPlan.summary || '该章已关联章纲，建议优先在规划台维护结构信息。'}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="章节标题"
          />
        </div>

        <div className="space-y-2">
          <Label>大纲摘要</Label>
          <AutoGrowTextarea
            value={localSummary}
            onChange={setLocalSummary}
            placeholder="输入章节大纲摘要..."
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>目标字数</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={localTargetWordCount}
              onChange={(e) => handleTargetWordCountChange(e.target.value)}
              placeholder="不设定"
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">字</span>
            {localTargetWordCount && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setLocalTargetWordCount('')}
                title="清除目标字数"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>状态</Label>
          <Select value={localOutlineStatus} onValueChange={(v) => setLocalOutlineStatus(v as OutlineStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="px-3 py-2 rounded-[var(--radius-control)] surface-2 text-[12px] text-muted-foreground text-mono tabular-nums">
          {wordCountDisplay}
        </div>

        <div className="text-[10px] text-mono uppercase tracking-[0.15em] text-muted-foreground/70 space-y-1 pt-3 divider-hair">
          <p>创建于 {formatDateCN(chapter.createdAt)}</p>
          <p>更新于 {formatDateCN(chapter.updatedAt)}</p>
        </div>
      </div>

      <div className="flex gap-2 px-6 py-3 divider-hair">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          上一章
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          className="ml-auto"
        >
          下一章
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
