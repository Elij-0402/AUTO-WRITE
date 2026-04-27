import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { WorldBibleTab } from './world-bible-tab'
import { StoryBibleOverview } from './story-bible-overview'
import { WorldEntryEditForm } from './world-entry-edit-form'
import type { WorldEntry, Relation } from '@/lib/types'

const mockUseWorldEntries = vi.fn()
const mockUseRelations = vi.fn()
const mockUseContradictions = vi.fn()
const mockUseStoryTrackerCounts = vi.fn()
const mockUseStoryTrackers = vi.fn()
const mockUseAutoSave = vi.fn()

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

vi.mock('@/lib/hooks/use-autosave', () => ({
  useAutoSave: (...args: unknown[]) => mockUseAutoSave(...args),
}))

vi.mock('./relationship-section', () => ({
  RelationshipSection: () => <div>关联区占位</div>,
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

function getOverviewSummaryText(): string {
  const summary = screen.getByText((_, element) =>
    element?.tagName.toLowerCase() === 'p' &&
    element.textContent?.includes('实体分桶') === true &&
    element.textContent?.includes('未解决追踪') === true &&
    element.textContent?.includes('状态挂账') === true
  )

  return summary.textContent ?? ''
}

describe('StoryBible overview and story entity editors', () => {
  beforeEach(() => {
    mockUseAutoSave.mockReturnValue({ isSaving: false })
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
  })

  it('renders overview counts from props instead of hardcoded zeros', () => {
    render(
      <StoryBibleOverview
        entriesByType={{
          character: [makeEntry({ id: 'character-1', type: 'character', name: '沈夜' })],
          faction: [],
          location: [],
          rule: [],
          secret: [],
          event: [],
          timeline: [],
        }}
        trackerCounts={{
          unresolvedTrackers: 4,
          unresolvedStates: 3,
        }}
      />
    )

    expect(getOverviewSummaryText()).toContain('实体分桶 1 · 未解决追踪 4 · 状态挂账 3')
  })

  it('shows the overview summary and story-entity sidebar buckets in the world bible tab', () => {
    const entries = [
      makeEntry({ id: 'character-1', type: 'character', name: '沈夜' }),
      makeEntry({ id: 'faction-1', type: 'faction', name: '朱雀司' }),
      makeEntry({ id: 'secret-1', type: 'secret', name: '帝玺裂痕' }),
      makeEntry({ id: 'event-1', type: 'event', name: '朱雀门夜袭' }),
      makeEntry({ id: 'timeline-1', type: 'timeline', name: '前朝覆灭' }),
    ]

    mockUseWorldEntries.mockReturnValue({
      entries,
      entriesByType: {
        character: [entries[0]],
        faction: [entries[1]],
        location: [],
        rule: [],
        secret: [entries[2]],
        event: [entries[3]],
        timeline: [entries[4]],
      },
      loading: false,
      addEntry: vi.fn(),
      softDeleteEntry: vi.fn(),
    })
    mockUseStoryTrackerCounts.mockReturnValue({
      unresolvedTrackers: 5,
      unresolvedStates: 2,
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

    expect(screen.getByText('故事圣经概览')).toBeInTheDocument()
    expect(getOverviewSummaryText()).toContain('实体分桶 5 · 未解决追踪 5 · 状态挂账 2')
    expect(screen.getByRole('button', { name: '添加势力' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '添加秘密' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '添加事件' })).toBeInTheDocument()
  })

  it('renders faction fields with existing values', () => {
    const factionEntry = makeEntry({
      id: 'faction-1',
      type: 'faction',
      name: '朱雀司',
      factionRole: '帝都暗面秩序的维持者',
      factionGoal: '掩盖皇权裂痕',
      factionStyle: '先礼后刃',
    })

    mockUseWorldEntries.mockReturnValue({
      entries: [factionEntry],
      renameEntry: vi.fn(),
      updateEntryFields: vi.fn(),
    })

    render(
      <WorldEntryEditForm
        projectId="project-1"
        entryId={factionEntry.id}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        hasPrevious={false}
        hasNext={false}
        onSelectEntry={vi.fn()}
        allEntries={[factionEntry]}
      />
    )

    expect(screen.getByLabelText('名称')).toHaveValue('朱雀司')
    expect(screen.getByLabelText('阵营定位')).toHaveValue('帝都暗面秩序的维持者')
    expect(screen.getByLabelText('核心目标')).toHaveValue('掩盖皇权裂痕')
    expect(screen.getByLabelText('行事风格')).toHaveValue('先礼后刃')
  })

  it('renders secret fields with existing values', () => {
    const secretEntry = makeEntry({
      id: 'secret-1',
      type: 'secret',
      name: '帝玺裂痕',
      secretContent: '真正的传国玉玺早已碎裂',
      secretScope: '皇族与朱雀司',
      revealCondition: '太庙祭典失控时暴露',
    })

    mockUseWorldEntries.mockReturnValue({
      entries: [secretEntry],
      renameEntry: vi.fn(),
      updateEntryFields: vi.fn(),
    })

    render(
      <WorldEntryEditForm
        projectId="project-1"
        entryId={secretEntry.id}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        hasPrevious={false}
        hasNext={false}
        onSelectEntry={vi.fn()}
        allEntries={[secretEntry]}
      />
    )

    expect(screen.getByLabelText('名称')).toHaveValue('帝玺裂痕')
    expect(screen.getByLabelText('秘密内容')).toHaveValue('真正的传国玉玺早已碎裂')
    expect(screen.getByLabelText('影响范围')).toHaveValue('皇族与朱雀司')
    expect(screen.getByLabelText('揭露条件')).toHaveValue('太庙祭典失控时暴露')
  })

  it('renders event fields with existing values', () => {
    const eventEntry = makeEntry({
      id: 'event-1',
      type: 'event',
      name: '朱雀门夜袭',
      timePoint: '第一卷末',
      eventDescription: '主角第一次在众目睽睽下亮明身份',
      eventImpact: '各方势力公开站队',
    })

    mockUseWorldEntries.mockReturnValue({
      entries: [eventEntry],
      renameEntry: vi.fn(),
      updateEntryFields: vi.fn(),
    })

    render(
      <WorldEntryEditForm
        projectId="project-1"
        entryId={eventEntry.id}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        hasPrevious={false}
        hasNext={false}
        onSelectEntry={vi.fn()}
        allEntries={[eventEntry]}
      />
    )

    expect(screen.getByLabelText('名称')).toHaveValue('朱雀门夜袭')
    expect(screen.getByLabelText('时间点')).toHaveValue('第一卷末')
    expect(screen.getByLabelText('事件描述')).toHaveValue('主角第一次在众目睽睽下亮明身份')
    expect(screen.getByLabelText('事件影响')).toHaveValue('各方势力公开站队')
  })
})
