# Longform Co-Creation Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade InkForge from a four-type world encyclopedia into a story bible that can carry factions, secrets, major events, and long-term narrative trackers for long-form novel work.

**Architecture:** Phase 2 keeps the existing `worldEntries` / `relations` foundation instead of replacing it. We extend `WorldEntry` to cover richer story entities (`faction`, `secret`, `event`) and add one new append-and-update capable `storyTrackers` table for long-term state objects (`人物状态 / 关系状态 / 世界状态 / 伏笔 / 承诺 / 后果`), then wire both into the existing world-bible editor, timeline view, and AI prompt assembly.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie/IndexedDB, Vitest, React Testing Library, existing InkForge AI prompt pipeline.

---

## Scope Check

The source spec still spans Phases 2-6. This plan covers only `9.2 Phase 2：故事圣经升级` and stops before:

1. `卷纲 / 章纲 / 场景卡` planning objects
2. the Phase 4 writing-surface rebuild
3. the Phase 5 drift-alert cockpit

That means this phase will create the canonical story-bible objects those later phases depend on, but it will not attempt to build the later workflow shells yet.

## File Structure Map

### Create

- `src/lib/types/story-tracker.ts`  
  Phase 2 tracker domain types: `StoryTracker`, `StoryTrackerKind`, `StoryTrackerStatus`, and write payload types.

- `src/lib/db/story-tracker-queries.ts`  
  Dexie query helpers for tracker CRUD, ordering, and status transitions.

- `src/lib/db/story-tracker-queries.test.ts`  
  Query tests for tracker creation, grouping, resolution, and soft-delete filtering.

- `src/lib/db/project-db.migration-v18.test.ts`  
  Migration test proving a v17 project DB upgrades cleanly and exposes the new `storyTrackers` table.

- `src/lib/hooks/use-story-trackers.ts`  
  LiveQuery-backed hook for tracker lists and mutations from world-bible / analysis UI.

- `src/components/world-bible/story-tracker-panel.tsx`  
  Story-bible side panel for long-term trackers, with grouped sections and inline status actions.

- `src/components/world-bible/story-tracker-panel.test.tsx`  
  UI test for tracker grouping, creation, and resolve/archive actions.

- `src/components/world-bible/story-bible-overview.tsx`  
  Lightweight summary surface for factions, secrets, events, and unresolved promises/state items.

- `src/components/world-bible/story-bible-overview.test.tsx`  
  Smoke test for summary counts and empty states.

### Modify

- `src/lib/types/world-entry.ts`  
  Expand `WorldEntryType` and add the smallest Phase 2 fields needed for `faction`, `secret`, `event`, and timeline ordering/constraints.

- `src/lib/types/index.ts`  
  Re-export the new tracker types.

- `src/lib/db/project-db.ts`  
  Add Dexie v18 schema and typed `storyTrackers` table.

- `src/lib/db/world-entry-queries.ts`  
  Support the new entry types, default names, keyword coverage, and timeline/event ordering helpers.

- `src/lib/db/world-entry-queries.test.ts`  
  Extend tests for new types, sort order, and event/timeline constraint fields.

- `src/lib/hooks/use-world-entries.ts`  
  Expose grouped entries for the expanded type set.

- `src/components/world-bible/world-bible-tab.tsx`  
  Add sections for `势力 / 秘密 / 重大事件`, and embed a story-bible overview entry point.

- `src/components/world-bible/world-entry-edit-form.tsx`  
  Add type-specific editors for the new entry kinds and timeline ordering fields.

- `src/components/world-bible/relationship-section.tsx`  
  Allow faction/secret/event entries to participate in relationships without character-only defaults.

- `src/components/analysis/timeline-view.tsx`  
  Upgrade from free-text-only list to ordered story timeline using `timeOrder`, event/timeline types, and linked tracker badges.

- `src/app/projects/[id]/analysis/page.tsx`  
  Feed tracker data into the analysis view and rename the timeline copy so it reads as story-bible control, not a demo widget.

