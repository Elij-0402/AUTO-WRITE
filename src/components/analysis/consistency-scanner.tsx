'use client'

import { useState, useMemo } from 'react'
import { ShieldCheck, AlertTriangle, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useConsistencyScan } from '@/lib/hooks/use-consistency-scan'
import type { AIClientConfig } from '@/lib/ai/providers/types'
import type { WorldEntry } from '@/lib/types'
import type { Chapter } from '@/lib/types/chapter'
import type { WorldEntryType } from '@/lib/types'

const TYPE_LABEL: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间线',
}

const SEVERITY_COLOR: Record<string, string> = {
  high: 'text-[hsl(var(--destructive))]',
  medium: 'text-[hsl(var(--warning))]',
  low: 'text-muted-foreground',
}

interface ConsistencyScannerProps {
  projectId: string
  config: AIClientConfig
  worldEntries: WorldEntry[]
  chapters: Chapter[]
}

export function ConsistencyScanner({
  projectId,
  config,
  worldEntries,
  chapters,
}: ConsistencyScannerProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all')

  const { state, results, progress, error, startScan, exemptResult, cancelScan, clearResults } =
    useConsistencyScan({
      projectId,
      config,
      worldEntries,
    })

  const isScanning = state === 'scanning'
  const hasResults = state === 'results_ready' && results.length > 0
  const noViolations = state === 'results_ready' && results.length === 0

  // Group results by entry
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
    // Empty array = scan all chapters; specific id = scan one
    const chapterIds = selectedChapterId === 'all' ? [] : [selectedChapterId]
    await startScan(chapterIds)
  }

  const handleExempt = async (violation: (typeof results)[0]) => {
    await exemptResult(violation)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[hsl(var(--success))]" />
        <h2 className="text-[15px] font-medium">主动一致性扫描</h2>
      </div>

      {/* Scan controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] surface-2 p-4">
        {/* Chapter selection */}
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

        {/* Scan button */}
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

        {/* Clear results */}
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
        <div className="rounded-[var(--radius-card)] bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-[13px] text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {/* Scanning state */}
      {isScanning && progress && progress.currentChapterTitle && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-[13px]">
            正在扫描「{progress.currentChapterTitle}」...
          </span>
        </div>
      )}

      {/* Empty state - no violations */}
      {noViolations && (
        <div className="text-center py-12 rounded-[var(--radius-card)] surface-2">
          <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--success))] opacity-40" />
          <p className="text-[14px] font-medium text-foreground">未发现矛盾</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            章节内容与世界观百科保持一致
          </p>
        </div>
      )}

      {/* Results list */}
      {hasResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">
              发现 <span className="text-foreground font-medium">{results.length}</span> 个矛盾
            </p>
          </div>

          <div className="space-y-3">
            {groupedResults.map(([entryName, { entryType, items }]) => (
              <div
                key={entryName}
                className="rounded-[var(--radius-card)] surface-2 overflow-hidden"
              >
                {/* Group header */}
                <div className="px-4 py-3 surface-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
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
                    <div key={idx} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
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
                        <p className="text-[12.5px] leading-[1.6] text-foreground/80">
                          {violation.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground"
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

      {/* Idle state - no scan yet */}
      {state === 'idle' && !hasResults && !noViolations && (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-[13px]">
            选择章节后开始扫描，AI 将检查内容与世界观百科的一致性
          </p>
        </div>
      )}
    </div>
  )
}
