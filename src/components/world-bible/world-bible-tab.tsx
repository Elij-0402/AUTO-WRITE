'use client'

import { useState, useMemo } from 'react'
import { User, MapPin, BookOpen, Clock, Plus, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react'
import type { WorldEntry, WorldEntryType } from '@/lib/types'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useRelations } from '@/lib/hooks/use-relations'
import { DeleteEntryDialog } from './delete-entry-dialog'

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
 * Empty state prompts per type per D-20
 */
function getEmptyPrompt(type: WorldEntryType): string {
  switch (type) {
    case 'character':
      return '还没有角色，点击添加第一个角色'
    case 'location':
      return '还没有地点，点击添加第一个地点'
    case 'rule':
      return '还没有规则，点击添加第一个规则'
    case 'timeline':
      return '还没有时间线，点击添加第一个时间线'
  }
}

const TYPE_ORDER: WorldEntryType[] = ['character', 'location', 'rule', 'timeline']

/**
 * WorldEntryRow per D-10, D-31, D-32.
 * Shows type icon, name, tag preview, and three-dot context menu.
 */
interface WorldEntryRowProps {
  entry: WorldEntry
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function WorldEntryRow({ entry, isActive, onSelect, onEdit, onDelete }: WorldEntryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const Icon = getTypeIcon(entry.type)

  const tagPreview = entry.tags.slice(0, 2).join(', ')

  return (
    <div
      className={`
        group flex items-center gap-2 px-2 py-2 border-b border-zinc-100 dark:border-zinc-800
        cursor-pointer transition-colors
        ${isActive
          ? 'bg-zinc-100 dark:bg-zinc-800'
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-850'}
      `}
      onClick={onSelect}
    >
      {/* Type icon per D-32 */}
      <Icon className="h-4 w-4 flex-shrink-0 text-zinc-400" />

      {/* Name and tags */}
      <div className="flex-1 min-w-0">
        <span className="block truncate text-sm text-zinc-700 dark:text-zinc-300">
          {entry.name}
        </span>
        {tagPreview && (
          <span className="block truncate text-xs text-zinc-400">
            {tagPreview}
          </span>
        )}
      </div>

      {/* Three-dot menu per D-31 */}
      <div className="relative">
        <button
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          aria-label="更多操作"
        >
          <MoreHorizontal className="h-4 w-4 text-zinc-400" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-24">
              <button
                className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onEdit()
                }}
              >
                编辑
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onDelete()
                }}
              >
                删除
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * WorldBibleTab per D-08, D-09, D-10, D-11, D-15, D-17, D-20.
 * Third sidebar tab with type-grouped entry list, search, creation, and deletion.
 */
interface WorldBibleTabProps {
  projectId: string
  activeEntryId: string | null
  onSelectEntry: (id: string) => void
  onEditEntry: (id: string) => void
  onDeleteEntry: (id: string) => void
  onCreateEntry: (type: WorldEntryType) => void
}

/**
 * Default names per type per D-15
 */
function getDefaultName(type: WorldEntryType): string {
  switch (type) {
    case 'character':
      return '未命名角色'
    case 'location':
      return '未命名地点'
    case 'rule':
      return '未命名规则'
    case 'timeline':
      return '未命名时间线'
  }
}

export function WorldBibleTab({
  projectId,
  activeEntryId,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  onCreateEntry,
}: WorldBibleTabProps) {
  const { entries, entriesByType, loading, addEntry, softDeleteEntry } = useWorldEntries(projectId)
  const { getRelationCount } = useRelations(projectId)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Record<WorldEntryType, boolean>>({
    character: false,
    location: false,
    rule: false,
    timeline: false,
  })
  
  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteRelationCount, setDeleteRelationCount] = useState(0)

  // Compute all existing tags for autocomplete (used by parent for tag input)
  const allExistingTags = useMemo(() => {
    if (!entries) return []
    const tagSet = new Set<string>()
    entries.forEach(e => e.tags.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [entries])

  // Filter entries by search query per D-11
  const filteredEntries = useMemo(() => {
    if (!entries || !searchQuery.trim()) return null
    const query = searchQuery.toLowerCase()
    return entries.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.tags.some(t => t.toLowerCase().includes(query))
    )
  }, [entries, searchQuery])

  // Toggle section collapse
  const toggleSection = (type: WorldEntryType) => {
    setCollapsedSections(prev => ({ ...prev, [type]: !prev[type] }))
  }

  // Handle create entry - calls internal addEntry and notifies parent per D-15
  const handleCreateEntryInternal = async (type: WorldEntryType) => {
    const defaultName = getDefaultName(type)
    const newId = await addEntry(type, defaultName)
    // Auto-select and enter edit mode per D-15
    onSelectEntry(newId)
    onEditEntry(newId)
    // Also call parent's onCreateEntry for any additional handling
    onCreateEntry(type)
  }

  // Handle delete with relation count
  const handleDeleteClick = async (entry: WorldEntry) => {
    const count = await getRelationCount(entry.id)
    setDeleteTarget({ id: entry.id, name: entry.name })
    setDeleteRelationCount(count)
  }

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await softDeleteEntry(deleteTarget.id)
      // Clear selection if deleting active entry
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
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        加载中...
      </div>
    )
  }

  // Search active: show flat filtered list across all types per D-11
  if (filteredEntries !== null) {
    return (
      <div className="flex flex-col h-full">
        {/* Search bar per D-11 */}
        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索世界观..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>

        {/* Filtered results */}
        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
              没有找到匹配的结果
            </div>
          ) : (
            filteredEntries.map(entry => (
              <WorldEntryRow
                key={entry.id}
                entry={entry}
                isActive={activeEntryId === entry.id}
                onSelect={() => onSelectEntry(entry.id)}
                onEdit={() => onEditEntry(entry.id)}
                onDelete={() => handleDeleteClick(entry)}
              />
            ))
          )}
        </div>

        {/* Delete confirmation dialog per D-17 */}
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

  // Normal view: type-grouped sections
  return (
    <div className="flex flex-col h-full">
      {/* Search bar per D-11 */}
      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索世界观..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Type sections per D-09 */}
      <div className="flex-1 overflow-y-auto">
        {TYPE_ORDER.map(type => {
          const sectionEntries = entriesByType[type] || []
          const isCollapsed = collapsedSections[type]
          const Icon = getTypeIcon(type)
          const typeName = getTypeName(type)

          return (
            <div key={type}>
              {/* Section header per D-09 */}
              <div className="flex items-center gap-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => toggleSection(type)}
                  className="flex items-center gap-1 flex-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {typeName}
                  </span>
                  <span className="text-xs text-zinc-400 ml-1">
                    ({sectionEntries.length})
                  </span>
                </button>

                {/* + button per D-15 - calls internal creation */}
                <button
                  onClick={() => handleCreateEntryInternal(type)}
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label={`添加${typeName}`}
                >
                  <Plus className="h-4 w-4 text-zinc-400" />
                </button>
              </div>

              {/* Section content */}
              {!isCollapsed && (
                sectionEntries.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-zinc-400 text-sm">
                    <button
                      onClick={() => handleCreateEntryInternal(type)}
                      className="hover:text-blue-500 transition-colors"
                    >
                      {getEmptyPrompt(type)}
                    </button>
                  </div>
                ) : (
                  sectionEntries
                    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
                    .map(entry => (
                      <WorldEntryRow
                        key={entry.id}
                        entry={entry}
                        isActive={activeEntryId === entry.id}
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

      {/* Delete confirmation dialog per D-17 */}
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
