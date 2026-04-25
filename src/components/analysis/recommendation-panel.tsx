'use client'

import type { WorldEntry, WorldEntryType } from '@/lib/types/world-entry'
import type { AIRecommendationTarget } from '@/lib/ai/relation-recommendation'
import { cn } from '@/lib/utils'

interface RecommendationPanelProps {
  sourceNode: WorldEntry
  recommendations: AIRecommendationTarget[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  onSelectRecommendation: (rec: AIRecommendationTarget) => void
  onClose: () => void
  position: { x: number; y: number }
}

const TYPE_COLORS: Record<WorldEntryType, string> = {
  character: 'border-[hsl(38_92%_58%)]',
  location: 'border-[hsl(162_44%_55%)]',
  rule: 'border-[hsl(260_42%_70%)]',
  timeline: 'border-[hsl(40_14%_92%/_0.8)]',
}

const TYPE_LABELS: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间',
}

export function RecommendationPanel({
  sourceNode,
  recommendations,
  isLoading,
  error,
  onRetry,
  onSelectRecommendation,
  onClose,
  position,
}: RecommendationPanelProps) {
  return (
    <div
      className="fixed z-50 w-[280px] max-h-[400px] overflow-y-auto surface-2 border border-line-strong rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        left: Math.min(position.x + 12, globalThis.innerWidth - 300),
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="sticky top-0 surface-2 border-b border-line p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-4 h-4 rounded-full border-2',
                TYPE_COLORS[sourceNode.type]
              )}
            />
            <span className="font-medium text-sm">{sourceNode.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="关闭"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {TYPE_LABELS[sourceNode.type]}
        </p>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">AI 分析中...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={onRetry}
              className="text-sm text-primary hover:underline"
            >
              重试
            </button>
          </div>
        )}

        {!isLoading && !error && recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            暂未发现潜在关系
          </p>
        )}

        {!isLoading && !error && recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              为您推荐 {recommendations.length} 个潜在关系
            </p>
            {recommendations.map((rec, idx) => (
              <RecommendationItem
                key={idx}
                rec={rec}
                onClick={() => onSelectRecommendation(rec)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecommendationItem({
  rec,
  onClick,
}: {
  rec: AIRecommendationTarget
  onClick: () => void
}) {
  const { targetNode, suggestedRelation } = rec

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-md border transition-all',
        'hover:surface-3 active:scale-[0.98]',
        targetNode.isNew
          ? 'border-dashed border-[hsl(200_85%_60%)] bg-[hsl(200_85%_60%/_0.05)]'
          : 'border-[hsl(237_231_220/_0.15)] bg-surface-1'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-3 h-3 rounded-full border',
              targetNode.isNew ? 'border-dashed border-muted-foreground' : 'border-2',
              targetNode.type && TYPE_COLORS[targetNode.type]
            )}
          />
          <span className="text-sm font-medium">{targetNode.name}</span>
          {targetNode.isNew && (
            <span className="text-xs text-muted-foreground">建议创建</span>
          )}
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground">
          {suggestedRelation.confidence > 0.8 ? '高' : suggestedRelation.confidence > 0.6 ? '中' : '低'}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
          {suggestedRelation.category === 'character_relation' ? '角色关系' : '一般关系'}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {suggestedRelation.description}
        </span>
      </div>
    </button>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
