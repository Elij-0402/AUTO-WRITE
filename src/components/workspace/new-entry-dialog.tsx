'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { WorldEntry, WorldEntryType } from '@/lib/types'

const TYPE_LABELS: Record<WorldEntryType, string> = {
  character: '角色',
  faction: '势力',
  location: '地点',
  rule: '规则',
  secret: '秘密',
  event: '事件',
  timeline: '时间线'
}

export interface NewEntryPrefillData {
  name: string
  appearance?: string
  background?: string
  description?: string
  features?: string
  content?: string
  scope?: string
  factionRole?: string
  factionGoal?: string
  factionStyle?: string
  secretContent?: string
  secretScope?: string
  revealCondition?: string
  eventImpact?: string
  timePoint?: string
  eventDescription?: string
}

export interface NewEntryDialogProps {
  open: boolean
  onClose: () => void
  entryType: WorldEntryType
  prefillData: NewEntryPrefillData
  onSave: (entry: Partial<WorldEntry>) => Promise<void>
  onCheckDuplicate?: (name: string) => Promise<WorldEntry | null>
  onLinkExisting?: (entry: WorldEntry) => void
  onCreateNew?: () => void
}

export function NewEntryDialog({
  open,
  onClose,
  entryType,
  prefillData,
  onSave,
  onCheckDuplicate,
  onLinkExisting,
  onCreateNew
}: NewEntryDialogProps) {
  const [name, setName] = useState('')
  const [alias] = useState('')
  const [appearance, setAppearance] = useState('')
  const [personality] = useState('')
  const [background, setBackground] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState('')
  const [content, setContent] = useState('')
  const [scope, setScope] = useState('')
  const [factionRole, setFactionRole] = useState('')
  const [factionGoal, setFactionGoal] = useState('')
  const [factionStyle, setFactionStyle] = useState('')
  const [secretContent, setSecretContent] = useState('')
  const [secretScope, setSecretScope] = useState('')
  const [revealCondition, setRevealCondition] = useState('')
  const [timePoint, setTimePoint] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventImpact, setEventImpact] = useState('')

  const [saving, setSaving] = useState(false)
  const [duplicateEntry, setDuplicateEntry] = useState<WorldEntry | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  // Reset form when dialog opens or prefillData changes, using the
  // "set state during render" pattern per React docs.
  const [lastOpen, setLastOpen] = useState(false)
  const [lastPrefillData, setLastPrefillData] = useState(prefillData)
  if (open !== lastOpen || prefillData !== lastPrefillData) {
    setLastOpen(open)
    setLastPrefillData(prefillData)
    if (open) {
      setName(prefillData.name || '')
      setAppearance(prefillData.appearance || '')
      setBackground(prefillData.background || '')
      setDescription(prefillData.description || '')
      setFeatures(prefillData.features || '')
      setContent(prefillData.content || '')
      setScope(prefillData.scope || '')
      setFactionRole(prefillData.factionRole || '')
      setFactionGoal(prefillData.factionGoal || '')
      setFactionStyle(prefillData.factionStyle || '')
      setSecretContent(prefillData.secretContent || '')
      setSecretScope(prefillData.secretScope || '')
      setRevealCondition(prefillData.revealCondition || '')
      setTimePoint(prefillData.timePoint || '')
      setEventDescription(prefillData.eventDescription || '')
      setEventImpact(prefillData.eventImpact || '')
      setDuplicateEntry(null)
      setSaving(false)
    }
  }

  const buildEntry = (): Partial<WorldEntry> => {
    const base = {
      type: entryType,
      name: name.trim(),
      tags: [] as string[]
    }

    switch (entryType) {
      case 'character':
        return {
          ...base,
          alias: alias.trim() || undefined,
          appearance: appearance.trim() || undefined,
          personality: personality.trim() || undefined,
          background: background.trim() || undefined,
        }
      case 'location':
        return {
          ...base,
          description: description.trim() || undefined,
          features: features.trim() || undefined,
        }
      case 'faction':
        return {
          ...base,
          factionRole: factionRole.trim() || undefined,
          factionGoal: factionGoal.trim() || undefined,
          factionStyle: factionStyle.trim() || undefined,
        }
      case 'rule':
        return {
          ...base,
          content: content.trim() || undefined,
          scope: scope.trim() || undefined,
        }
      case 'secret':
        return {
          ...base,
          secretContent: secretContent.trim() || undefined,
          secretScope: secretScope.trim() || undefined,
          revealCondition: revealCondition.trim() || undefined,
        }
      case 'event':
        return {
          ...base,
          timePoint: timePoint.trim() || undefined,
          eventDescription: eventDescription.trim() || undefined,
          eventImpact: eventImpact.trim() || undefined,
        }
      case 'timeline':
        return {
          ...base,
          timePoint: timePoint.trim() || undefined,
          eventDescription: eventDescription.trim() || undefined,
        }
      default:
        return base
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      if (onCheckDuplicate) {
        setCheckingDuplicate(true)
        const existing = await onCheckDuplicate(name.trim())
        setCheckingDuplicate(false)

        if (existing) {
          setDuplicateEntry(existing)
          setSaving(false)
          return
        }
      }

      const entry = buildEntry()
      await onSave(entry)
      onClose()
    } catch (err) {
      console.error('Failed to save entry:', err)
      setSaving(false)
    }
  }

  const handleLinkExisting = () => {
    if (duplicateEntry && onLinkExisting) {
      onLinkExisting(duplicateEntry)
      onClose()
    }
  }

  const handleCreateNew = () => {
    setDuplicateEntry(null)
    if (onCreateNew) {
      onCreateNew()
    }
  }

  const renderTypeFields = () => {
    switch (entryType) {
      case 'character':
        return (
          <>
            <div className="space-y-2">
              <Label>姓名 <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="角色姓名" />
            </div>
            <div className="space-y-2">
              <Label>外貌</Label>
              <Textarea value={appearance} onChange={(e) => setAppearance(e.target.value)} rows={3} placeholder="描述角色的外貌特征..." className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>背景</Label>
              <Textarea value={background} onChange={(e) => setBackground(e.target.value)} rows={3} placeholder="描述角色的背景故事..." className="resize-none" />
            </div>
          </>
        )
      case 'location':
        return (
          <>
            <div className="space-y-2">
              <Label>名称 <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="地点名称" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="描述地点的样貌和环境..." className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>特征</Label>
              <Textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} placeholder="描述地点的特殊或标志性特征..." className="resize-none" />
            </div>
          </>
        )
      case 'faction':
        return (
          <>
            <div className="space-y-2">
              <Label>名称 <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="势力名称" />
            </div>
            <div className="space-y-2">
              <Label>阵营定位</Label>
              <Textarea value={factionRole} onChange={(e) => setFactionRole(e.target.value)} rows={3} placeholder="这个势力在世界中的位置..." className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>核心目标</Label>
              <Textarea value={factionGoal} onChange={(e) => setFactionGoal(e.target.value)} rows={3} placeholder="它想达成什么..." className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>行事风格</Label>
              <Textarea value={factionStyle} onChange={(e) => setFactionStyle(e.target.value)} rows={3} placeholder="它惯常用什么手段..." className="resize-none" />
            </div>
          </>
        )
      case 'rule':
        return (
          <>
            <div className="space-y-2">
              <Label>名称 <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="规则或设定名称" />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="描述规则或设定的具体内容..." className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>适用范围</Label>
              <Input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="这个规则适用于哪些场景或角色" />
            </div>
          </>
        )
      case 'secret':
        return (
          <>
            <div className="space-y-2">
              <Label>名称 <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="秘密名称" />
            </div>
            <div className="space-y-2">
              <Label>秘密内容</Label>
              <Textarea value={secretContent} onChange={(e) => setSecretContent(e.target.value)} rows={3} placeholder="这条秘密到底是什么..." className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>影响范围</Label>
              <Input value={secretScope} onChange={(e) => setSecretScope(e.target.value)} placeholder="牵涉哪些人或势力" />
            </div>
            <div className="space-y-2">
              <Label>揭露条件</Label>
              <Textarea value={revealCondition} onChange={(e) => setRevealCondition(e.target.value)} rows={3} placeholder="会在什么条件下暴露..." className="resize-none" />
            </div>
          </>
        )
      case 'event':
        return (
          <>
            <div className="space-y-2">
              <Label>名称 <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="事件名称" />
            </div>
            <div className="space-y-2">
              <Label>时间点</Label>
              <Input value={timePoint} onChange={(e) => setTimePoint(e.target.value)} placeholder="例如：第一卷末" />
            </div>
            <div className="space-y-2">
              <Label>事件描述</Label>
              <Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={3} placeholder="描述事件经过..." className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>事件影响</Label>
              <Textarea value={eventImpact} onChange={(e) => setEventImpact(e.target.value)} rows={3} placeholder="这件事改变了什么..." className="resize-none" />
            </div>
          </>
        )
      case 'timeline':
        return (
          <>
            <div className="space-y-2">
              <Label>名称 <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="时间线事件名称" />
            </div>
            <div className="space-y-2">
              <Label>时间点</Label>
              <Input value={timePoint} onChange={(e) => setTimePoint(e.target.value)} placeholder="例如：第三年春、百年前" />
            </div>
            <div className="space-y-2">
              <Label>事件描述</Label>
              <Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={3} placeholder="描述在这个时间点发生的事件..." className="resize-none" />
            </div>
          </>
        )
      default:
        return null
    }
  }

  if (duplicateEntry) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>发现已存在条目</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              「{duplicateEntry.name}」已存在，请选择：
            </p>
            <Card>
              <CardContent className="p-3">
                <p className="font-medium">{duplicateEntry.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  类型：{TYPE_LABELS[duplicateEntry.type]}
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCreateNew}>
              创建新条目
            </Button>
            <Button onClick={handleLinkExisting}>
              关联到现有条目
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {TYPE_LABELS[entryType]}
            </Badge>
            <DialogTitle>新建条目</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-4 max-h-[60vh] overflow-y-auto">
          {renderTypeFields()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || checkingDuplicate || !name.trim()}
          >
            {saving ? '保存中...' : checkingDuplicate ? '检查中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
