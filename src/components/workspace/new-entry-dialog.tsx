'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { WorldEntry, WorldEntryType } from '@/lib/types'

/**
 * Type badge colors per UI-SPEC:
 * - character = blue
 * - location = green
 * - rule = purple
 * - timeline = amber
 */
const TYPE_BADGE_COLORS: Record<WorldEntryType, { bg: string; text: string }> = {
  character: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300'
  },
  location: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300'
  },
  rule: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-700 dark:text-purple-300'
  },
  timeline: {
    bg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-700 dark:text-amber-300'
  }
}

const TYPE_LABELS: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间线'
}

/**
 * Prefill data structure per entry type.
 * Per D-18-21: Type-specific fields pre-filled from AI suggestion.
 */
export interface NewEntryPrefillData {
  name: string
  // Character fields (D-18)
  appearance?: string
  background?: string
  // Location fields (D-19)
  description?: string
  features?: string
  // Rule fields (D-20)
  content?: string
  scope?: string
  // Timeline fields (D-21)
  timePoint?: string
  eventDescription?: string
}

export interface NewEntryDialogProps {
  open: boolean
  onClose: () => void
  /** Inferred entry type from AI per D-14 */
  entryType: WorldEntryType
  /** Pre-filled data from AI suggestion per D-10, D-18-21 */
  prefillData: NewEntryPrefillData
  /** Callback when entry is saved */
  onSave: (entry: Partial<WorldEntry>) => Promise<void>
  /** Optional callback when duplicate is detected - should return existing entry or null */
  onCheckDuplicate?: (name: string) => Promise<WorldEntry | null>
  /** Callback when user chooses to link to existing entry */
  onLinkExisting?: (entry: WorldEntry) => void
  /** Callback when user chooses to create new anyway */
  onCreateNew?: () => void
}

/**
 * Dialog for creating new world bible entries with AI-prefilled data.
 * Per D-10: Opens pre-filled entry form on suggestion adoption.
 * Per D-14: AI infers entry type, user confirms in form.
 * Per D-18-21: Type-specific pre-fill fields.
 * Per D-22: Duplicate name handling via onCheckDuplicate callback.
 */
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
  // Form state
  const [name, setName] = useState('')
  const [alias, setAlias] = useState('')
  const [appearance, setAppearance] = useState('')
  const [personality, setPersonality] = useState('')
  const [background, setBackground] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState('')
  const [content, setContent] = useState('')
  const [scope, setScope] = useState('')
  const [timePoint, setTimePoint] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [duplicateEntry, setDuplicateEntry] = useState<WorldEntry | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  // Sync form with prefill data when dialog opens
  useEffect(() => {
    if (open) {
      setName(prefillData.name || '')
      setAppearance(prefillData.appearance || '')
      setBackground(prefillData.background || '')
      setDescription(prefillData.description || '')
      setFeatures(prefillData.features || '')
      setContent(prefillData.content || '')
      setScope(prefillData.scope || '')
      setTimePoint(prefillData.timePoint || '')
      setEventDescription(prefillData.eventDescription || '')
      setDuplicateEntry(null)
      setSaving(false)
    }
  }, [open, prefillData])

  const colors = TYPE_BADGE_COLORS[entryType]

  // Build entry object based on type
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
      case 'rule':
        return {
          ...base,
          content: content.trim() || undefined,
          scope: scope.trim() || undefined,
        }
      case 'timeline':
        return {
          ...base,
          timePoint: timePoint.trim() || undefined,
          eventDescription: eventDescription.trim() || undefined,
        }
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      // Check for duplicate if callback provided
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

      // Save the entry
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

  // Render type-specific fields
  const renderTypeFields = () => {
    switch (entryType) {
      case 'character':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="角色姓名"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                外貌
              </label>
              <textarea
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="描述角色的外貌特征..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                背景
              </label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="描述角色的背景故事..."
              />
            </div>
          </>
        )
      case 'location':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="地点名称"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="描述地点的样貌和环境..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                特征
              </label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="描述地点的特殊或标志性特征..."
              />
            </div>
          </>
        )
      case 'rule':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="规则或设定名称"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="描述规则或设定的具体内容..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                适用范围
              </label>
              <input
                type="text"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="这个规则适用于哪些场景或角色"
              />
            </div>
          </>
        )
      case 'timeline':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="时间线事件名称"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                时间点
              </label>
              <input
                type="text"
                value={timePoint}
                onChange={(e) => setTimePoint(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：第三年春、百年前"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                事件描述
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="描述在这个时间点发生的事件..."
              />
            </div>
          </>
        )
    }
  }

  // Show duplicate dialog if detected
  if (duplicateEntry) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>发现已存在条目</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              「{duplicateEntry.name}」已存在，请选择：
            </p>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{duplicateEntry.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                类型：{TYPE_LABELS[duplicateEntry.type]}
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <Button variant="secondary" onClick={handleCreateNew}>
              创建新条目
            </Button>
            <Button variant="primary" onClick={handleLinkExisting}>
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
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}>
              {TYPE_LABELS[entryType]}
            </span>
            <DialogTitle>新建条目</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {renderTypeFields()}
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button 
            variant="primary" 
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
