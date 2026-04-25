'use client'

import { useState } from 'react'
import type { WorldEntry } from '@/lib/types/world-entry'
import type { RelationCategory } from '@/lib/types/relation'
import type { AIRecommendationTarget } from '@/lib/ai/relation-recommendation'

interface RelationFormProps {
  sourceNode: WorldEntry
  recommendation: AIRecommendationTarget
  onConfirm: (category: RelationCategory, description: string) => Promise<void>
  onCancel: () => void
}

export function RelationForm({
  sourceNode,
  recommendation,
  onConfirm,
  onCancel,
}: RelationFormProps) {
  const [category, setCategory] = useState<RelationCategory>(
    recommendation.suggestedRelation.category
  )
  const [description, setDescription] = useState(
    recommendation.suggestedRelation.description
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onConfirm(category, description)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="surface-2 border border-line-strong rounded-lg w-[360px] max-w-[90vw] shadow-xl">
        <div className="p-4 border-b border-line">
          <h3 className="font-medium">确认关系</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Source */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">源条目</label>
            <p className="text-sm font-medium">{sourceNode.name}</p>
          </div>

          {/* Target */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">目标条目</label>
            <p className="text-sm font-medium">
              {recommendation.targetNode.name}
              {recommendation.targetNode.isNew && (
                <span className="ml-2 text-xs text-muted-foreground">(将创建)</span>
              )}
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">关系类型</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as RelationCategory)}
              className="w-full h-9 px-3 text-sm rounded-md border border-line bg-background"
            >
              <option value="character_relation">角色关系</option>
              <option value="general">一般关系</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">关系描述</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="例如：师徒、战友、对手"
              className="w-full h-9 px-3 text-sm rounded-md border border-line bg-background"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 px-4 text-sm rounded-md border border-line hover:surface-2 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? '创建中...' : '确认建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
