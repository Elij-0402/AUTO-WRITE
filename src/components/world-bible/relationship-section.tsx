'use client'

import { useMemo, useState } from 'react'
import { Plus, X, ArrowRight, ArrowLeft } from 'lucide-react'
import { useRelations } from '@/lib/hooks/use-relations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WorldEntry, Relation, RelationCategory } from '@/lib/types'

const CATEGORY_LABELS: Record<RelationCategory, string> = {
  character_relation: '角色关系',
  general: '通用关联',
}

function getDefaultCategory(entryType: WorldEntry['type']): RelationCategory {
  return entryType === 'character' ? 'character_relation' : 'general'
}

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

  const availableTargets = useMemo(() => {
    const linkedIds = new Set(relations.map(r =>
      r.sourceEntryId === sourceEntry.id ? r.targetEntryId : r.sourceEntryId
    ))
    return allEntries.filter(e =>
      e.id !== sourceEntry.id && !linkedIds.has(e.id)
    )
  }, [allEntries, sourceEntry.id, relations])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [category, setCategory] = useState<RelationCategory>(getDefaultCategory(sourceEntry.type))
  const [description, setDescription] = useState('')
  const [sourceToTargetLabel, setSourceToTargetLabel] = useState('')
  const selectedTarget = allEntries.find(entry => entry.id === targetId)
  const allowCharacterRelation =
    sourceEntry.type === 'character' &&
    (!selectedTarget || selectedTarget.type === 'character')

  const effectiveCategory =
    allowCharacterRelation || category === 'general'
      ? category
      : 'general'

  const handleAddRelation = async () => {
    if (!targetId) return
    await addRelation(sourceEntry.id, targetId, effectiveCategory, description, sourceToTargetLabel)
    setTargetId('')
    setCategory(getDefaultCategory(sourceEntry.type))
    setDescription('')
    setSourceToTargetLabel('')
    setDialogOpen(false)
  }

  const handleDeleteRelation = async (relationId: string) => {
    await deleteRelation(relationId)
  }

  const renderRelationCard = (relation: Relation) => {
    const isSource = relation.sourceEntryId === sourceEntry.id
    const targetId = isSource ? relation.targetEntryId : relation.sourceEntryId
    const targetEntry = allEntries.find(e => e.id === targetId)

    if (!targetEntry) return null

    const directionLabel = relation.sourceToTargetLabel || ''

    const perspectiveLabel = isSource
      ? directionLabel
      : `← ${directionLabel || '关联'}`

    return (
      <div
        key={relation.id}
        className="group relative flex items-start gap-2 p-3 rounded-[var(--radius-card)] surface-2 film-edge hover:film-edge-active transition-[box-shadow] duration-[var(--dur-fast)]"
      >
        <span className="text-primary/70 flex-shrink-0 mt-0.5">
          {isSource ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </span>

        <div className="flex-1 min-w-0 space-y-1.5">
          <Badge variant="default">
            {CATEGORY_LABELS[relation.category]}
          </Badge>

          {relation.description && (
            <p className="text-[13px] text-foreground/90">
              {relation.description}
            </p>
          )}

          {perspectiveLabel && (
            <p className="text-[11px] text-muted-foreground italic">
              {perspectiveLabel}
            </p>
          )}

          <button
            onClick={() => onSelectEntry(targetId)}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            {targetEntry.name}
          </button>
        </div>

        <button
          onClick={() => handleDeleteRelation(relation.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-[var(--radius-control)] hover:bg-[hsl(var(--surface-3))] transition-opacity"
          aria-label="删除关联"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>关联</Label>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="subtle" size="sm">
              <Plus className="h-3 w-3" />
              添加关联
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>添加关联</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>目标条目</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个条目..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargets.map(entry => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>关系类别</Label>
                <Select value={effectiveCategory} onValueChange={(v) => setCategory(v as RelationCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowCharacterRelation && (
                      <SelectItem value="character_relation">角色关系</SelectItem>
                    )}
                    <SelectItem value="general">通用关联</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>关系描述</Label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：师徒、朋友、居住"
                />
              </div>

              <div className="space-y-2">
                <Label>方向标签</Label>
                <Input
                  type="text"
                  value={sourceToTargetLabel}
                  onChange={(e) => setSourceToTargetLabel(e.target.value)}
                  placeholder="例如：是师父、居住于"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="subtle" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddRelation} disabled={!targetId}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">加载中...</div>
      ) : relations.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
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