- `src/lib/ai/prompts.ts`  
  Add structured story-bible context blocks for factions, secrets, events, and unresolved trackers.

- `src/lib/ai/prompts.test.ts`  
  Assert the new story-bible sections are included in flattened prompts.

- `src/lib/hooks/use-ai-chat.ts`  
  Load story trackers alongside world entries and inject both into the system prompt.

## Domain Model Decisions

### Expanded `WorldEntryType`

Phase 2 keeps the existing model and extends it to:

```ts
export type WorldEntryType =
  | 'character'
  | 'faction'
  | 'location'
  | 'rule'
  | 'secret'
  | 'event'
  | 'timeline'
```

### New `StoryTracker`

One unified tracker object is sufficient for this phase:

```ts
export type StoryTrackerKind =
  | 'character_state'
  | 'relationship_state'
  | 'world_state'
  | 'open_promise'
  | 'foreshadow'
  | 'consequence'

export type StoryTrackerStatus = 'active' | 'resolved' | 'archived'

export interface StoryTracker {
  id: string
  projectId: string
  kind: StoryTrackerKind
  title: string
  summary: string
  subjectEntryIds: string[]
  relatedEntryIds: string[]
  linkedTimelineEntryId?: string
  status: StoryTrackerStatus
  createdAt: number
  updatedAt: number
  resolvedAt?: number
  deletedAt: number | null
}
```

This is intentionally smaller than the Phase 5 alerting system. Trackers are the canonical durable objects; alerts can be derived later.

## Task 1: Add Phase 2 Story-Bible Storage

**Files:**
- Create: `src/lib/types/story-tracker.ts`
- Create: `src/lib/db/story-tracker-queries.ts`
- Create: `src/lib/db/story-tracker-queries.test.ts`
- Create: `src/lib/db/project-db.migration-v18.test.ts`
- Modify: `src/lib/types/world-entry.ts`
- Modify: `src/lib/types/index.ts`
- Modify: `src/lib/db/project-db.ts`

- [ ] **Step 1: Write the failing storage tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetProjectDBCache, createProjectDB } from './project-db'
import { addWorldEntry, updateWorldEntryFields } from './world-entry-queries'
import {
  createStoryTracker,
  listStoryTrackersByKind,
  resolveStoryTracker,
} from './story-tracker-queries'

