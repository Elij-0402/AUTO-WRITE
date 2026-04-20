'use client'

import { useState, useEffect } from 'react'
import { createProjectDB } from '@/lib/db/project-db'
import { getABTestMetricsByConversation, aggregateABTestMetrics } from '@/lib/db/ab-metrics-queries'
import { ChevronDown, ChevronUp, MessageSquareText, AlertCircle, Star, Zap } from 'lucide-react'

interface CitationsAnalyticsPanelProps {
  projectId: string
  conversationId: string | null
}

export function CitationsAnalyticsPanel({ projectId, conversationId }: CitationsAnalyticsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [stats, setStats] = useState<{
    totalCitations: number
    avgEmptyCitationRate: number | null
    avgAuthorRating: number | null
    totalCacheReadTokens: number
  } | null>(null)

  useEffect(() => {
    if (!conversationId) return
    const db = createProjectDB(projectId)
    getABTestMetricsByConversation(db, conversationId).then(metrics => {
      const agg = aggregateABTestMetrics(metrics)
      setStats({
        totalCitations: agg.totalCitations,
        avgEmptyCitationRate: agg.avgEmptyCitationRate,
        avgAuthorRating: agg.avgAuthorRating,
        totalCacheReadTokens: agg.totalCacheReadTokens,
      })
    }).catch(() => {})
  }, [projectId, conversationId])

  if (!stats) return null

  const emptyRateDisplay = stats.avgEmptyCitationRate !== null
    ? `${Math.round(stats.avgEmptyCitationRate * 100)}%`
    : '—'
  const ratingDisplay = stats.avgAuthorRating !== null
    ? stats.avgAuthorRating.toFixed(1)
    : '—'

  const summaryText = stats.totalCitations > 0
    ? `本次对话 ${stats.totalCitations} 次引用 · 空引用率 ${emptyRateDisplay}`
    : '本次对话暂无引用数据'

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        <span>{summaryText}</span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MessageSquareText className="h-3 w-3" />
            <span>总引用次数</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">{stats.totalCitations}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>空引用率</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">{emptyRateDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>平均评分</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">{ratingDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>节省 tokens</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">{stats.totalCacheReadTokens.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}