'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { User, Users, MapPin, BookOpen, KeyRound, CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
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

function TypeIcon({ type, className }: { type: WorldEntryType; className?: string }) {
  switch (type) {
    case 'character':
      return <User className={className} />
    case 'faction':
      return <Users className={className} />
    case 'location':
      return <MapPin className={className} />
    case 'rule':
      return <BookOpen className={className} />
    case 'secret':
      return <KeyRound className={className} />
    case 'event':
      return <CalendarDays className={className} />
    case 'timeline':
      return <Clock className={className} />
    default:
      return <Clock className={className} />
  }
}

function getTypeName(type: WorldEntryType): string {
  switch (type) {
    case 'character':
      return '角色'
    case 'faction':
      return '势力'
    case 'location':
      return '地点'
    case 'rule':
      return '规则'
    case 'secret':
      return '秘密'
    case 'event':
      return '事件'
    case 'timeline':
      return '时间线'
    default:
      return '时间线'
  }
}

function AutoGrowTextarea({
  id,
  value,
  onChange,
  placeholder,
  className,
}: {
  id?: string
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
      id={id}
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

  const [localName, setLocalName] = useState(entry?.name ?? '')
  const [localAlias, setLocalAlias] = useState(entry?.alias ?? '')
  const [localFactionRole, setLocalFactionRole] = useState(entry?.factionRole ?? '')
  const [localFactionGoal, setLocalFactionGoal] = useState(entry?.factionGoal ?? '')
  const [localFactionStyle, setLocalFactionStyle] = useState(entry?.factionStyle ?? '')
  const [localAppearance, setLocalAppearance] = useState(entry?.appearance ?? '')
  const [localPersonality, setLocalPersonality] = useState(entry?.personality ?? '')
  const [localBackground, setLocalBackground] = useState(entry?.background ?? '')
  const [localDescription, setLocalDescription] = useState(entry?.description ?? '')
  const [localFeatures, setLocalFeatures] = useState(entry?.features ?? '')
  const [localContent, setLocalContent] = useState(entry?.content ?? '')
  const [localScope, setLocalScope] = useState(entry?.scope ?? '')
  const [localSecretContent, setLocalSecretContent] = useState(entry?.secretContent ?? '')
  const [localSecretScope, setLocalSecretScope] = useState(entry?.secretScope ?? '')
  const [localRevealCondition, setLocalRevealCondition] = useState(entry?.revealCondition ?? '')
  const [localTimePoint, setLocalTimePoint] = useState(entry?.timePoint ?? '')
  const [localEventDescription, setLocalEventDescription] = useState(entry?.eventDescription ?? '')
  const [localEventImpact, setLocalEventImpact] = useState(entry?.eventImpact ?? '')
  const [localTags, setLocalTags] = useState<string[]>(entry?.tags ?? [])
  /**
   * T4: per-entry inferred voice/style. Only rendered for character + location
   * types (discriminated via `entry.type` in the form body below). `aiDraft`
   * is reserved for future AI generation; `localInferredVoice` writes to
   * `inferredVoice.userEdit` so the dual-column record keeps diff history.
   */
  const [localInferredVoice, setLocalInferredVoice] = useState(entry?.inferredVoice?.userEdit ?? '')

  // Sync form state when switching to a different entry.
  // Using the "set state during render" pattern per React docs
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // to avoid useEffect cascading renders.
  const [prevEntryId, setPrevEntryId] = useState<string | null>(entry?.id ?? null)
  if (entry && entry.id !== prevEntryId) {
    setPrevEntryId(entry.id)
    setLocalName(entry.name || '')
    setLocalAlias(entry.alias || '')
    setLocalFactionRole(entry.factionRole || '')
    setLocalFactionGoal(entry.factionGoal || '')
    setLocalFactionStyle(entry.factionStyle || '')
    setLocalAppearance(entry.appearance || '')
    setLocalPersonality(entry.personality || '')
    setLocalBackground(entry.background || '')
    setLocalDescription(entry.description || '')
    setLocalFeatures(entry.features || '')
    setLocalContent(entry.content || '')
    setLocalScope(entry.scope || '')
    setLocalSecretContent(entry.secretContent || '')
    setLocalSecretScope(entry.secretScope || '')
    setLocalRevealCondition(entry.revealCondition || '')
    setLocalTimePoint(entry.timePoint || '')
    setLocalEventDescription(entry.eventDescription || '')
    setLocalEventImpact(entry.eventImpact || '')
    setLocalTags(entry.tags || [])
    setLocalInferredVoice(entry.inferredVoice?.userEdit ?? '')
  }

  const { isSaving } = useAutoSave(
    async () => {
      if (!entryId || !entry) return
      const voiceSupported = entry.type === 'character' || entry.type === 'location'
      const trimmedVoice = localInferredVoice.trim()
      // Preserve AI draft if one already exists; only touch userEdit here.
      const nextInferredVoice =
        voiceSupported && (trimmedVoice || entry.inferredVoice?.aiDraft)
          ? {
              aiDraft: entry.inferredVoice?.aiDraft ?? '',
              userEdit: trimmedVoice || undefined,
              generatedAt: entry.inferredVoice?.generatedAt ?? new Date(),
            }
          : undefined
      await updateEntryFields(entryId, {
        alias: localAlias,
        factionRole: localFactionRole,
        factionGoal: localFactionGoal,
        factionStyle: localFactionStyle,
        appearance: localAppearance,
        personality: localPersonality,
        background: localBackground,
        description: localDescription,
        features: localFeatures,
        content: localContent,
        scope: localScope,
        secretContent: localSecretContent,
        secretScope: localSecretScope,
        revealCondition: localRevealCondition,
        timePoint: localTimePoint,
        eventDescription: localEventDescription,
        eventImpact: localEventImpact,
        tags: localTags,
        inferredVoice: nextInferredVoice,
      })
    },
    [localAlias, localFactionRole, localFactionGoal, localFactionStyle, localAppearance, localPersonality, localBackground, localDescription, localFeatures, localContent, localScope, localSecretContent, localSecretScope, localRevealCondition, localTimePoint, localEventDescription, localEventImpact, localTags, localInferredVoice, entryId],
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

      case 'faction':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="势力名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faction-role">阵营定位</Label>
              <AutoGrowTextarea
                id="faction-role"
                value={localFactionRole}
                onChange={setLocalFactionRole}
                placeholder="这个势力在世界格局中的位置..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faction-goal">核心目标</Label>
              <AutoGrowTextarea
                id="faction-goal"
                value={localFactionGoal}
                onChange={setLocalFactionGoal}
                placeholder="它想得到什么、守住什么..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faction-style">行事风格</Label>
              <AutoGrowTextarea
                id="faction-style"
                value={localFactionStyle}
                onChange={setLocalFactionStyle}
                placeholder="这个势力惯常的手段与气质..."
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

      case 'secret':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="秘密名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-content">秘密内容</Label>
              <AutoGrowTextarea
                id="secret-content"
                value={localSecretContent}
                onChange={setLocalSecretContent}
                placeholder="这条秘密到底是什么..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-scope">影响范围</Label>
              <Input
                id="secret-scope"
                type="text"
                value={localSecretScope}
                onChange={(e) => setLocalSecretScope(e.target.value)}
                placeholder="这条秘密牵涉哪些人或势力"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reveal-condition">揭露条件</Label>
              <AutoGrowTextarea
                id="reveal-condition"
                value={localRevealCondition}
                onChange={setLocalRevealCondition}
                placeholder="何时、因何被揭开..."
                className="resize-none"
              />
            </div>
          </>
        )

      case 'event':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="事件名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePoint">时间点</Label>
              <Input
                id="timePoint"
                type="text"
                value={localTimePoint}
                onChange={(e) => setLocalTimePoint(e.target.value)}
                placeholder="例如：第一卷末、王朝更替之夜"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">事件描述</Label>
              <AutoGrowTextarea
                id="event-description"
                value={localEventDescription}
                onChange={setLocalEventDescription}
                placeholder="描述事件经过..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-impact">事件影响</Label>
              <AutoGrowTextarea
                id="event-impact"
                value={localEventImpact}
                onChange={setLocalEventImpact}
                placeholder="这件事改变了什么..."
                className="resize-none"
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

      default:
        return null
    }
  }

  const typeColorVar: Record<WorldEntryType, string> = {
    character: 'var(--accent-amber)',
    faction: 'var(--accent-jade)',
    location: 'var(--accent-jade)',
    rule: 'var(--accent-violet)',
    secret: 'var(--accent-violet)',
    event: 'var(--accent-amber)',
    timeline: 'var(--foreground)',
  }
  const badgeVariant: Record<WorldEntryType, 'amber' | 'jade' | 'violet' | 'secondary'> = {
    character: 'amber',
    faction: 'jade',
    location: 'jade',
    rule: 'violet',
    secret: 'violet',
    event: 'amber',
    timeline: 'secondary',
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden surface-0">
      <div className="relative px-6 py-3 divider-hair flex items-center justify-between">
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: `hsl(${typeColorVar[entry.type]})` }}
        />
        <Badge variant={badgeVariant[entry.type]} className="gap-1.5">
          <TypeIcon type={entry.type} className="h-3 w-3" />
          <span>{getTypeName(entry.type)}</span>
        </Badge>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={
              'h-1.5 w-1.5 rounded-full ' +
              (isSaving
                ? 'bg-[hsl(var(--accent-amber))]'
                : 'bg-[hsl(var(--accent-jade))]')
            }
          />
          {isSaving ? '保存中' : '已保存'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {renderTypeSpecificFields()}

        <div className="space-y-2">
          <Label>标签</Label>
          <TagInput
            tags={localTags}
            onTagsChange={setLocalTags}
            allTags={allTags}
          />
        </div>

        {(entry.type === 'character' || entry.type === 'location') && (
          <div className="space-y-2">
            <Label>AI 推断的口吻 / 风格特征</Label>
            {entry.inferredVoice?.aiDraft && (
              <div className="rounded-md surface-2 px-3 py-2 text-[12px] leading-[1.7] text-muted-foreground whitespace-pre-wrap">
                <div className="text-[10px] uppercase tracking-[0.18em] mb-1 text-muted-foreground/80">
                  AI 草稿 · {formatDateCN(entry.inferredVoice.generatedAt)}
                </div>
                {entry.inferredVoice.aiDraft}
              </div>
            )}
            <AutoGrowTextarea
              value={localInferredVoice}
              onChange={setLocalInferredVoice}
              placeholder={
                entry.type === 'character'
                  ? '这个角色说话有什么特点？语气、句式、口头禅...'
                  : '这个地点给人的感觉是什么？叙述这里时用什么笔调...'
              }
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground/70">
              用于未来的一致性检查：AI 生成文本时会对比这里记录的风格。
            </p>
          </div>
        )}

        <div>
          <RelationshipSection
            projectId={projectId}
            sourceEntry={entry}
            allEntries={allEntries}
            onSelectEntry={onSelectEntry}
          />
        </div>

        <div className="text-[10px] text-mono uppercase tracking-[0.15em] text-muted-foreground/70 space-y-1 pt-3 divider-hair">
          <p>创建于 {formatDateCN(entry.createdAt)}</p>
          <p>更新于 {formatDateCN(entry.updatedAt)}</p>
        </div>
      </div>

      <div className="flex gap-2 px-6 py-3 divider-hair">
        <Button
          variant="subtle"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          上一条
        </Button>
        <Button
          variant="subtle"
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
