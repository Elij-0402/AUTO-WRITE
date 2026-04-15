'use client'

import { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X, ArrowRight, ArrowLeft } from 'lucide-react'
import { useRelations } from '@/lib/hooks/use-relations'
import type { WorldEntry, Relation, RelationCategory } from '@/lib/types'

/**
 * Category labels per D-23
 */
const CATEGORY_LABELS: Record<RelationCategory, string> = {
  character_relation: '角色关系',
  general: '通用关联',
}

/**
 * RelationshipSection per D-21, D-22, D-23, D-24, D-25, D-26.
 * - Shows relationship cards with direction, category, description, target entry name
 * - Bidirectional perspective: both entries see the relationship from their side
 * - Cross-entry navigation: clicking target entry navigates to that entry
 */
interface RelationshipSectionProps {
  projectId: string
  sourceEntry: WorldEntry
  allEntries: WorldEntry[]
  onSelectEntry: (id: string) => void
}

export function RelationshipSection({
  projectId,
  sourceEntry,
  allEntries,
  onSelectEntry,
}: RelationshipSectionProps) {
  const { relations, loading, addRelation, deleteRelation } = useRelations(projectId, sourceEntry.id)

  // Filter out already-linked entries for the target dropdown per T-04-08
  const availableTargets = useMemo(() => {
    const linkedIds = new Set(relations.map(r => 
      r.sourceEntryId === sourceEntry.id ? r.targetEntryId : r.sourceEntryId
    ))
    return allEntries.filter(e => 
      e.id !== sourceEntry.id && !linkedIds.has(e.id)
    )
  }, [allEntries, sourceEntry.id, relations])

  // Add relationship dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [category, setCategory] = useState<RelationCategory>('character_relation')
  const [description, setDescription] = useState('')
  const [sourceToTargetLabel, setSourceToTargetLabel] = useState('')

  const handleAddRelation = async () => {
    if (!targetId) return
    await addRelation(targetId, sourceEntry.id, category, description, sourceToTargetLabel)
    // Reset form
    setTargetId('')
    setCategory('character_relation')
    setDescription('')
    setSourceToTargetLabel('')
    setDialogOpen(false)
  }

  const handleDeleteRelation = async (relationId: string) => {
    await deleteRelation(relationId)
  }

  // Render relationship card per D-24
  const renderRelationCard = (relation: Relation) => {
    // Determine if sourceEntry is the source or target of this relation
    const isSource = relation.sourceEntryId === sourceEntry.id
    const targetId = isSource ? relation.targetEntryId : relation.sourceEntryId
    const targetEntry = allEntries.find(e => e.id === targetId)
    
    if (!targetEntry) return null

    // Direction indicator per D-24, D-29
    const directionIndicator = isSource 
      ? { arrow: '→', label: relation.sourceToTargetLabel || '' }
      : { arrow: '←', label: relation.sourceToTargetLabel || '' }

    // Reverse perspective for target perspective per D-22
    const perspectiveLabel = isSource 
      ? directionIndicator.label
      : `← ${directionIndicator.label || '关联'}`

    return (
      <div
        key={relation.id}
        className="group relative flex items-start gap-2 p-3 rounded-lg border border-border-subtle bg-surface-0 hover:border-border-strong transition-colors"
      >
        {/* Direction arrow */}
        <span className="text-text-tertiary flex-shrink-0 mt-0.5">
          {isSource ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </span>

        {/* Card content */}
        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-surface-1 text-text-secondary mb-1">
            {CATEGORY_LABELS[relation.category]}
          </span>

          {/* Description per D-23 */}
          {relation.description && (
            <p className="text-sm text-text-secondary mb-1">
              {relation.description}
            </p>
          )}

          {/* Directional label per D-29 */}
          {perspectiveLabel && (
            <p className="text-xs text-text-tertiary italic mb-1">
              {perspectiveLabel}
            </p>
          )}

          {/* Target entry name (clickable) per D-26 */}
          <button
            onClick={() => onSelectEntry(targetId)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {targetEntry.name}
          </button>
        </div>

        {/* Delete button */}
        <button
          onClick={() => handleDeleteRelation(relation.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-hover transition-opacity"
          aria-label="删除关联"
        >
          <X className="h-3.5 w-3.5 text-stone-400 hover:text-red-500" />
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Section header per D-21 */}
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-text-secondary">
          关联
        </label>
        {/* Add button per D-21 */}
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-border-subtle text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              添加关联
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-panel-elevated rounded-xl shadow-xl p-6 z-50">
              <Dialog.Title className="text-lg font-medium text-foreground mb-4">
                添加关联
              </Dialog.Title>

              {/* Target entry selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  目标条目
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">选择一个条目...</option>
                  {availableTargets.map(entry => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category selection per D-23 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  关系类别
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RelationCategory)}
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="character_relation">角色关系</option>
                  <option value="general">通用关联</option>
                </select>
              </div>

              {/* Description per D-23 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  关系描述
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：师徒、朋友、居住"
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Directional label per D-29 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  方向标签
                </label>
                <input
                  type="text"
                  value={sourceToTargetLabel}
                  onChange={(e) => setSourceToTargetLabel(e.target.value)}
                  placeholder="例如：是师父、居住于"
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:bg-surface-hover transition-colors"
                  >
                    取消
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleAddRelation}
                  disabled={!targetId}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  添加
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Relationship cards per D-24 */}
      {loading ? (
        <div className="text-sm text-text-tertiary">加载中...</div>
      ) : relations.length === 0 ? (
        <div className="text-sm text-text-tertiary italic">
          还没有关联关系
        </div>
      ) : (
        <div className="space-y-2">
          {relations.map(renderRelationCard)}
        </div>
      )}
    </div>
  )
}
