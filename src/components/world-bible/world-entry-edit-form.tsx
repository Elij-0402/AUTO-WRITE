'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { User, MapPin, BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useAutoSave } from '@/lib/hooks/use-autosave'
import { TagInput } from './tag-input'
import { RelationshipSection } from './relationship-section'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { WorldEntry, WorldEntryType } from '@/lib/types'

function getTypeIcon(type: WorldEntryType) {
  switch (type) {
    case 'character':
      return User
    case 'location':
      return MapPin
    case 'rule':
      return BookOpen
    case 'timeline':
      return Clock
  }
}

function getTypeName(type: WorldEntryType): string {
  switch (type) {
    case 'character':
      return '角色'
    case 'location':
      return '地点'
    case 'rule':
      return '规则'
    case 'timeline':
      return '时间线'
  }
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
      style={{ minHeight: '5rem', overflowY: 'auto' }}
    />
  )
}

function formatDateCN(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

interface WorldEntryEditFormProps {
  projectId: string
  entryId: string
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
  onSelectEntry: (id: string) => void
  allEntries: WorldEntry[]
}

export function WorldEntryEditForm({
  projectId,
  entryId,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onSelectEntry,
  allEntries,
}: WorldEntryEditFormProps) {
  const { entries, renameEntry, updateEntryFields } = useWorldEntries(projectId)
  const entry = entries?.find(e => e.id === entryId)

  const [localName, setLocalName] = useState('')
  const [localAlias, setLocalAlias] = useState('')
  const [localAppearance, setLocalAppearance] = useState('')
  const [localPersonality, setLocalPersonality] = useState('')
  const [localBackground, setLocalBackground] = useState('')
  const [localDescription, setLocalDescription] = useState('')
  const [localFeatures, setLocalFeatures] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [localScope, setLocalScope] = useState('')
  const [localTimePoint, setLocalTimePoint] = useState('')
  const [localEventDescription, setLocalEventDescription] = useState('')
  const [localTags, setLocalTags] = useState<string[]>([])

  useEffect(() => {
    if (entry) {
      setLocalName(entry.name || '')
      setLocalAlias(entry.alias || '')
      setLocalAppearance(entry.appearance || '')
      setLocalPersonality(entry.personality || '')
      setLocalBackground(entry.background || '')
      setLocalDescription(entry.description || '')
      setLocalFeatures(entry.features || '')
      setLocalContent(entry.content || '')
      setLocalScope(entry.scope || '')
      setLocalTimePoint(entry.timePoint || '')
      setLocalEventDescription(entry.eventDescription || '')
      setLocalTags(entry.tags || [])
    }
  }, [entry?.id, entry?.name, entry?.alias, entry?.appearance, entry?.personality, entry?.background, entry?.description, entry?.features, entry?.content, entry?.scope, entry?.timePoint, entry?.eventDescription, entry?.tags])

  const { isSaving } = useAutoSave(
    async () => {
      if (!entryId || !entry) return
      await updateEntryFields(entryId, {
        alias: localAlias,
        appearance: localAppearance,
        personality: localPersonality,
        background: localBackground,
        description: localDescription,
        features: localFeatures,
        content: localContent,
        scope: localScope,
        timePoint: localTimePoint,
        eventDescription: localEventDescription,
        tags: localTags,
      })
    },
    [localAlias, localAppearance, localPersonality, localBackground, localDescription, localFeatures, localContent, localScope, localTimePoint, localEventDescription, localTags, entryId],
    500
  )

  useAutoSave(
    async () => {
      if (!entryId || !entry || !localName.trim()) return
      if (localName.trim() !== entry.name) {
        await renameEntry(entryId, localName.trim())
      }
    },
    [localName, entryId],
    500
  )

  const allTags = useMemo(() => {
    if (!entries) return []
    const tagSet = new Set<string>()
    entries.forEach(e => e.tags.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [entries])

  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>条目未找到</p>
      </div>
    )
  }

  const Icon = getTypeIcon(entry.type)

  const renderTypeSpecificFields = () => {
    switch (entry.type) {
      case 'character':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="角色姓名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias">别名</Label>
              <Input
                id="alias"
                type="text"
                value={localAlias}
                onChange={(e) => setLocalAlias(e.target.value)}
                placeholder="角色的别名或称号"
              />
            </div>

            <div className="space-y-2">
              <Label>外貌</Label>
              <AutoGrowTextarea
                value={localAppearance}
                onChange={setLocalAppearance}
                placeholder="描述角色的外貌特征..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>性格</Label>
              <AutoGrowTextarea
                value={localPersonality}
                onChange={setLocalPersonality}
                placeholder="描述角色的性格特点..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>背景</Label>
              <AutoGrowTextarea
                value={localBackground}
                onChange={setLocalBackground}
                placeholder="描述角色的背景故事和经历..."
                className="resize-none"
              />
            </div>
          </>
        )

      case 'location':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="地点名称"
              />
            </div>

            <div className="space-y-2">
              <Label>描述</Label>
              <AutoGrowTextarea
                value={localDescription}
                onChange={setLocalDescription}
                placeholder="描述地点的样貌和环境..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>特征</Label>
              <AutoGrowTextarea
                value={localFeatures}
                onChange={setLocalFeatures}
                placeholder="描述地点的特殊或标志性特征..."
                className="resize-none"
              />
            </div>
          </>
        )

      case 'rule':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="规则或设定名称"
              />
            </div>

            <div className="space-y-2">
              <Label>内容</Label>
              <AutoGrowTextarea
                value={localContent}
                onChange={setLocalContent}
                placeholder="描述规则或设定的具体内容..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">适用范围</Label>
              <Input
                id="scope"
                type="text"
                value={localScope}
                onChange={(e) => setLocalScope(e.target.value)}
                placeholder="这个规则适用于哪些场景或角色"
              />
            </div>
          </>
        )

      case 'timeline':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="时间线事件名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePoint">时间点</Label>
              <Input
                id="timePoint"
                type="text"
                value={localTimePoint}
                onChange={(e) => setLocalTimePoint(e.target.value)}
                placeholder="例如：第三年春、百年前"
              />
            </div>

            <div className="space-y-2">
              <Label>事件描述</Label>
              <AutoGrowTextarea
                value={localEventDescription}
                onChange={setLocalEventDescription}
                placeholder="描述在这个时间点发生的事件..."
                className="resize-none"
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <Badge variant="secondary" className="gap-1.5 font-normal">
          <Icon className="h-3 w-3" />
          <span>{getTypeName(entry.type)}</span>
        </Badge>
        <span className="text-xs text-muted-foreground">{isSaving ? '保存中...' : '已保存'}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {renderTypeSpecificFields()}

        <div className="space-y-2">
          <Label>标签</Label>
          <TagInput
            tags={localTags}
            onTagsChange={setLocalTags}
            allTags={allTags}
          />
        </div>

        <div>
          <RelationshipSection
            projectId={projectId}
            sourceEntry={entry}
            allEntries={allEntries}
            onSelectEntry={onSelectEntry}
          />
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>创建于 {formatDateCN(entry.createdAt)}</p>
          <p>更新于 {formatDateCN(entry.updatedAt)}</p>
        </div>
      </div>

      <div className="flex gap-2 px-6 py-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          上一条
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          className="ml-auto"
        >
          下一条
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