describe('story tracker queries', () => {
  const projectId = 'phase2-story-bible'

  beforeEach(() => {
    __resetProjectDBCache()
    indexedDB.deleteDatabase(`inkforge-project-${projectId}`)
  })

  it('creates and groups long-term trackers', async () => {
    const db = createProjectDB(projectId)
    const heroId = await addWorldEntry(db, projectId, 'character', '沈夜')
    const eventId = await addWorldEntry(db, projectId, 'event', '朱雀门夜袭')

    await updateWorldEntryFields(db, eventId, {
      timePoint: '第一卷末',
      timeOrder: 120,
      eventDescription: '主角第一次公开暴露身份',
    })

    await createStoryTracker(projectId, {
      kind: 'open_promise',
      title: '沈夜必须查清夜袭幕后主使',
      summary: '第一卷立下的核心承诺，第二卷前不能丢',
      subjectEntryIds: [heroId],
      relatedEntryIds: [eventId],
      linkedTimelineEntryId: eventId,
    })

    const promises = await listStoryTrackersByKind(projectId, 'open_promise')
    expect(promises).toHaveLength(1)
    expect(promises[0].title).toContain('幕后主使')
    expect(promises[0].status).toBe('active')
  })

  it('resolves trackers without removing them from history', async () => {
    const tracker = await createStoryTracker(projectId, {
      kind: 'foreshadow',
      title: '玉玺裂痕的伏笔',
      summary: '第三章出现，后续会引出正统问题',
      subjectEntryIds: [],
      relatedEntryIds: [],
    })

    await resolveStoryTracker(projectId, tracker.id)

    const rows = await listStoryTrackersByKind(projectId, 'foreshadow')
    expect(rows[0].status).toBe('resolved')
    expect(rows[0].resolvedAt).toBeTypeOf('number')
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { InkForgeProjectDB } from './project-db'

describe('project db v18 migration', () => {
  it('upgrades a v17 database with storyTrackers table', async () => {
    const dbName = 'inkforge-project-migration-v18'
    await Dexie.delete(dbName)

    const legacy = new Dexie(dbName)
    legacy.version(17).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      contradictions: 'id, projectId, messageId, entryName, exempted, createdAt, [projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
      projectCharter: 'id, projectId, updatedAt',
      preferenceMemories: 'id, projectId, messageId, createdAt, [projectId+createdAt]',
    })
    await legacy.open()
    await legacy.close()

    const upgraded = new InkForgeProjectDB('migration-v18')
    ;(upgraded as unknown as { name: string }).name = dbName
    await upgraded.open()

    expect(upgraded.tables.some(table => table.name === 'storyTrackers')).toBe(true)

    await upgraded.close()
    await Dexie.delete(dbName)
  })
})
```

- [ ] **Step 2: Run the targeted tests and confirm they fail**

Run:

```bash
npx vitest run src/lib/db/story-tracker-queries.test.ts src/lib/db/project-db.migration-v18.test.ts
```

Expected:

```text
FAIL  Cannot find module './story-tracker-queries'
FAIL  Property 'storyTrackers' does not exist on type 'InkForgeProjectDB'
```

- [ ] **Step 3: Implement the v18 schema, tracker types, and minimal world-entry field expansion**

```ts
// src/lib/types/world-entry.ts (relevant additions)
export type WorldEntryType =
  | 'character'
  | 'faction'
  | 'location'
  | 'rule'
  | 'secret'
  | 'event'
  | 'timeline'

export interface WorldEntry {
  id: string
  projectId: string
  type: WorldEntryType
  name: string
  factionRole?: string
  factionGoal?: string
  factionStyle?: string
  secretContent?: string
  secretScope?: string
  revealCondition?: string
  eventDescription?: string
  eventImpact?: string
  timePoint?: string
  timeOrder?: number | null
  dependencyEntryIds?: string[]
  // ...existing fields...
}
```

```ts
// src/lib/types/story-tracker.ts
export type StoryTrackerKind =
  | 'character_state'
  | 'relationship_state'
  | 'world_state'
  | 'open_promise'
  | 'foreshadow'
  | 'consequence'

export type StoryTrackerStatus = 'active' | 'resolved' | 'archived'

export interface StoryTracker {
  id: string
  projectId: string
  kind: StoryTrackerKind
  title: string
  summary: string
  subjectEntryIds: string[]
  relatedEntryIds: string[]
  linkedTimelineEntryId?: string
  status: StoryTrackerStatus
  createdAt: number
  updatedAt: number
  resolvedAt?: number
  deletedAt: number | null
}

export interface CreateStoryTrackerInput {
  kind: StoryTrackerKind
  title: string
  summary: string
  subjectEntryIds: string[]
  relatedEntryIds: string[]
  linkedTimelineEntryId?: string
}
```

```ts
// src/lib/db/project-db.ts (additions only)
import type { StoryTracker } from '../types'

export class InkForgeProjectDB extends Dexie {
  storyTrackers!: Table<StoryTracker, string>

  constructor(projectId: string) {
    super(`inkforge-project-${projectId}`)
    // ...existing versions...
    this.version(18).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      contradictions:
        'id, projectId, messageId, entryName, exempted, createdAt, ' +
        '[projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
      projectCharter: 'id, projectId, updatedAt',
      preferenceMemories: 'id, projectId, messageId, createdAt, [projectId+createdAt]',
      storyTrackers: 'id, projectId, kind, status, createdAt, [projectId+kind], [projectId+status]',
    })
  }
}
```

```ts
// src/lib/db/story-tracker-queries.ts
import { nanoid } from 'nanoid'
import { createProjectDB } from './project-db'
import type { CreateStoryTrackerInput, StoryTracker, StoryTrackerKind } from '../types'

