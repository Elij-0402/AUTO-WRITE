'use client'

import { useState, useMemo } from 'react'
import { User, Users, MapPin, BookOpen, KeyRound, CalendarDays, Clock, Plus, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { WorldEntry, WorldEntryType } from '@/lib/types'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useRelations } from '@/lib/hooks/use-relations'
import { useContradictions } from '@/lib/hooks/use-contradictions'
import { useStoryTrackerCounts } from '@/lib/hooks/use-story-trackers'
import { DeleteEntryDialog } from './delete-entry-dialog'
import { StoryBibleOverview } from './story-bible-overview'
import { StoryTrackerPanel } from './story-tracker-panel'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function getTypeIcon(type: WorldEntryType) {
  switch (type) {
    case 'character':
      return User
    case 'faction':
      return Users
    case 'location':
      return MapPin
    case 'rule':
      return BookOpen
    case 'secret':
      return KeyRound
    case 'event':
      return CalendarDays
    case 'timeline':
      return Clock
    default:
      return Clock
  }
}

function TypeIcon({ type, className, strokeWidth }: { type: WorldEntryType; className?: string; strokeWidth?: number }) {
  switch (type) {
    case 'character':
      return <User className={className} strokeWidth={strokeWidth} />
    case 'faction':
      return <Users className={className} strokeWidth={strokeWidth} />
    case 'location':
      return <MapPin className={className} strokeWidth={strokeWidth} />
    case 'rule':
      return <BookOpen className={className} strokeWidth={strokeWidth} />
    case 'secret':
      return <KeyRound className={className} strokeWidth={strokeWidth} />
    case 'event':
      return <CalendarDays className={className} strokeWidth={strokeWidth} />
    case 'timeline':
      return <Clock className={className} strokeWidth={strokeWidth} />
    default:
      return <Clock className={className} strokeWidth={strokeWidth} />
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

function getEmptyPrompt(type: WorldEntryType): string {
  switch (type) {
    case 'character':
      return '还没有角色，点击添加'
    case 'faction':
      return '还没有势力，点击添加'
    case 'location':
      return '还没有地点，点击添加'
    case 'rule':
      return '还没有规则，点击添加'
    case 'secret':
      return '还没有秘密，点击添加'
    case 'event':
      return '还没有事件，点击添加'
    case 'timeline':
      return '还没有时间线，点击添加'
    default:
      return '还没有条目，点击添加'
  }
}

function getTypeColorClass(type: WorldEntryType): string {
  switch (type) {
    case 'character': return 'text-[hsl(var(--accent-amber))]'
    case 'faction':   return 'text-[hsl(var(--accent-jade))]'
    case 'location':  return 'text-[hsl(var(--accent-jade))]'
    case 'rule':      return 'text-[hsl(var(--accent-violet))]'
    case 'secret':    return 'text-[hsl(var(--accent-violet))]'
    case 'event':     return 'text-[hsl(var(--accent-amber))]'
    case 'timeline':  return 'text-foreground/80'
    default:          return 'text-foreground/80'
  }
}

function getTypeRailClass(type: WorldEntryType): string {
  switch (type) {
    case 'character': return 'bg-[hsl(var(--accent-amber))]'
    case 'faction':   return 'bg-[hsl(var(--accent-jade))]'
    case 'location':  return 'bg-[hsl(var(--accent-jade))]'
    case 'rule':      return 'bg-[hsl(var(--accent-violet))]'
    case 'secret':    return 'bg-[hsl(var(--accent-violet))]'
    case 'event':     return 'bg-[hsl(var(--accent-amber))]'
    case 'timeline':  return 'bg-foreground/40'
    default:          return 'bg-foreground/40'
  }
}

const TYPE_ORDER: WorldEntryType[] = ['character', 'faction', 'location', 'rule', 'secret', 'event', 'timeline']

interface WorldEntryRowProps {
  entry: WorldEntry
  isActive: boolean
  contradictionCount?: number
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function WorldEntryRow({ entry, isActive, contradictionCount = 0, onSelect, onEdit, onDelete }: WorldEntryRowProps) {
  const tagPreview = entry.tags.slice(0, 2).join(' · ')
  const colorClass = getTypeColorClass(entry.type)
  const railClass = getTypeRailClass(entry.type)

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-[background-color] duration-[var(--dur-fast)]',
        isActive
          ? 'bg-[hsl(var(--surface-3))]/70'
          : 'hover:bg-[hsl(var(--surface-3))]/40'
      )}
      onClick={onSelect}
    >
      {isActive && (
        <span aria-hidden className={cn('absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full', railClass)} />
      )}
      <TypeIcon type={entry.type} className={cn('h-3.5 w-3.5 flex-shrink-0', colorClass)} strokeWidth={1.8} />

      <div className="flex-1 min-w-0">
        <span className="block truncate text-[13px] text-foreground/90">
          {entry.name}
        </span>
        {tagPreview && (
          <span className="block truncate text-[11px] text-muted-foreground/70">
            {tagPreview}
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            className="flex h-5 w-5 items-center justify-center rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-3))] opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="更多操作"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil />
            编辑
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-[hsl(var(--accent-coral))] focus:text-[hsl(var(--accent-coral))]"
          >
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DSN-7F: badge when ≥3 open contradictions for this entry in last 7d */}
      {contradictionCount >= 3 && (
        <span
          title={`${contradictionCount} 个未解决的矛盾`}
          className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[hsl(var(--warning))] px-1 text-[10px] font-medium text-black"
        >
          {contradictionCount}
        </span>
      )}
    </div>
  )
}

interface WorldBibleTabProps {
  projectId: string
  activeEntryId: string | null
  onSelectEntry: (id: string) => void
  onEditEntry: (id: string) => void
  onDeleteEntry: (id: string) => void
}

function getDefaultName(type: WorldEntryType): string {
  switch (type) {
    case 'character':
      return '未命名角色'
    case 'faction':
      return '未命名势力'
    case 'location':
      return '未命名地点'
    case 'rule':
      return '未命名规则'
    case 'secret':
      return '未命名秘密'
    case 'event':
      return '未命名事件'
    case 'timeline':
      return '未命名时间线'
    default:
      return '未命名条目'
  }
}

export function WorldBibleTab({
  projectId,
  activeEntryId,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
}: WorldBibleTabProps) {
  const { entries, entriesByType, loading, addEntry, softDeleteEntry } = useWorldEntries(projectId)
  const { getRelationCount } = useRelations(projectId)
  const { entriesWithBadge } = useContradictions(projectId)
  const trackerCounts = useStoryTrackerCounts(projectId)
  const contradictionCountByName = useMemo(() => {
    const m = new Map<string, number>()
    for (const { entryName, count } of entriesWithBadge) m.set(entryName, count)
    return m
  }, [entriesWithBadge])

  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Record<WorldEntryType, boolean>>({
    character: false,
    faction: false,
    location: false,
    rule: false,
    secret: false,
    event: false,
    timeline: false,
  })

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteRelationCount, setDeleteRelationCount] = useState(0)

  const filteredEntries = useMemo(() => {
    if (!entries || !searchQuery.trim()) return null
    const query = searchQuery.toLowerCase()
    return entries.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.tags.some(t => t.toLowerCase().includes(query))
    )
  }, [entries, searchQuery])

  const toggleSection = (type: WorldEntryType) => {
    setCollapsedSections(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const handleCreateEntryInternal = async (type: WorldEntryType) => {
    const defaultName = getDefaultName(type)
    const newId = await addEntry(type, defaultName)
    onSelectEntry(newId)
    onEditEntry(newId)
  }

  const handleDeleteClick = async (entry: WorldEntry) => {
    const count = await getRelationCount(entry.id)
    setDeleteTarget({ id: entry.id, name: entry.name })
    setDeleteRelationCount(count)
  }

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await softDeleteEntry(deleteTarget.id)
      if (deleteTarget.id === activeEntryId) {
        onSelectEntry('')
      }
      setDeleteTarget(null)
      onDeleteEntry(deleteTarget.id)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        加载中...
      </div>
    )
  }

  if (filteredEntries !== null) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 divider-hair">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索世界观..."
            className="h-8 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              没有找到匹配的结果
            </div>
          ) : (
            filteredEntries.map(entry => (
              <WorldEntryRow
                key={entry.id}
                entry={entry}
                isActive={activeEntryId === entry.id}
                contradictionCount={contradictionCountByName.get(entry.name) ?? 0}
                onSelect={() => onSelectEntry(entry.id)}
                onEdit={() => onEditEntry(entry.id)}
                onDelete={() => handleDeleteClick(entry)}
              />
            ))
          )}
        </div>

        {deleteTarget && (
          <DeleteEntryDialog
            entryName={deleteTarget.name}
            relationCount={deleteRelationCount}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 divider-hair">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索世界观..."
          className="h-8 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <StoryBibleOverview
          entriesByType={entriesByType}
          trackerCounts={trackerCounts}
        />

        <div className="px-3 py-3 divider-hair">
          <StoryTrackerPanel projectId={projectId} entries={entries} />
        </div>

        {TYPE_ORDER.map(type => {
          const sectionEntries = entriesByType[type] || []
          const isCollapsed = collapsedSections[type]
          const Icon = getTypeIcon(type)
          const typeName = getTypeName(type)

          return (
            <div key={type}>
              <div className="flex items-center gap-1 px-3 py-1.5 surface-2 divider-hair">
                <button
                  onClick={() => toggleSection(type)}
                  className="flex items-center gap-1.5 flex-1 hover:text-foreground transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <Icon className={cn('h-3.5 w-3.5', getTypeColorClass(type))} strokeWidth={1.8} />
                  <span className="text-[12px] font-medium text-foreground">
                    {typeName}
                  </span>
                  <span className="text-mono text-[10px] text-muted-foreground/70 ml-1 tabular-nums">
                    {sectionEntries.length}
                  </span>
                </button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleCreateEntryInternal(type)}
                  aria-label={`添加${typeName}`}
                >
                  <Plus />
                </Button>
              </div>

              {!isCollapsed && (
                sectionEntries.length === 0 ? (
                  <button
                    onClick={() => handleCreateEntryInternal(type)}
                    className="flex items-center justify-center w-full py-3 text-muted-foreground text-xs hover:text-foreground hover:bg-accent/30 transition-colors"
                  >
                    {getEmptyPrompt(type)}
                  </button>
                ) : (
                  sectionEntries
                    .map((entry: WorldEntry) => (
                      <WorldEntryRow
                        key={entry.id}
                        entry={entry}
                        isActive={activeEntryId === entry.id}
                        contradictionCount={contradictionCountByName.get(entry.name) ?? 0}
                        onSelect={() => onSelectEntry(entry.id)}
                        onEdit={() => onEditEntry(entry.id)}
                        onDelete={() => handleDeleteClick(entry)}
                      />
                    ))
                )
              )}
            </div>
          )
        })}
      </div>

      {deleteTarget && (
        <DeleteEntryDialog
          entryName={deleteTarget.name}
          relationCount={deleteRelationCount}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  )
}

export type { WorldBibleTabProps }
