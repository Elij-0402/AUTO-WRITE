import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoryTracker, WorldEntry } from '@/lib/types'
import { StoryTrackerPanel } from './story-tracker-panel'

const mockUseStoryTrackers = vi.fn()

vi.mock('@/lib/hooks/use-story-trackers', () => ({
  useStoryTrackers: (...args: unknown[]) => mockUseStoryTrackers(...args),
}))

function makeTracker(overrides: Partial<StoryTracker>): StoryTracker {
  return {
    id: overrides.id ?? 'tracker-1',
    projectId: overrides.projectId ?? 'project-1',
    kind: overrides.kind ?? 'open_promise',
    title: overrides.title ?? '默认追踪',
    summary: overrides.summary ?? '默认摘要',
    subjectEntryIds: overrides.subjectEntryIds ?? [],
    relatedEntryIds: overrides.relatedEntryIds ?? [],
    linkedTimelineEntryId: overrides.linkedTimelineEntryId,
    status: overrides.status ?? 'active',
    createdAt: overrides.createdAt ?? 1,
    updatedAt: overrides.updatedAt ?? 1,
    resolvedAt: overrides.resolvedAt,
    deletedAt: overrides.deletedAt ?? null,
  }
}

function makeEntry(overrides: Partial<WorldEntry>): WorldEntry {
  const now = new Date('2026-04-27T00:00:00.000Z')
  return {
    id: overrides.id ?? 'entry-1',
    projectId: overrides.projectId ?? 'project-1',
    type: overrides.type ?? 'timeline',
    name: overrides.name ?? '默认条目',
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
    ...overrides,
  }
}

describe('StoryTrackerPanel', () => {
  beforeEach(() => {
    mockUseStoryTrackers.mockReset()
  })

  it('creates a tracker and resolves an existing tracker inline', async () => {
    const create = vi.fn().mockResolvedValue(undefined)
    const resolve = vi.fn().mockResolvedValue(undefined)

    mockUseStoryTrackers.mockReturnValue({
      trackers: [
        makeTracker({
          id: 'tracker-open',
          kind: 'open_promise',
          title: '皇帝的病不能被草草治好',
          summary: '第一卷立下的病灶必须持续追踪',
          linkedTimelineEntryId: 'event-1',
        }),
        makeTracker({
          id: 'tracker-done',
          kind: 'foreshadow',
          title: '玉玺裂痕的伏笔',
          summary: '已经回收',
          status: 'resolved',
          resolvedAt: 200,
        }),
      ],
      loading: false,
      create,
      resolve,
    })

    render(
      <StoryTrackerPanel
        projectId="project-1"
        entries={[
          makeEntry({ id: 'event-1', type: 'event', name: '朱雀门夜袭', timePoint: '第一卷末' }),
        ]}
      />
    )

    expect(screen.getByText('未解决')).toBeInTheDocument()
    expect(screen.getByText('已解决')).toBeInTheDocument()
    expect(screen.getByText('皇帝的病不能被草草治好')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '添加追踪项' }))
    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: '新承诺不能丢' },
    })
    fireEvent.change(screen.getByLabelText('摘要'), {
      target: { value: '第二卷前必须兑现' },
    })
    fireEvent.change(screen.getByLabelText('关联时间点'), {
      target: { value: 'event-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存追踪项' }))

    expect(create).toHaveBeenCalledWith({
      kind: 'open_promise',
      title: '新承诺不能丢',
      summary: '第二卷前必须兑现',
      subjectEntryIds: [],
      relatedEntryIds: ['event-1'],
      linkedTimelineEntryId: 'event-1',
    })

    fireEvent.click(screen.getByRole('button', { name: '标记“皇帝的病不能被草草治好”为已解决' }))
    expect(resolve).toHaveBeenCalledWith('tracker-open')
  })
})