export async function createStoryTracker(
  projectId: string,
  input: CreateStoryTrackerInput
): Promise<StoryTracker> {
  const row: StoryTracker = {
    id: nanoid(),
    projectId,
    ...input,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
  }
  await createProjectDB(projectId).storyTrackers.add(row)
  return row
}

export async function listStoryTrackersByKind(
  projectId: string,
  kind: StoryTrackerKind
): Promise<StoryTracker[]> {
  return createProjectDB(projectId).storyTrackers
    .where('[projectId+kind]')
    .equals([projectId, kind])
    .filter(row => row.deletedAt === null)
    .reverse()
    .sortBy('updatedAt')
}

export async function resolveStoryTracker(projectId: string, trackerId: string): Promise<void> {
  await createProjectDB(projectId).storyTrackers.update(trackerId, {
    status: 'resolved',
    updatedAt: Date.now(),
    resolvedAt: Date.now(),
  })
}
```

- [ ] **Step 4: Re-run the targeted storage tests**

Run:

```bash
npx vitest run src/lib/db/story-tracker-queries.test.ts src/lib/db/project-db.migration-v18.test.ts
```

Expected:

```text
PASS  src/lib/db/story-tracker-queries.test.ts
PASS  src/lib/db/project-db.migration-v18.test.ts
```

- [ ] **Step 5: Commit the storage layer**

```bash
git add src/lib/types/story-tracker.ts src/lib/types/world-entry.ts src/lib/types/index.ts src/lib/db/project-db.ts src/lib/db/story-tracker-queries.ts src/lib/db/story-tracker-queries.test.ts src/lib/db/project-db.migration-v18.test.ts
git commit -m "feat(story-bible): add phase2 tracker storage"
```

## Task 2: Extend World-Entry Queries for Story-Bible Entities

**Files:**
- Modify: `src/lib/db/world-entry-queries.ts`
- Modify: `src/lib/db/world-entry-queries.test.ts`
- Modify: `src/lib/hooks/use-world-entries.ts`

- [ ] **Step 1: Extend query tests to cover new types and ordered events**

```ts
it('creates faction, secret, and event entries with type-specific defaults', async () => {
  const factionId = await addWorldEntry(db, 'proj-1', 'faction')
  const secretId = await addWorldEntry(db, 'proj-1', 'secret')
  const eventId = await addWorldEntry(db, 'proj-1', 'event')

  expect((await db.worldEntries.get(factionId))?.name).toBe('未命名势力')
  expect((await db.worldEntries.get(secretId))?.name).toBe('未命名秘密')
  expect((await db.worldEntries.get(eventId))?.name).toBe('未命名事件')
})

it('sorts timeline and event entries by timeOrder before fallbacking to name', async () => {
  const first = await addWorldEntry(db, 'proj-1', 'event', '后手')
  const second = await addWorldEntry(db, 'proj-1', 'timeline', '先手')

  await updateWorldEntryFields(db, first, { timeOrder: 20, timePoint: '第二卷' })
  await updateWorldEntryFields(db, second, { timeOrder: 10, timePoint: '第一卷' })

  const entries = await getWorldEntries(db, 'proj-1')
  const ordered = entries.filter(e => e.type === 'event' || e.type === 'timeline')
  expect(ordered.map(e => e.name)).toEqual(['先手', '后手'])
})
```

- [ ] **Step 2: Run the world-entry query tests and confirm they fail**

Run:

```bash
npx vitest run src/lib/db/world-entry-queries.test.ts
```

Expected:

```text
FAIL  Type '"faction"' is not assignable to type 'WorldEntryType'
FAIL  Expected '未命名势力' but received undefined
```

- [ ] **Step 3: Update defaults, search coverage, and grouped return values**

```ts
// src/lib/db/world-entry-queries.ts (relevant additions)
const DEFAULT_NAMES: Record<WorldEntryType, string> = {
  character: '未命名角色',
  faction: '未命名势力',
  location: '未命名地点',
  rule: '未命名规则',
  secret: '未命名秘密',
  event: '未命名事件',
  timeline: '未命名时间线',
}

