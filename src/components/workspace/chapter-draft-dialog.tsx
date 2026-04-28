'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useConsistencyScan } from '@/lib/hooks/use-consistency-scan'
import type { AIClientConfig } from '@/lib/ai/client'
import type { WorldEntry } from '@/lib/types/world-entry'
import type { Chapter } from '@/lib/types/chapter'
import type { WorldEntryType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChapterDraftPanel, type DraftApplyMode } from './chapter-draft-panel'

type DialogTab = 'draft' | 'scan'

const TYPE_LABEL: Record<WorldEntryType, string> = {
  character: '角色',
  faction: '势力',
  location: '地点',
  rule: '规则',
  secret: '秘密',
  event: '事件',
  timeline: '时间线',
}

const SEVERITY_COLOR: Record<string, string> = {
  high: 'text-[hsl(var(--destructive))]',
  medium: 'text-[hsl(var(--warning))]',
  low: 'text-muted-foreground',
}

interface ChapterDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  activeChapterId: string | null
  config: AIClientConfig
  worldEntries: WorldEntry[]
  chapters: Chapter[]
  onDraftAccepted: (draft: string, mode: DraftApplyMode) => void
}

export function ChapterDraftDialog({
  open,
  onOpenChange,
  projectId,
  activeChapterId,
  config,
  worldEntries,
  chapters,
  onDraftAccepted,
}: ChapterDraftDialogProps) {
  const [activeTab, setActiveTab] = useState<DialogTab>('draft')

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleAcceptAndClose = useCallback(
    (draft: string, mode: DraftApplyMode) => {
      onDraftAccepted(draft, mode)
      onOpenChange(false)
    },
    [onDraftAccepted, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeTab === 'draft' ? (
              <>
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))]" />
                AI 章节草稿生成
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--success))]" />
                AI 一致性扫描
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'draft'
              ? '输入章节大纲，AI 将基于世界观百科生成符合设定的草稿内容'
              : '扫描章节内容，检查与世界观的矛盾'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-[hsl(var(--border))] pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={cn(
              'px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'draft'
                ? 'border-[hsl(var(--accent))] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            草稿生成
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={cn(
              'px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'scan'
                ? 'border-[hsl(var(--success))] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            一致性扫描
          </button>
        </div>

        {activeTab === 'draft' ? (
          <ChapterDraftPanel
            projectId={projectId}
            activeChapterId={activeChapterId}
            config={config}
            worldEntries={worldEntries}
            onAcceptDraft={(draft, meta) => handleAcceptAndClose(draft, meta.applyMode)}
            onClose={handleClose}
            onOpenAIConfig={() => {}}
          />
        ) : (
          <ConsistencyScanTab
            projectId={projectId}
            config={config}
            worldEntries={worldEntries}
            chapters={chapters}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ConsistencyScanTabProps {
  projectId: string
  config: AIClientConfig
  worldEntries: WorldEntry[]
  chapters: Chapter[]
}

function ConsistencyScanTab({
  projectId,
  config,
  worldEntries,
  chapters,
}: ConsistencyScanTabProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all')

  const {
    state,
    results,
    summary,
    progress,
    error,
    startScan,
    exemptResult,
    cancelScan,
    clearResults,
  } = useConsistencyScan({
    projectId,
    config,
    worldEntries,
  })

  const isScanning = state === 'scanning'
  const hasResults = state === 'results_ready' && results.length > 0
  const noViolations = state === 'results_ready' && results.length === 0 && summary?.status === 'clean'
  const hasCoverageWarning =
    state === 'results_ready' &&
    (summary?.status === 'missing_world_bible' || summary?.status === 'coverage_warning')

  const groupedResults = useMemo(() => {
    const map = new Map<string, { entryType: WorldEntryType; items: typeof results }>()
    for (const v of results) {
      const existing = map.get(v.entryName)
      if (existing) {
        existing.items.push(v)
      } else {
        map.set(v.entryName, { entryType: v.entryType, items: [v] })
      }
    }
    return [...map.entries()].sort((a, b) => b[1].items.length - a[1].items.length)
  }, [results])

  const handleStartScan = async () => {
    const chapterIds = selectedChapterId === 'all' ? [] : [selectedChapterId]
    await startScan(chapterIds)
  }

  const handleExempt = async (violation: (typeof results)[0]) => {
    await exemptResult(violation)
  }

  return (
    <div className="space-y-4 py-2">
      {/* Scan controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">扫描范围：</span>
          <Select
            value={selectedChapterId}
            onValueChange={(v) => setSelectedChapterId(v)}
            disabled={isScanning}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择章节" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全本扫描</SelectItem>
              {chapters.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  {ch.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isScanning ? (
          <Button variant="destructive" size="sm" onClick={cancelScan}>
            <X className="h-4 w-4" />
            取消扫描
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartScan}
            disabled={chapters.length === 0}
          >
            <ShieldCheck className="h-4 w-4" />
            开始扫描
          </Button>
        )}

        {state === 'results_ready' && (
          <Button variant="ghost" size="sm" onClick={clearResults}>
            清除结果
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {isScanning && progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>
              {progress.currentChapterTitle
                ? `正在扫描：${progress.currentChapterTitle}`
                : '扫描进度'}
            </span>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--surface-3))] overflow-hidden">
            <div
              className="h-full bg-[hsl(var(--success))] transition-all duration-300 ease-out"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && error && (
        <div className="rounded-sm bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-[13px] text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {/* Scanning state */}
      {isScanning && progress && progress.currentChapterTitle && (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-[13px]">
            正在扫描「{progress.currentChapterTitle}」...
          </span>
        </div>
      )}

      {/* Empty state - no violations */}
      {noViolations && (
        <div className="text-center py-10 rounded-sm surface-2">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--success))] opacity-40" />
          <p className="text-[14px] font-medium text-foreground">{summary?.title ?? '未发现矛盾'}</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            {summary?.description ?? '章节内容与世界观百科保持一致'}
          </p>
        </div>
      )}

      {hasCoverageWarning && (
        <div className="text-center py-10 rounded-sm surface-2">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--warning))] opacity-60" />
          <p className="text-[14px] font-medium text-foreground">{summary?.title}</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            {summary?.description}
          </p>
        </div>
      )}

      {/* Results list */}
      {hasResults && (
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            发现 <span className="text-foreground font-medium">{results.length}</span>{' '}
            个矛盾
          </p>

          <div className="space-y-2">
            {groupedResults.map(([entryName, { entryType, items }]) => (
              <div
                key={entryName}
                className="rounded-sm surface-2 overflow-hidden"
              >
                {/* Group header */}
                <div className="px-3 py-2 surface-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
                    <span className="text-[13px] font-medium">{entryName}</span>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      {TYPE_LABEL[entryType]}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {items.length} 处矛盾
                  </span>
                </div>

                {/* Violation items */}
                <div className="divide-y divide-[hsl(var(--border))]">
                  {items.map((violation, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[11px] font-medium uppercase ${
                              SEVERITY_COLOR[violation.severity]
                            }`}
                          >
                            {violation.severity === 'high'
                              ? '严重'
                              : violation.severity === 'medium'
                                ? '中等'
                                : '轻微'}
                          </span>
                        </div>
                        <p className="text-[12px] leading-[1.6] text-foreground/80">
                          {violation.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground px-2"
                        onClick={() => handleExempt(violation)}
                      >
                        豁免
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idle state */}
      {state === 'idle' && !hasResults && !noViolations && !hasCoverageWarning && (
        <div className="text-center py-8 text-muted-foreground">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-[13px]">
            选择章节后开始扫描，AI 将检查内容与世界观百科的一致性
          </p>
        </div>
      )}
    </div>
  )
}
