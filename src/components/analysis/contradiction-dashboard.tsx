'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { useContradictions } from '@/lib/hooks/use-contradictions'
import { useConsistencyExemptions } from '@/lib/hooks/use-consistency-exemptions'
import type { WorldEntryType } from '@/lib/types'

interface ChapterSummary {
  id: string
  title: string
  order: number
}

const TYPE_LABEL: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间线',
}

type Filter = 'all' | 'open' | 'exempted'

const FILTER_OPTIONS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'open', label: '未豁免' },
  { id: 'exempted', label: '已豁免' },
]

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

interface ContradictionRowProps {
  entryName: string
  entryType: WorldEntryType
  description: string
  exempted: boolean
  createdAt: number
  chapterId?: string
  chapterTitle?: string
  exemptionKey?: string
  onRevoke?: (entryName: string, entryType: string) => void
}

function ContradictionRow({ entryName, entryType, description, exempted, createdAt, chapterId, chapterTitle, exemptionKey, onRevoke }: ContradictionRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      aria-label={`${exempted ? '已豁免' : '未豁免'}矛盾：${entryName}`}
      className="rounded-[var(--radius-card)] surface-2 p-3 animate-fade-up"
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? '收起' : '展开'}
        >
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-[13px] font-medium ${exempted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {entryName}
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {TYPE_LABEL[entryType]}
            </span>
            {exempted && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--muted))] text-muted-foreground">
                已豁免
              </span>
            )}
            {exemptionKey && (
              <button
                onClick={() => onRevoke?.(entryName, entryType)}
                className="text-[11px] text-muted-foreground hover:text-[hsl(var(--accent-coral))] underline ml-auto"
              >
                撤销豁免
              </button>
            )}
          </div>
          {expanded && (
            <div className="space-y-2">
              <p className="text-[12.5px] leading-[1.7] text-foreground/80 pl-4 border-l-2 border-[hsl(var(--accent-coral))]/30">
                {description}
              </p>
              <div className="flex items-center gap-3 pl-4">
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(createdAt)}
                </span>
                {chapterId && (
                  <a
                    href={`#chapter-${chapterId}`}
                    className="text-[11px] text-[hsl(var(--accent-coral))] hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    {chapterTitle ? `去第 ${chapterTitle} 章` : `去第 X 章`}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ContradictionGroupProps {
  entryName: string
  entryType: WorldEntryType
  rows: Array<{
    exempted: boolean
    description: string
    createdAt: number
    chapterId?: string
    exemptionKey?: string
  }>
  chapters?: ChapterSummary[]
  onRevoke?: (entryName: string, entryType: string) => void
}

function ContradictionGroup({ entryName, entryType, rows, chapters = [], onRevoke }: ContradictionGroupProps) {
  const [expanded, setExpanded] = useState(true)
  const openCount = rows.filter(r => !r.exempted).length

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-control)] hover:bg-[hsl(var(--surface-2))] transition-colors group"
        aria-expanded={expanded}
      >
        <span className="text-[12px] text-muted-foreground">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        <span className="text-[13px] font-medium text-foreground">{entryName}</span>
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{TYPE_LABEL[entryType]}</span>
        <span className={`text-[11px] ${openCount > 0 ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground'}`}>
          {openCount > 0 ? `${openCount} 个未解决` : '全部已豁免'}
        </span>
      </button>
      {expanded && (
        <div className="space-y-1 pl-2">
          {rows.map((row, i) => {
            const chapter = chapters.find(c => c.id === row.chapterId)
            return (
              <ContradictionRow
                key={i}
                entryName={entryName}
                entryType={entryType}
                description={row.description}
                exempted={row.exempted}
                createdAt={row.createdAt}
                chapterId={row.chapterId}
                chapterTitle={chapter?.title}
                exemptionKey={row.exemptionKey}
                onRevoke={onRevoke}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ContradictionDashboardProps {
  projectId: string
  chapters?: ChapterSummary[]
}

export function ContradictionDashboard({ projectId, chapters = [] }: ContradictionDashboardProps) {
  const { contradictions } = useContradictions(projectId)
  const { revokeExemption } = useConsistencyExemptions(projectId)
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'open') return contradictions.filter(c => !c.exempted)
    if (filter === 'exempted') return contradictions.filter(c => c.exempted)
    return contradictions
  }, [contradictions, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, { entryType: WorldEntryType; rows: typeof filtered }>()
    for (const c of filtered) {
      const existing = map.get(c.entryName)
      if (existing) {
        existing.rows.push(c)
      } else {
        map.set(c.entryName, { entryType: c.entryType, rows: [c] })
      }
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b.rows.length - a.rows.length || a.entryType.localeCompare(b.entryType))
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Header + filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
          <h2 className="text-[15px] font-medium">矛盾记录</h2>
          {contradictions.length > 0 && (
            <span className="text-[12px] text-muted-foreground">
              {contradictions.filter(c => !c.exempted).length} 未解决 / {contradictions.length} 总计
            </span>
          )}
        </div>
        <div className="flex gap-1 surface-1 rounded-[var(--radius-control)] p-0.5">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-2.5 py-1 text-[12px] rounded-[var(--radius-sm)] transition-colors ${
                filter === opt.id
                  ? 'bg-[hsl(var(--surface-3))] text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state (DSN-2A) */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-[13px]">
            {filter === 'all'
              ? '本项目暂无记录到的矛盾。开始聊天时 AI 会自动检查一致性。'
              : '无符合当前筛选的矛盾。'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-2 text-[12px] text-[hsl(var(--accent-coral))] hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* Grouped list */}
      <div className="space-y-3">
        {grouped.map(([entryName, { entryType, rows }]) => {
          const rowsWithKeys = rows.map(row => ({
            ...row,
            exemptionKey: row.exempted ? `${entryName}:${entryType}` : undefined,
          }))
          return (
            <ContradictionGroup
              key={entryName}
              entryName={entryName}
              entryType={entryType}
              rows={rowsWithKeys}
              chapters={chapters}
              onRevoke={revokeExemption}
            />
          )
        })}
      </div>
    </div>
  )
}