function compareStoryOrder(a: WorldEntry, b: WorldEntry): number {
  const aOrder = a.timeOrder ?? Number.MAX_SAFE_INTEGER
  const bOrder = b.timeOrder ?? Number.MAX_SAFE_INTEGER
  if (aOrder !== bOrder) return aOrder - bOrder
  return a.name.localeCompare(b.name, 'zh-CN')
}

export async function getWorldEntries(
  db: InkForgeProjectDB,
  projectId: string,
  type?: WorldEntryType
): Promise<WorldEntry[]> {
  const entries = await db.worldEntries
    .filter(entry =>
      entry.projectId === projectId &&
      entry.deletedAt === null &&
      (type === undefined || entry.type === type)
    )
    .toArray()

  return entries.sort((a, b) => {
    const storyTypes = new Set<WorldEntryType>(['event', 'timeline'])
    if (storyTypes.has(a.type) && storyTypes.has(b.type)) {
      return compareStoryOrder(a, b)
    }
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}
```

```ts
// src/lib/hooks/use-world-entries.ts (grouping additions)
return {
  character: entries.filter(e => e.type === 'character'),
  faction: entries.filter(e => e.type === 'faction'),
  location: entries.filter(e => e.type === 'location'),
  rule: entries.filter(e => e.type === 'rule'),
  secret: entries.filter(e => e.type === 'secret'),
  event: entries.filter(e => e.type === 'event'),
  timeline: entries.filter(e => e.type === 'timeline'),
}
```

- [ ] **Step 4: Re-run the query test suite**

Run:

```bash
npx vitest run src/lib/db/world-entry-queries.test.ts
```

Expected:

```text
PASS  src/lib/db/world-entry-queries.test.ts
```

- [ ] **Step 5: Commit the query expansion**

```bash
git add src/lib/db/world-entry-queries.ts src/lib/db/world-entry-queries.test.ts src/lib/hooks/use-world-entries.ts
git commit -m "feat(story-bible): expand world entry queries for phase2 entities"
```

## Task 3: Rebuild the World-Bible Editor Around Story Entities

**Files:**
- Modify: `src/components/world-bible/world-bible-tab.tsx`
- Modify: `src/components/world-bible/world-entry-edit-form.tsx`
- Modify: `src/components/world-bible/relationship-section.tsx`
- Create: `src/components/world-bible/story-bible-overview.tsx`
- Create: `src/components/world-bible/story-bible-overview.test.tsx`

- [ ] **Step 1: Write the failing overview/editor tests**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StoryBibleOverview } from './story-bible-overview'

describe('StoryBibleOverview', () => {
  it('shows unresolved tracker counts and new entity buckets', () => {
    render(
      <StoryBibleOverview
        entriesByType={{
          character: [],
          faction: [{ id: '1', type: 'faction', name: '北府司', projectId: 'p', tags: [], createdAt: new Date(), updatedAt: new Date(), deletedAt: null }],
          location: [],
          rule: [],
          secret: [{ id: '2', type: 'secret', name: '先帝遗诏', projectId: 'p', tags: [], createdAt: new Date(), updatedAt: new Date(), deletedAt: null }],
          event: [],
          timeline: [],
        }}
        trackerCounts={{
          open_promise: 2,
          foreshadow: 1,
          consequence: 0,
          character_state: 0,
          relationship_state: 0,
          world_state: 1,
        }}
      />
    )

    expect(screen.getByText('势力')).toBeInTheDocument()
    expect(screen.getByText('秘密')).toBeInTheDocument()
    expect(screen.getByText('未兑现承诺')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the new UI tests and confirm they fail**

Run:

```bash
npx vitest run src/components/world-bible/story-bible-overview.test.tsx
```

Expected:

```text
FAIL  Cannot find module './story-bible-overview'
```

- [ ] **Step 3: Add new sections, editor fields, and overview summary**

```tsx
// src/components/world-bible/world-bible-tab.tsx (relevant additions)
const TYPE_ORDER: WorldEntryType[] = ['character', 'faction', 'location', 'rule', 'secret', 'event', 'timeline']

function getTypeName(type: WorldEntryType): string {
  switch (type) {
    case 'character': return '角色'
    case 'faction': return '势力'
    case 'location': return '地点'
    case 'rule': return '规则'
    case 'secret': return '秘密'
    case 'event': return '事件'
    case 'timeline': return '时间线'
  }
}
```

```tsx
// src/components/world-bible/world-entry-edit-form.tsx (new type branches)
case 'faction':
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">名称</Label>
        <Input id="name" value={localName} onChange={e => setLocalName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>阵营定位</Label>
        <AutoGrowTextarea value={localFactionRole} onChange={setLocalFactionRole} placeholder="这个势力在世界格局中的位置..." />
      </div>
      <div className="space-y-2">
        <Label>核心目标</Label>
        <AutoGrowTextarea value={localFactionGoal} onChange={setLocalFactionGoal} placeholder="它想得到什么、守住什么..." />
      </div>
    </>
  )

case 'secret':
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">秘密名</Label>
        <Input id="name" value={localName} onChange={e => setLocalName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>秘密内容</Label>
        <AutoGrowTextarea value={localSecretContent} onChange={setLocalSecretContent} placeholder="这条秘密到底是什么..." />
      </div>
      <div className="space-y-2">
        <Label>揭露条件</Label>
        <AutoGrowTextarea value={localRevealCondition} onChange={setLocalRevealCondition} placeholder="何时、因何被揭开..." />
      </div>
    </>
  )

case 'event':
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">事件名</Label>
        <Input id="name" value={localName} onChange={e => setLocalName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="timePoint">时间点</Label>
          <Input id="timePoint" value={localTimePoint} onChange={e => setLocalTimePoint(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeOrder">顺序号</Label>
          <Input id="timeOrder" inputMode="numeric" value={localTimeOrder} onChange={e => setLocalTimeOrder(e.target.value)} />
        </div>
      </div>
    </>
  )
```

- [ ] **Step 4: Re-run the targeted UI tests**

Run:

```bash
npx vitest run src/components/world-bible/story-bible-overview.test.tsx
```

Expected:

```text
PASS  src/components/world-bible/story-bible-overview.test.tsx
```

- [ ] **Step 5: Commit the world-bible UI upgrade**

```bash
git add src/components/world-bible/world-bible-tab.tsx src/components/world-bible/world-entry-edit-form.tsx src/components/world-bible/relationship-section.tsx src/components/world-bible/story-bible-overview.tsx src/components/world-bible/story-bible-overview.test.tsx
git commit -m "feat(story-bible): upgrade editor for factions secrets and events"
```

## Task 4: Add Long-Term Tracker UI and Timeline Surfacing

**Files:**
- Create: `src/lib/hooks/use-story-trackers.ts`
- Create: `src/components/world-bible/story-tracker-panel.tsx`
- Create: `src/components/world-bible/story-tracker-panel.test.tsx`
- Modify: `src/components/analysis/timeline-view.tsx`
- Modify: `src/app/projects/[id]/analysis/page.tsx`

- [ ] **Step 1: Write the failing tracker panel test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StoryTrackerPanel } from './story-tracker-panel'

describe('StoryTrackerPanel', () => {
  it('creates an open promise and resolves it inline', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    const onResolve = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <StoryTrackerPanel
        trackers={{ open_promise: [], foreshadow: [], consequence: [], character_state: [], relationship_state: [], world_state: [] }}
        onCreate={onCreate}
        onResolve={onResolve}
      />
    )

    await user.click(screen.getByRole('button', { name: '添加追踪项' }))
    await user.type(screen.getByLabelText('标题'), '皇帝的病不能被草草治好')
    await user.click(screen.getByRole('button', { name: '保存追踪项' }))

    expect(onCreate).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tracker panel test and confirm it fails**

Run:

```bash
npx vitest run src/components/world-bible/story-tracker-panel.test.tsx
```

Expected:

```text
FAIL  Cannot find module './story-tracker-panel'
```

- [ ] **Step 3: Implement hook, tracker panel, and timeline badges**

```ts
// src/lib/hooks/use-story-trackers.ts
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import {
  createStoryTracker,
  listAllStoryTrackers,
  resolveStoryTracker,
} from '../db/story-tracker-queries'

export function useStoryTrackers(projectId: string) {
  const trackers = useLiveQuery(() => listAllStoryTrackers(projectId), [projectId], null)

  return {
    trackers,
    loading: trackers === null,
    create: (input: Parameters<typeof createStoryTracker>[1]) => createStoryTracker(projectId, input),
    resolve: (trackerId: string) => resolveStoryTracker(projectId, trackerId),
  }
}
```

```tsx
// src/components/analysis/timeline-view.tsx (relevant additions)
export function TimelineView({
  entries,
  trackerCountsByTimelineEntryId = {},
}: {
  entries: WorldEntry[]
  trackerCountsByTimelineEntryId?: Record<string, number>
}) {
  const timeline = entries
    .filter(e => (e.type === 'timeline' || e.type === 'event') && !e.deletedAt)
    .sort((a, b) => {
      const aOrder = a.timeOrder ?? Number.MAX_SAFE_INTEGER
      const bOrder = b.timeOrder ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
      return naturalCompare(a.timePoint ?? '', b.timePoint ?? '')
    })
```

- [ ] **Step 4: Re-run the tracker/timeline tests**

Run:

```bash
npx vitest run src/components/world-bible/story-tracker-panel.test.tsx
```

Expected:

```text
PASS  src/components/world-bible/story-tracker-panel.test.tsx
```

- [ ] **Step 5: Commit tracker UI and timeline surfacing**

```bash
git add src/lib/hooks/use-story-trackers.ts src/components/world-bible/story-tracker-panel.tsx src/components/world-bible/story-tracker-panel.test.tsx src/components/analysis/timeline-view.tsx src/app/projects/[id]/analysis/page.tsx
git commit -m "feat(story-bible): surface long-term trackers and ordered timeline"
```

## Task 5: Inject Rich Story-Bible Context into AI Calls

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`
- Modify: `src/lib/hooks/use-ai-chat.ts`

- [ ] **Step 1: Add failing prompt assertions for story-bible sections**

```ts
it('includes factions secrets events and unresolved trackers in the system prompt', () => {
  const segments = buildSegmentedSystemPrompt({
    projectCharter: makeCharter(),
    worldEntries: [
      { id: 'f1', projectId: 'p', type: 'faction', name: '北府司', tags: [], createdAt: new Date(), updatedAt: new Date(), deletedAt: null, factionGoal: '压住京中兵权' },
      { id: 's1', projectId: 'p', type: 'secret', name: '先帝遗诏', tags: [], createdAt: new Date(), updatedAt: new Date(), deletedAt: null, secretContent: '太子并未夭折' },
      { id: 'e1', projectId: 'p', type: 'event', name: '朱雀门夜袭', tags: [], createdAt: new Date(), updatedAt: new Date(), deletedAt: null, timePoint: '第一卷末', timeOrder: 120, eventDescription: '主角身份暴露' },
    ],
    storyTrackers: [
      { id: 't1', projectId: 'p', kind: 'open_promise', title: '找出幕后主使', summary: '不能中途遗忘', subjectEntryIds: [], relatedEntryIds: ['e1'], status: 'active', createdAt: 1, updatedAt: 1, deletedAt: null },
    ],
  })

  expect(segments.worldBibleContext).toContain('【故事圣经】')
  expect(segments.worldBibleContext).toContain('势力')
  expect(segments.worldBibleContext).toContain('未兑现承诺')
})
```

- [ ] **Step 2: Run the prompt test and confirm it fails**

Run:

```bash
npx vitest run src/lib/ai/prompts.test.ts
```

Expected:

```text
FAIL  Property 'storyTrackers' does not exist on type 'BuildSystemPromptParams'
```

- [ ] **Step 3: Add story-bible prompt segments and load trackers inside `use-ai-chat`**

```ts
// src/lib/ai/prompts.ts (relevant additions)
import type { StoryTracker, WorldEntry } from '../types'

export interface BuildSystemPromptParams {
  projectCharter?: ProjectCharter | null
  worldEntries: WorldEntry[]
  storyTrackers?: StoryTracker[]
  selectedText?: string
  rollingSummary?: string
  chapterDraftInstruction?: string
}

function buildStoryBibleBlock(entries: WorldEntry[], trackers: StoryTracker[] = []): string {
  const factions = entries.filter(entry => entry.type === 'faction')
  const secrets = entries.filter(entry => entry.type === 'secret')
  const events = entries.filter(entry => entry.type === 'event' || entry.type === 'timeline')
  const activePromises = trackers.filter(row => row.kind === 'open_promise' && row.status === 'active')

  return [
    '【故事圣经】',
    factions.length > 0 && `势力：${factions.map(row => `${row.name}(${row.factionGoal || '目标待补'})`).join('；')}`,
    secrets.length > 0 && `秘密：${secrets.map(row => `${row.name}(${row.secretContent || '内容待补'})`).join('；')}`,
    events.length > 0 && `重大事件：${events.map(row => `${row.timePoint || '时间待定'}-${row.name}`).join('；')}`,
    activePromises.length > 0 && `未兑现承诺：${activePromises.map(row => row.title).join('；')}`,
  ]
    .filter(Boolean)
    .join('\n')
}
```

```ts
// src/lib/hooks/use-ai-chat.ts (inside sendMessage)
import { listAllStoryTrackers } from '../db/story-tracker-queries'

const [charter, trackers] = await Promise.all([
  getProjectCharter(projectId),
  listAllStoryTrackers(projectId),
])

const segmentedSystem = buildSegmentedSystemPrompt({
  projectCharter: charter,
  worldEntries: trimmedEntries,
  storyTrackers: trackers,
  selectedText: options?.selectedText,
  rollingSummary: conversation?.rollingSummary,
})
```

- [ ] **Step 4: Re-run the prompt tests**

Run:

```bash
npx vitest run src/lib/ai/prompts.test.ts
```

Expected:

```text
PASS  src/lib/ai/prompts.test.ts
```

- [ ] **Step 5: Commit the AI context integration**

```bash
git add src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts src/lib/hooks/use-ai-chat.ts
git commit -m "feat(ai): inject story bible context into prompts"
```

## Final Verification

- [ ] **Step 1: Run focused Phase 2 regression tests**

```bash
npx vitest run src/lib/db/story-tracker-queries.test.ts src/lib/db/project-db.migration-v18.test.ts src/lib/db/world-entry-queries.test.ts src/components/world-bible/story-bible-overview.test.tsx src/components/world-bible/story-tracker-panel.test.tsx src/lib/ai/prompts.test.ts
```

Expected:

```text
All targeted Phase 2 tests PASS
```

- [ ] **Step 2: Run project-wide quality gates**

```bash
pnpm lint
pnpm test
```

Expected:

```text
eslint: 0 errors
vitest: all tests pass
```

- [ ] **Step 3: Commit the final green state if verification required a fixup**

```bash
git add src
git commit -m "test(story-bible): verify phase2 story bible upgrade"
```

## Self-Review

### Spec coverage

- `世界规则、势力、秘密、重大事件、长期状态` -> Tasks 1-4
- `人物状态与关系状态` -> Task 1 tracker model + Task 4 tracker UI
- `时间线从静态展示升级为可约束对象` -> Task 2 ordering fields + Task 4 timeline view
- `伏笔 / 承诺 / 后果长期追踪` -> Task 1 tracker storage + Task 4 panel
- `关系图和百科并入故事圣经` -> Task 3 overview/editor upgrade, while keeping current analysis page as a transitional host until Phase 5

### Intentional omissions

- `卷纲 / 章纲 / 场景卡` planning objects remain in Phase 3
- automatic drift alerts and pacing alarms remain in Phase 5
- onboarding / incubation flow remains in Phase 6

### Placeholder scan

Completed manually before handoff: no `TODO`, `TBD`, or "similar to Task N" shortcuts remain in this plan.
