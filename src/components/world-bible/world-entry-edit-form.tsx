'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { User, MapPin, BookOpen, Clock } from 'lucide-react'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useAutoSave } from '@/lib/hooks/use-autosave'
import { TagInput } from './tag-input'
import { RelationshipSection } from './relationship-section'
import type { WorldEntry, WorldEntryType } from '@/lib/types'

/**
 * Type icons per D-32: User for characters, MapPin for locations, BookOpen for rules, Clock for timelines
 */
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

/**
 * Chinese type names per D-09
 */
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

/**
 * Type badge colors per D-16
 */
function getTypeBadgeColor(type: WorldEntryType): string {
  switch (type) {
    case 'character':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'location':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'rule':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    case 'timeline':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
  }
}

/**
 * Auto-growing textarea per D-16.
 * Starts at 5rem (≈3 rows) minimum, grows with content.
 */
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
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      style={{ minHeight: '5rem', overflowY: 'auto' }}
    />
  )
}

/**
 * Format date in Chinese locale per D-22.
 */
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

/**
 * WorldEntryEditForm per D-13, D-14, D-16, D-18, D-19.
 * - Editing shows form in editor area (same pattern as OutlineEditForm)
 * - Clicking entry immediately enters edit mode (no separate view/edit toggle)
 * - Type indicator at top + structured form fields per entity type
 * - Auto-save with 500ms debounce
 * - Prev/Next navigation within same type group
 */
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
  const { entries, entriesByType, renameEntry, updateEntryFields } = useWorldEntries(projectId)
  const entry = entries?.find(e => e.id === entryId)

  // Local state for immediate responsiveness
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

  // Sync local state when entry changes
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

  // Auto-save non-name fields with 500ms debounce per D-18
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

  // Auto-save name via renameEntry per D-18
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

  // Compute all existing tags for TagInput autocomplete
  const allTags = useMemo(() => {
    if (!entries) return []
    const tagSet = new Set<string>()
    entries.forEach(e => e.tags.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [entries])

  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary">
        <p>条目未找到</p>
      </div>
    )
  }

  const Icon = getTypeIcon(entry.type)
  const typeBadgeColor = getTypeBadgeColor(entry.type)

  // Render type-specific fields per D-02, D-03, D-04, D-05
  const renderTypeSpecificFields = () => {
    switch (entry.type) {
      case 'character':
        return (
          <>
            {/* 姓名 per D-02 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                姓名
              </label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="角色姓名"
              />
            </div>

            {/* 别名 per D-02 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                别名
              </label>
              <input
                type="text"
                value={localAlias}
                onChange={(e) => setLocalAlias(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="角色的别名或称号"
              />
            </div>

            {/* 外貌 per D-02, D-16 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                外貌
              </label>
              <AutoGrowTextarea
                value={localAppearance}
                onChange={setLocalAppearance}
                placeholder="描述角色的外貌特征..."
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* 性格 per D-02, D-16 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                性格
              </label>
              <AutoGrowTextarea
                value={localPersonality}
                onChange={setLocalPersonality}
                placeholder="描述角色的性格特点..."
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* 背景 per D-02, D-16, D-25 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                背景
              </label>
              <AutoGrowTextarea
                value={localBackground}
                onChange={setLocalBackground}
                placeholder="描述角色的背景故事和经历..."
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </>
        )

      case 'location':
        return (
          <>
            {/* 名称 per D-03 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                名称
              </label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="地点名称"
              />
            </div>

            {/* 描述 per D-03, D-16 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                描述
              </label>
              <AutoGrowTextarea
                value={localDescription}
                onChange={setLocalDescription}
                placeholder="描述地点的样貌和环境..."
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* 特征 per D-03, D-16 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                特征
              </label>
              <AutoGrowTextarea
                value={localFeatures}
                onChange={setLocalFeatures}
                placeholder="描述地点的特殊或标志性特征..."
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </>
        )

      case 'rule':
        return (
          <>
            {/* 名称 per D-04 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                名称
              </label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="规则或设定名称"
              />
            </div>

            {/* 内容 per D-04, D-16 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                内容
              </label>
              <AutoGrowTextarea
                value={localContent}
                onChange={setLocalContent}
                placeholder="描述规则或设定的具体内容..."
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* 适用范围 per D-04 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                适用范围
              </label>
              <input
                type="text"
                value={localScope}
                onChange={(e) => setLocalScope(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="这个规则适用于哪些场景或角色"
              />
            </div>
          </>
        )

      case 'timeline':
        return (
          <>
            {/* 名称 per D-05 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                名称
              </label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="时间线事件名称"
              />
            </div>

            {/* 时间点 per D-05 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                时间点
              </label>
              <input
                type="text"
                value={localTimePoint}
                onChange={(e) => setLocalTimePoint(e.target.value)}
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="例如：第三年春、百年前"
              />
            </div>

            {/* 事件描述 per D-05, D-16 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                事件描述
              </label>
              <AutoGrowTextarea
                value={localEventDescription}
                onChange={setLocalEventDescription}
                placeholder="描述在这个时间点发生的事件..."
                className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground bg-surface-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with type indicator and save status */}
      <div className="px-6 py-3 border-b border-border-subtle flex items-center justify-between">
        {/* Type indicator per D-16 */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeBadgeColor}`}>
          <Icon className="h-3.5 w-3.5" />
          <span>{getTypeName(entry.type)}</span>
        </div>
        {/* Save status per D-18 */}
        <span className="text-xs text-text-tertiary">{isSaving ? '保存中...' : '已保存'}</span>
      </div>

      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        {/* 标签 per D-06 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            标签
          </label>
          <TagInput
            tags={localTags}
            onTagsChange={setLocalTags}
            allTags={allTags}
          />
        </div>

        {/* 关联 per D-21 */}
        <div className="mb-4">
          <RelationshipSection
            projectId={projectId}
            sourceEntry={entry}
            allEntries={allEntries}
            onSelectEntry={onSelectEntry}
          />
        </div>

        {/* Timestamps per D-22 */}
        <div className="text-xs text-text-tertiary space-y-1">
          <p>创建于 {formatDateCN(entry.createdAt)}</p>
          <p>更新于 {formatDateCN(entry.updatedAt)}</p>
        </div>
      </div>

      {/* Previous/Next navigation per D-19 */}
      <div className="flex gap-2 px-6 py-3 border-t border-border-subtle">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← 上一条
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-4 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed ml-auto transition-colors"
        >
          下一条 →
        </button>
      </div>
    </div>
  )
}
