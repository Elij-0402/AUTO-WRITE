import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorldBibleTab } from './world-bible-tab'
import type { WorldEntry, Relation } from '@/lib/types'

const mockUseWorldEntries = vi.fn()
const mockUseRelations = vi.fn()
const mockUseContradictions = vi.fn()
const mockUseStoryTrackerCounts = vi.fn()
const mockUseStoryTrackers = vi.fn()

vi.mock('@/lib/hooks/use-world-entries', () => ({
  useWorldEntries: (...args: unknown[]) => mockUseWorldEntries(...args),
}))

vi.mock('@/lib/hooks/use-relations', () => ({
  useRelations: (...args: unknown[]) => mockUseRelations(...args),
}))

vi.mock('@/lib/hooks/use-contradictions', () => ({
  useContradictions: (...args: unknown[]) => mockUseContradictions(...args),
}))

vi.mock('@/lib/hooks/use-story-trackers', () => ({
  useStoryTrackerCounts: (...args: unknown[]) => mockUseStoryTrackerCounts(...args),
  useStoryTrackers: (...args: unknown[]) => mockUseStoryTrackers(...args),
}))

function makeEntry(overrides: Partial<WorldEntry>): WorldEntry {
  const now = new Date('2026-04-27T00:00:00.000Z')
  return {
    id: overrides.id ?? 'entry-1',
    projectId: overrides.projectId ?? 'project-1',
    type: overrides.type ?? 'character',
    name: overrides.name ?? '默认条目',
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
    ...overrides,
  }
}

describe('WorldBibleTab ordering', () => {
  beforeEach(() => {
    mockUseRelations.mockReturnValue({
      relations: [] as Relation[],
      loading: false,
      addRelation: vi.fn(),
      deleteRelation: vi.fn(),
      getRelationCount: vi.fn().mockResolvedValue(0),
    })
    mockUseContradictions.mockReturnValue({
      entriesWithBadge: [],
    })
    mockUseStoryTrackerCounts.mockReturnValue({
      unresolvedTrackers: 0,
      unresolvedStates: 0,
    })
    mockUseStoryTrackers.mockReturnValue({
      trackers: [],
      loading: false,
      create: vi.fn(),
      resolve: vi.fn(),
    })
  })

  it('preserves the event order provided by entriesByType', () => {
    const laterEvent = makeEntry({ id: 'event-2', type: 'event', name: '乙事件' })
    const earlierEvent = makeEntry({ id: 'event-1', type: 'event', name: '甲事件' })
    const timelineEntry = makeEntry({ id: 'timeline-1', type: 'timeline', name: '一号时间线' })

    mockUseWorldEntries.mockReturnValue({
      entries: [laterEvent, earlierEvent, timelineEntry],
      entriesByType: {
        character: [],
        faction: [],
        location: [],
        rule: [],
        secret: [],
        event: [laterEvent, earlierEvent],
        timeline: [timelineEntry],
      },
      loading: false,
      addEntry: vi.fn(),
      softDeleteEntry: vi.fn(),
    })

    render(
      <WorldBibleTab
        projectId="project-1"
        activeEntryId={null}
        onSelectEntry={vi.fn()}
        onEditEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    )

    const laterNode = screen.getByText('乙事件')
    const earlierNode = screen.getByText('甲事件')

    expect(laterNode.compareDocumentPosition(earlierNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('surfaces the story tracker panel inside the world bible flow', () => {
    const eventEntry = makeEntry({ id: 'event-1', type: 'event', name: '甲事件' })
    const timelineEntry = makeEntry({ id: 'timeline-1', type: 'timeline', name: '一号时间线' })

    mockUseWorldEntries.mockReturnValue({
      entries: [eventEntry, timelineEntry],
      entriesByType: {
        character: [],
        faction: [],
        location: [],
        rule: [],
        secret: [],
        event: [eventEntry],
        timeline: [timelineEntry],
      },
      loading: false,
      addEntry: vi.fn(),
      softDeleteEntry: vi.fn(),
    })

    render(
      <WorldBibleTab
        projectId="project-1"
        activeEntryId={null}
        onSelectEntry={vi.fn()}
        onEditEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: '长期追踪' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '添加追踪项' })).toBeInTheDocument()
  })
})
