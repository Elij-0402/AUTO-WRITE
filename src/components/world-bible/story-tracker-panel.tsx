'use client'

import { useMemo, useState, type FormEvent } from 'react'
import type { StoryTracker, StoryTrackerKind, StoryTrackerStatus, WorldEntry } from '@/lib/types'
import { useStoryTrackers } from '@/lib/hooks/use-story-trackers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const STATUS_ORDER: StoryTrackerStatus[] = ['active', 'resolved', 'archived']

const STATUS_LABELS: Record<StoryTrackerStatus, string> = {
  active: '未解决',
  resolved: '已解决',
  archived: '已归档',
}

const KIND_ORDER: StoryTrackerKind[] = [
  'open_promise',
  'foreshadow',
  'consequence',
  'character_state',
  'relationship_state',
  'world_state',
]

const KIND_LABELS: Record<StoryTrackerKind, string> = {
  open_promise: '承诺',
  foreshadow: '伏笔',
  consequence: '后果',
  character_state: '人物状态',
  relationship_state: '关系状态',
  world_state: '世界状态',
}

interface StoryTrackerPanelProps {
  projectId: string
  entries?: WorldEntry[]
}

export function StoryTrackerPanel({ projectId, entries = [] }: StoryTrackerPanelProps) {
  const { trackers, loading, create, resolve } = useStoryTrackers(projectId)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [kind, setKind] = useState<StoryTrackerKind>('open_promise')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [linkedEntryId, setLinkedEntryId] = useState('')

  const timelineEntries = useMemo(
    () =>
      entries.filter(
        entry => !entry.deletedAt && (entry.type === 'event' || entry.type === 'timeline')
      ),
    [entries]
  )

  const sections = useMemo(() => {
    return STATUS_ORDER.map(status => ({
      status,
      groups: KIND_ORDER.map(groupKind => ({
        kind: groupKind,
        trackers: trackers.filter(
          tracker => tracker.status === status && tracker.kind === groupKind && tracker.deletedAt === null
        ),
      })).filter(group => group.trackers.length > 0),
    })).filter(section => section.groups.length > 0)
  }, [trackers])

  const resetComposer = () => {
    setKind('open_promise')
    setTitle('')
    setSummary('')
    setLinkedEntryId('')
    setIsComposerOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedSummary = summary.trim()
    if (!trimmedTitle || !trimmedSummary) return

    await create({
      kind,
      title: trimmedTitle,
      summary: trimmedSummary,
      subjectEntryIds: [],
      relatedEntryIds: linkedEntryId ? [linkedEntryId] : [],
      linkedTimelineEntryId: linkedEntryId || undefined,
    })

    resetComposer()
  }

  return (
    <section className="space-y-3 rounded-md border border-border bg-[hsl(var(--surface-1))] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[13px] font-medium text-foreground">长期追踪</h2>
          <p className="text-[11px] leading-5 text-muted-foreground">
            把承诺、伏笔、后果和持续状态挂在故事圣经里，避免长线遗失。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsComposerOpen(open => !open)}
        >
          添加追踪项
        </Button>
      </div>

      {isComposerOpen && (
        <form
          className="space-y-3 rounded-md border border-border bg-[hsl(var(--surface-2))] p-3"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-[12px] text-foreground">
              <span>类型</span>
              <select
                className="flex h-9 w-full rounded-sm border border-border bg-[hsl(var(--surface-1))] px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
                value={kind}
                onChange={event => setKind(event.target.value as StoryTrackerKind)}
              >
                {KIND_ORDER.map(option => (
                  <option key={option} value={option}>
                    {KIND_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-[12px] text-foreground">
              <span>关联时间点</span>
              <select
                aria-label="关联时间点"
                className="flex h-9 w-full rounded-sm border border-border bg-[hsl(var(--surface-1))] px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
                value={linkedEntryId}
                onChange={event => setLinkedEntryId(event.target.value)}
              >
                <option value="">暂不关联</option>
                {timelineEntries.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.timePoint ? `${entry.timePoint} · ${entry.name}` : entry.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-[12px] text-foreground">
            <span>标题</span>
            <Input
              aria-label="标题"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="例如：主角伤势何时痊愈"
            />
          </label>

          <label className="block space-y-1.5 text-[12px] text-foreground">
            <span>摘要</span>
            <Textarea
              aria-label="摘要"
              value={summary}
              onChange={event => setSummary(event.target.value)}
              placeholder="写下为什么要持续跟进这条线"
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetComposer}>
              取消
            </Button>
            <Button type="submit" size="sm" disabled={!title.trim() || !summary.trim()}>
              保存追踪项
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-md border border-border bg-[hsl(var(--surface-2))] px-3 py-4 text-[12px] text-muted-foreground">
          加载追踪项中...
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-[hsl(var(--surface-2))] px-3 py-4 text-[12px] text-muted-foreground">
          还没有长期追踪项。
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.status} className="space-y-2">
              <div className="text-[12px] font-medium text-foreground">{STATUS_LABELS[section.status]}</div>
              {section.groups.map(group => (
                <TrackerGroup
                  key={`${section.status}-${group.kind}`}
                  kind={group.kind}
                  trackers={group.trackers}
                  onResolve={resolve}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function TrackerGroup({
  kind,
  trackers,
  onResolve,
}: {
  kind: StoryTrackerKind
  trackers: StoryTracker[]
  onResolve: (trackerId: string) => Promise<void>
}) {
  return (
    <div className="rounded-md border border-border bg-[hsl(var(--surface-2))]">
      <div className="border-b border-border px-3 py-2 text-[12px] text-muted-foreground">
        {KIND_LABELS[kind]}
      </div>
      <ul className="divide-y divide-border">
        {trackers.map(tracker => (
          <li key={tracker.id} className="space-y-2 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[13px] text-foreground">{tracker.title}</div>
                <p className="text-[12px] leading-5 text-muted-foreground">{tracker.summary}</p>
              </div>
              {tracker.status === 'active' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`标记“${tracker.title}”为已解决`}
                  onClick={() => onResolve(tracker.id)}
                >
                  解决
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
