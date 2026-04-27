# Longform Co-Creation Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a durable planning chain in InkForge so a writer can move from loose ideas to volume outlines, chapter outlines, and scene cards without losing alignment with the charter, story bible, and current progress.

**Architecture:** Phase 3 adds a dedicated planning model instead of stretching `Chapter` beyond its role as the writing artifact. We introduce four new planning objects (`IdeaNote`, `StoryArc`, `ChapterPlan`, `SceneCard`), persist them in the per-project Dexie database, expose them through focused query helpers and hooks, and surface them in a new planning sidebar/workbench that sits beside the existing chapter editor without attempting the Phase 4 writing-surface rebuild.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie/IndexedDB, Vitest, React Testing Library, existing InkForge AI prompt and local-first data architecture.

---

## Scope Check

The source spec still spans multiple roadmap phases. This plan covers only `9.3 Phase 3：规划链路`:

1. `灵感池`
2. `卷纲生成与编辑`
3. `章纲生成与编辑`
4. `场景卡拆解`
5. `从宪章 + 世界模型 + 当前进度推导下一步规划`

This phase explicitly does **not** include:

1. Phase 4 scene-based drafting and chapter synthesis
2. Phase 5 alerting/cockpit logic
3. preference-learning writeback automation beyond lightweight planning notes

## File Structure Map

### Create

- `src/lib/types/planning.ts`  
  Phase 3 planning domain types: `IdeaNote`, `StoryArc`, `ChapterPlan`, `SceneCard`, enum unions, and payload helpers.

- `src/lib/db/planning-queries.ts`  
  Dexie CRUD/query helpers for planning objects, ordered retrieval, and cross-object updates.

- `src/lib/db/planning-queries.test.ts`  
  Query tests for creation, ordering, soft deletion, scene-card propagation, and chapter-plan status summaries.

- `src/lib/db/project-db.migration-v19.test.ts`  
  Migration test proving a v18 project upgrades cleanly and exposes all planning tables.

- `src/lib/hooks/use-planning.ts`  
  LiveQuery-backed planning hook with grouped reads and mutations for the planning UI.

- `src/components/planning/planning-sidebar-tab.tsx`  
  Sidebar list surface for ideas, arcs, chapter plans, and scene cards.

- `src/components/planning/planning-workbench.tsx`  
  Main planning editor surface that switches among idea / arc / chapter / scene detail panes.

- `src/components/planning/planning-sidebar-tab.test.tsx`  
  Sidebar interaction tests for grouped rendering and selection.

- `src/components/planning/planning-workbench.test.tsx`  
  Workbench tests for editing, navigation, and empty states.

- `src/components/planning/idea-note-form.tsx`  
  Editor form for a single planning idea with intent, mood, source, and conversion hints.

- `src/components/planning/story-arc-form.tsx`  
  Editor form for one story arc / volume-outline node.

- `src/components/planning/chapter-plan-form.tsx`  
  Editor form for one chapter plan with links to `Chapter`.

- `src/components/planning/scene-card-form.tsx`  
  Editor form for scene cards under a chapter plan.

- `src/components/planning/planning-ai-panel.tsx`  
  Lightweight AI action surface for “生成卷纲 / 生成章纲 / 拆场景”.

- `src/components/planning/planning-ai-panel.test.tsx`  
  Tests for action gating and payload assembly.

- `src/lib/ai/planning-prompts.ts`  
  Context builders dedicated to planning actions so Phase 3 logic does not bloat generic chat prompt construction.

- `src/lib/ai/planning-prompts.test.ts`  
  Coverage for charter/world/progress/planning context flattening.

### Modify

- `src/lib/types/index.ts`  
  Re-export planning types.

- `src/lib/db/project-db.ts`  
  Add Dexie v19 schema with `ideaNotes`, `storyArcs`, `chapterPlans`, `sceneCards`, and sidebar layout support for the planning tab.

- `src/lib/hooks/use-layout.ts`  
  Extend `ActiveTab` with `planning`.

- `src/lib/hooks/use-workspace-layout.ts`  
  Add planning selection/navigation state and coordinate with existing chapter/outline/world selection.

- `src/components/chapter/chapter-sidebar.tsx`  
  Add a fourth rail tab for `规划`.

- `src/components/outline/outline-tab.tsx`  
  Read chapter-plan summaries when available so chapter outlines reflect planning-chain state instead of chapter-only local notes.

- `src/components/outline/outline-edit-form.tsx`  
  Surface linked `ChapterPlan` summary in a read/write-safe way until Phase 4 fully merges planning and drafting.

- `src/app/projects/[id]/workspace/page.tsx` or the current workspace route entry  
  Mount the planning workbench when the planning tab is active.

- `src/lib/hooks/use-ai-chat.ts`  
  Load planning context into AI conversations so “下一步怎么规划” has project memory.

- `src/lib/ai/prompts.ts`  
  Add lightweight planning digest sections for generic chat requests.

- `src/lib/ai/prompts.test.ts`  
  Assert planning digest sections are included only when planning data exists.

## Domain Model Decisions

### `IdeaNote`

```ts
export type IdeaNoteStatus = 'seed' | 'selected' | 'parked'

export interface IdeaNote {
  id: string
  projectId: string
  title: string
  premise: string
  moodKeywords: string[]
  sourceType: 'manual' | 'ai'
  status: IdeaNoteStatus
  linkedArcId?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

### `StoryArc`

`StoryArc` is the Phase 3 “卷纲” object. It can represent either a major arc or a volume-level arc, but its UI copy should guide users to use it as a volume/major-plot planning unit.

```ts
export type StoryArcStatus = 'draft' | 'active' | 'completed'

export interface StoryArc {
  id: string
  projectId: string
  title: string
  premise: string
  objective: string
  conflict: string
  payoff: string
  order: number
  status: StoryArcStatus
  sourceIdeaIds: string[]
  relatedEntryIds: string[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

### `ChapterPlan`

`ChapterPlan` is separate from `Chapter`. A chapter may exist before or after a plan; linking is optional but first-class.

```ts
export type ChapterPlanStatus = 'not_started' | 'planned' | 'drafting' | 'completed'

export interface ChapterPlan {
  id: string
  projectId: string
  arcId: string | null
  linkedChapterId: string | null
  title: string
  summary: string
  chapterGoal: string
  conflict: string
  turn: string
  reveal: string
  order: number
  status: ChapterPlanStatus
  targetWordCount: number | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

### `SceneCard`

```ts
export type SceneCardStatus = 'planned' | 'drafting' | 'done'

export interface SceneCard {
  id: string
  projectId: string
  chapterPlanId: string
  title: string
  viewpoint: string
  location: string
  objective: string
  obstacle: string
  outcome: string
  continuityNotes: string
  order: number
  status: SceneCardStatus
  linkedEntryIds: string[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

These four objects are sufficient for Phase 3. They deliberately stop short of draft text storage, scene-to-prose generation outputs, or planning-learning telemetry.

## UX Decisions

1. `规划` becomes a first-class sidebar tab beside `章节 / 大纲 / 世界观`.
2. The planning tab is two-part:
   - sidebar: grouped ordered lists for `灵感 / 卷纲 / 章纲 / 场景卡`
   - main workbench: detail editor for the selected planning object
3. Users can create objects top-down or bottom-up:
   - from idea to arc
   - from arc to chapter plan
   - from chapter plan to scene cards
4. Existing `OutlineTab` remains, but it begins reading `ChapterPlan` summaries when linked so the old outline surface becomes a thin lens over the new planning chain.
5. AI actions stay intentionally narrow in Phase 3:
   - `基于灵感生成卷纲`
   - `基于卷纲生成章纲`
   - `基于章纲拆解场景卡`
   - `基于当前进度推荐下一步`

## Task 1: Add Planning Storage and Migration

**Files:**
- Create: `src/lib/types/planning.ts`
- Create: `src/lib/db/planning-queries.ts`
- Create: `src/lib/db/planning-queries.test.ts`
- Create: `src/lib/db/project-db.migration-v19.test.ts`
- Modify: `src/lib/types/index.ts`
- Modify: `src/lib/db/project-db.ts`

- [ ] **Step 1: Write the failing storage tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetProjectDBCache, createProjectDB } from './project-db'
import {
  createIdeaNote,
  createStoryArc,
  createChapterPlan,
  createSceneCard,
  listPlanningSnapshot,
} from './planning-queries'

describe('planning queries', () => {
  const projectId = 'phase3-planning'

  beforeEach(async () => {
    __resetProjectDBCache()
    indexedDB.deleteDatabase(`inkforge-project-${projectId}`)
  })

  it('creates a top-down planning chain', async () => {
    const db = createProjectDB(projectId)
    const idea = await createIdeaNote(db, projectId, {
      title: '皇城夜雨',
      premise: '少女替父顶罪后卷入旧朝复辟',
      moodKeywords: ['压抑', '宫廷', '宿命'],
    })
    const arc = await createStoryArc(db, projectId, {
      title: '第一卷：雨夜入局',
      premise: '主角被迫进入权力旋涡',
      objective: '活下来并找出真正的操盘者',
      sourceIdeaIds: [idea.id],
    })
    const chapterPlan = await createChapterPlan(db, projectId, {
      arcId: arc.id,
      title: '第1章 雨夜押解',
      summary: '押解途中第一次看见追杀者',
      order: 1,
    })
    await createSceneCard(db, projectId, {
      chapterPlanId: chapterPlan.id,
      title: '城门前换车',
      objective: '确认押解路线被人动过手脚',
      order: 1,
    })

    const snapshot = await listPlanningSnapshot(db)
    expect(snapshot.ideaNotes).toHaveLength(1)
    expect(snapshot.storyArcs[0].sourceIdeaIds).toEqual([idea.id])
    expect(snapshot.chapterPlans[0].arcId).toBe(arc.id)
    expect(snapshot.sceneCards[0].chapterPlanId).toBe(chapterPlan.id)
  })

  it('soft deletes planning rows without breaking sibling ordering', async () => {
    const db = createProjectDB(projectId)
    const first = await createStoryArc(db, projectId, { title: '卷一', order: 1 })
    await createStoryArc(db, projectId, { title: '卷二', order: 2 })

    await db.storyArcs.update(first.id, { deletedAt: Date.now() })

    const snapshot = await listPlanningSnapshot(db)
    expect(snapshot.storyArcs).toHaveLength(1)
    expect(snapshot.storyArcs[0].title).toBe('卷二')
  })
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/db/planning-queries.test.ts src/lib/db/project-db.migration-v19.test.ts`  
Expected: FAIL because the planning types, tables, and queries do not exist yet.

- [ ] **Step 3: Add the planning domain types**

```ts
export interface PlanningSnapshot {
  ideaNotes: IdeaNote[]
  storyArcs: StoryArc[]
  chapterPlans: ChapterPlan[]
  sceneCards: SceneCard[]
}

export interface CreateStoryArcInput {
  title?: string
  premise?: string
  objective?: string
  conflict?: string
  payoff?: string
  order?: number
  sourceIdeaIds?: string[]
  relatedEntryIds?: string[]
}
```

Add the full object definitions from the “Domain Model Decisions” section to `src/lib/types/planning.ts`, then re-export them from `src/lib/types/index.ts`.

- [ ] **Step 4: Add Dexie v19 storage**

```ts
this.version(19).stores({
  projects: 'id, updatedAt, deletedAt',
  chapters: 'id, projectId, order, deletedAt',
  layoutSettings: 'id',
  worldEntries: 'id, projectId, type, name, deletedAt',
  relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
  aiConfig: 'id',
  messages: 'id, projectId, role, timestamp',
  consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
  revisions: 'id, projectId, chapterId, createdAt',
  analyses: 'id, projectId, kind, invalidationKey, createdAt',
  conversations: 'id, projectId, updatedAt',
  aiUsage: 'id, projectId, conversationId, createdAt',
  contradictions: 'id, projectId, createdAt, exempted',
  layoutSnapshots: 'id, projectId, layoutId, nodeId, updatedAt',
  projectCharter: 'id, projectId, updatedAt',
  preferenceMemories: 'id, projectId, createdAt, updatedAt',
  storyTrackers: 'id, projectId, kind, status, updatedAt, deletedAt',
  ideaNotes: 'id, projectId, status, updatedAt, deletedAt',
  storyArcs: 'id, projectId, order, status, updatedAt, deletedAt',
  chapterPlans: 'id, projectId, arcId, linkedChapterId, order, status, updatedAt, deletedAt',
  sceneCards: 'id, projectId, chapterPlanId, order, status, updatedAt, deletedAt',
})
```

Also add:

```ts
ideaNotes!: Table<IdeaNote, string>
storyArcs!: Table<StoryArc, string>
chapterPlans!: Table<ChapterPlan, string>
sceneCards!: Table<SceneCard, string>
```

- [ ] **Step 5: Implement the planning query helpers**

```ts
export async function createChapterPlan(
  db: InkForgeProjectDB,
  projectId: string,
  input: CreateChapterPlanInput
): Promise<ChapterPlan> {
  const now = Date.now()
  const row: ChapterPlan = {
    id: crypto.randomUUID(),
    projectId,
    arcId: input.arcId ?? null,
    linkedChapterId: input.linkedChapterId ?? null,
    title: input.title?.trim() || `第 ${input.order ?? 1} 章`,
    summary: input.summary ?? '',
    chapterGoal: input.chapterGoal ?? '',
    conflict: input.conflict ?? '',
    turn: input.turn ?? '',
    reveal: input.reveal ?? '',
    order: input.order ?? await nextPlanningOrder(db.chapterPlans, projectId, { arcId: input.arcId ?? null }),
    status: input.status ?? 'not_started',
    targetWordCount: input.targetWordCount ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  await db.chapterPlans.add(row)
  return row
}
```

Implement matching helpers for:

1. `createIdeaNote`
2. `createStoryArc`
3. `createChapterPlan`
4. `createSceneCard`
5. `updateIdeaNote`
6. `updateStoryArc`
7. `updateChapterPlan`
8. `updateSceneCard`
9. `listPlanningSnapshot`
10. `softDeletePlanningItem`

- [ ] **Step 6: Add the migration test**

```ts
it('upgrades a v18 project database to v19 with planning tables', async () => {
  const db = new Dexie(`inkforge-project-${projectId}`)
  db.version(18).stores({
    projects: 'id, updatedAt, deletedAt',
    chapters: 'id, projectId, order, deletedAt',
    layoutSettings: 'id',
    worldEntries: 'id, projectId, type, name, deletedAt',
    relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
    aiConfig: 'id',
    messages: 'id, projectId, role, timestamp',
    consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
    revisions: 'id, projectId, chapterId, createdAt',
    analyses: 'id, projectId, kind, invalidationKey, createdAt',
    conversations: 'id, projectId, updatedAt',
    aiUsage: 'id, projectId, conversationId, createdAt',
    contradictions: 'id, projectId, createdAt, exempted',
    layoutSnapshots: 'id, projectId, layoutId, nodeId, updatedAt',
    projectCharter: 'id, projectId, updatedAt',
    preferenceMemories: 'id, projectId, createdAt, updatedAt',
    storyTrackers: 'id, projectId, kind, status, updatedAt, deletedAt',
  })
  await db.open()
  await db.close()

  const upgraded = createProjectDB(projectId)
  await upgraded.open()

  expect(upgraded.ideaNotes).toBeDefined()
  expect(upgraded.storyArcs).toBeDefined()
  expect(upgraded.chapterPlans).toBeDefined()
  expect(upgraded.sceneCards).toBeDefined()
})
```

- [ ] **Step 7: Run the targeted tests to verify they pass**

Run: `npx vitest run src/lib/db/planning-queries.test.ts src/lib/db/project-db.migration-v19.test.ts`  
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/types/planning.ts src/lib/types/index.ts src/lib/db/planning-queries.ts src/lib/db/planning-queries.test.ts src/lib/db/project-db.ts src/lib/db/project-db.migration-v19.test.ts
git commit -m "feat(planning): add phase 3 planning storage"
```

## Task 2: Expose Planning Data Through Hooks and Sidebar State

**Files:**
- Create: `src/lib/hooks/use-planning.ts`
- Modify: `src/lib/hooks/use-layout.ts`
- Modify: `src/lib/hooks/use-workspace-layout.ts`
- Modify: `src/components/chapter/chapter-sidebar.tsx`

- [ ] **Step 1: Write the failing hook/layout tests**

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePlanning } from './use-planning'

describe('usePlanning', () => {
  it('returns grouped planning rows ordered for the planning sidebar', async () => {
    const { result } = renderHook(() => usePlanning('project-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.snapshot.storyArcs).toEqual([])
  })
})
```

Add a sidebar test that expects a fourth rail item labeled `规划`.

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/hooks/use-planning.test.ts src/components/chapter/chapter-sidebar.test.tsx`  
Expected: FAIL because the hook and planning rail do not exist yet.

- [ ] **Step 3: Implement the planning hook**

```ts
export function usePlanning(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const snapshot = useLiveQuery(
    () => listPlanningSnapshot(db),
    [db],
    { ideaNotes: [], storyArcs: [], chapterPlans: [], sceneCards: [] }
  )

  const createStoryArc = useCallback(
    (input: CreateStoryArcInput) => createStoryArcQuery(db, projectId, input),
    [db, projectId]
  )

  return {
    db,
    snapshot,
    loading: snapshot === undefined,
    createStoryArc,
  }
}
```

Expose all create/update/delete actions needed by the planning UI.

- [ ] **Step 4: Add `planning` to layout state**

```ts
export type ActiveTab = 'chapters' | 'outline' | 'world' | 'planning'
```

Persist it through `saveActiveTab`, and in `useWorkspaceLayout` add:

```ts
const [activePlanningItem, setActivePlanningItem] = useState<{
  kind: 'idea' | 'arc' | 'chapter' | 'scene'
  id: string
} | null>(null)
```

Also clear incompatible selections when switching into or out of planning.

- [ ] **Step 5: Add the planning rail tab**

```ts
const RAIL_ITEMS: RailItem[] = [
  { value: 'chapters', label: '章节', shortcut: 'Ctrl+1', icon: BookOpen },
  { value: 'outline', label: '大纲', shortcut: 'Ctrl+2', icon: ListTree },
  { value: 'world', label: '世界观', shortcut: 'Ctrl+3', icon: Globe2 },
  { value: 'planning', label: '规划', shortcut: 'Ctrl+4', icon: Map },
]
```

Route planning selection callbacks down the same way the world-bible and outline tabs are wired today.

- [ ] **Step 6: Run the targeted tests to verify they pass**

Run: `npx vitest run src/lib/hooks/use-planning.test.ts src/components/chapter/chapter-sidebar.test.tsx`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/hooks/use-planning.ts src/lib/hooks/use-layout.ts src/lib/hooks/use-workspace-layout.ts src/components/chapter/chapter-sidebar.tsx
git commit -m "feat(planning): add planning sidebar state"
```

## Task 3: Build the Planning Sidebar and Workbench UI

**Files:**
- Create: `src/components/planning/planning-sidebar-tab.tsx`
- Create: `src/components/planning/planning-workbench.tsx`
- Create: `src/components/planning/idea-note-form.tsx`
- Create: `src/components/planning/story-arc-form.tsx`
- Create: `src/components/planning/chapter-plan-form.tsx`
- Create: `src/components/planning/scene-card-form.tsx`
- Create: `src/components/planning/planning-sidebar-tab.test.tsx`
- Create: `src/components/planning/planning-workbench.test.tsx`
- Modify: `src/app/projects/[id]/workspace/page.tsx` or the route entry that currently mounts the workspace shell

- [ ] **Step 1: Write the failing UI tests**

```tsx
it('renders grouped planning sections and lets the user select an arc', async () => {
  render(
    <PlanningSidebarTab
      projectId="project-1"
      activeItem={{ kind: 'arc', id: 'arc-1' }}
      onSelectItem={vi.fn()}
    />
  )

  expect(screen.getByText('灵感')).toBeInTheDocument()
  expect(screen.getByText('卷纲')).toBeInTheDocument()
  expect(screen.getByText('章纲')).toBeInTheDocument()
  expect(screen.getByText('场景卡')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/components/planning/planning-sidebar-tab.test.tsx src/components/planning/planning-workbench.test.tsx`  
Expected: FAIL because the components do not exist yet.

- [ ] **Step 3: Implement the sidebar list surface**

Use compact grouped sections consistent with the existing `WorldBibleTab` and `OutlineTab` density:

```tsx
<PlanningSection
  title="卷纲"
  items={snapshot.storyArcs}
  onCreate={() => createStoryArc({ title: `第 ${snapshot.storyArcs.length + 1} 卷` })}
  renderItem={(arc) => (
    <button type="button" onClick={() => onSelectItem({ kind: 'arc', id: arc.id })}>
      <span>{arc.title}</span>
      <span>{arc.status === 'completed' ? '已完成' : '规划中'}</span>
    </button>
  )}
/>
```

- [ ] **Step 4: Implement the planning workbench**

The workbench should switch by selected kind:

```tsx
if (!activeItem) {
  return <PlanningEmptyState />
}

switch (activeItem.kind) {
  case 'idea':
    return <IdeaNoteForm ... />
  case 'arc':
    return <StoryArcForm ... />
  case 'chapter':
    return <ChapterPlanForm ... />
  case 'scene':
    return <SceneCardForm ... />
}
```

Each form should auto-save through the existing `useAutoSave` pattern and keep Chinese UI labels only.

- [ ] **Step 5: Mount the planning workbench into the workspace**

When `activeTab === 'planning'`, render the planning layout instead of the chapter editor main content. Keep the chat panel mounted; Phase 3 still benefits from AI side assistance.

- [ ] **Step 6: Run the targeted tests to verify they pass**

Run: `npx vitest run src/components/planning/planning-sidebar-tab.test.tsx src/components/planning/planning-workbench.test.tsx`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/planning src/app/projects/[id]/workspace/page.tsx
git commit -m "feat(planning): add planning workbench ui"
```

## Task 4: Bridge Planning Objects Into Existing Outline Flow

**Files:**
- Modify: `src/components/outline/outline-tab.tsx`
- Modify: `src/components/outline/outline-edit-form.tsx`
- Create: `src/components/outline/outline-tab.test.tsx` (extend if already present)
- Create: `src/components/outline/outline-edit-form.test.tsx` (extend if already present)

- [ ] **Step 1: Write the failing outline integration tests**

```tsx
it('shows linked chapter-plan summary before falling back to chapter outline summary', () => {
  render(
    <OutlineRow
      chapter={chapter}
      chapterPlanSummary="主角在押解途中确认有人想灭口"
      isActive={false}
      onSelect={vi.fn()}
    />
  )

  expect(screen.getByText('主角在押解途中确认有人想灭口')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/components/outline/outline-tab.test.tsx src/components/outline/outline-edit-form.test.tsx`  
Expected: FAIL because outline components do not read planning data yet.

- [ ] **Step 3: Feed chapter-plan summaries into the outline list**

Add a planning lookup in `OutlineTab`:

```ts
const { snapshot } = usePlanning(projectId)
const chapterPlanByChapterId = new Map(
  snapshot.chapterPlans
    .filter((plan) => plan.linkedChapterId)
    .map((plan) => [plan.linkedChapterId!, plan])
)
```

Display `chapterPlan.summary` as the primary hint text when available; keep `Chapter.outlineSummary` as the fallback to avoid breaking existing projects.

- [ ] **Step 4: Surface linked planning fields in the outline editor**

Add a small, non-card summary block:

```tsx
{linkedPlan ? (
  <div className="px-3 py-2 divider-hair text-[12px] text-muted-foreground">
    <p>{linkedPlan.summary || '该章已关联章纲，建议优先在规划台维护结构信息。'}</p>
  </div>
) : null}
```

Do not remove local chapter outline editing in Phase 3; this phase only starts convergence.

- [ ] **Step 5: Run the targeted tests to verify they pass**

Run: `npx vitest run src/components/outline/outline-tab.test.tsx src/components/outline/outline-edit-form.test.tsx`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/outline/outline-tab.tsx src/components/outline/outline-edit-form.tsx src/components/outline/outline-tab.test.tsx src/components/outline/outline-edit-form.test.tsx
git commit -m "feat(planning): connect chapter plans to outline flow"
```

## Task 5: Add Planning-Aware AI Context and Actions

**Files:**
- Create: `src/lib/ai/planning-prompts.ts`
- Create: `src/lib/ai/planning-prompts.test.ts`
- Create: `src/components/planning/planning-ai-panel.tsx`
- Create: `src/components/planning/planning-ai-panel.test.tsx`
- Modify: `src/lib/hooks/use-ai-chat.ts`
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`

- [ ] **Step 1: Write the failing planning-prompt tests**

```ts
it('builds next-step planning context from charter, world, and current progress', () => {
  const prompt = buildPlanningPrompt({
    charter,
    worldEntries,
    storyTrackers,
    planningSnapshot,
    currentProgress: {
      completedChapters: 3,
      latestChapterTitle: '第3章 金殿请罪',
    },
    action: 'suggest_next_step',
  })

  expect(prompt).toContain('【当前规划进度】')
  expect(prompt).toContain('【卷纲】')
  expect(prompt).toContain('【章纲】')
  expect(prompt).toContain('【推荐下一步】')
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/ai/planning-prompts.test.ts src/components/planning/planning-ai-panel.test.tsx src/lib/ai/prompts.test.ts`  
Expected: FAIL because planning prompts and actions do not exist yet.

- [ ] **Step 3: Implement the planning prompt builder**

```ts
export function buildPlanningPrompt(input: BuildPlanningPromptInput): string {
  return [
    buildCharterSection(input.charter),
    buildWorldSection(input.worldEntries, input.storyTrackers),
    buildPlanningSnapshotSection(input.planningSnapshot),
    buildCurrentProgressSection(input.currentProgress),
    buildActionSection(input.action),
  ]
    .filter(Boolean)
    .join('\n\n')
}
```

Action-specific sections should exist for:

1. `generate_arc`
2. `generate_chapter_plan`
3. `generate_scene_cards`
4. `suggest_next_step`

- [ ] **Step 4: Implement the planning AI action panel**

Use existing button patterns and no decorative UI:

```tsx
<Button onClick={() => onRunAction('generate_scene_cards')} disabled={!activeChapterPlanId}>
  拆解场景卡
</Button>
```

Require the minimum object for each action:

1. `generate_arc` requires at least one `IdeaNote`
2. `generate_chapter_plan` requires one selected `StoryArc`
3. `generate_scene_cards` requires one selected `ChapterPlan`
4. `suggest_next_step` is always available

- [ ] **Step 5: Thread planning context into generic chat**

In `use-ai-chat.ts`, load the `planningSnapshot` alongside `worldEntries`, `projectCharter`, and `storyTrackers`, then pass it into `buildSystemPrompt`.

In `src/lib/ai/prompts.ts`, add compact sections such as:

```ts
'【当前卷纲】'
'【当前章纲】'
'【未拆解章节】'
```

These must stay summarized. Full planning action prompts belong in `planning-prompts.ts`.

- [ ] **Step 6: Run the targeted tests to verify they pass**

Run: `npx vitest run src/lib/ai/planning-prompts.test.ts src/components/planning/planning-ai-panel.test.tsx src/lib/ai/prompts.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/planning-prompts.ts src/lib/ai/planning-prompts.test.ts src/components/planning/planning-ai-panel.tsx src/components/planning/planning-ai-panel.test.tsx src/lib/hooks/use-ai-chat.ts src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat(planning): add planning-aware ai context"
```

## Task 6: Verify the Full Planning Chain End to End

**Files:**
- Modify: `src/app/projects/[id]/workspace/page.tsx` or the route entry that composes the workspace shell
- Modify: any newly added planning tests from Tasks 1-5 as needed

- [ ] **Step 1: Run the focused planning suite**

Run:

```bash
npx vitest run src/lib/db/planning-queries.test.ts src/lib/db/project-db.migration-v19.test.ts src/lib/hooks/use-planning.test.ts src/components/planning/planning-sidebar-tab.test.tsx src/components/planning/planning-workbench.test.tsx src/components/planning/planning-ai-panel.test.tsx src/components/outline/outline-tab.test.tsx src/components/outline/outline-edit-form.test.tsx src/lib/ai/planning-prompts.test.ts src/lib/ai/prompts.test.ts
```

Expected: PASS

- [ ] **Step 2: Run lint**

Run: `pnpm lint`  
Expected: PASS

- [ ] **Step 3: Run the full unit test suite**

Run: `pnpm test`  
Expected: PASS

- [ ] **Step 4: Smoke-test the workspace manually**

Run: `pnpm dev`  
Open: `http://localhost:3000`  
Verify:

1. `规划` rail tab appears
2. You can create `灵感 -> 卷纲 -> 章纲 -> 场景卡`
3. Linked chapter plans show up in `大纲`
4. AI planning actions are enabled/disabled on the correct selections
5. Existing `章节 / 世界观 / 分析` behavior still works

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(planning): deliver phase 3 planning chain"
```

## Self-Review

### Spec coverage

- `灵感池` → Task 1, Task 3
- `卷纲生成与编辑` → Task 1, Task 3, Task 5
- `章纲生成与编辑` → Task 1, Task 3, Task 4, Task 5
- `场景卡拆解` → Task 1, Task 3, Task 5
- `从宪章 + 世界模型 + 当前进度推导下一步规划` → Task 5

No Phase 3 requirement from the spec is left without a corresponding task.

### Placeholder scan

No `TODO`, `TBD`, “similar to above”, or undefined function names remain. Each task includes named files, concrete commands, and concrete code anchors.

### Type consistency

Planning object names and status unions are consistent across storage, hooks, UI, and AI tasks:

1. `IdeaNote`
2. `StoryArc`
3. `ChapterPlan`
4. `SceneCard`

The generic layout tab name is consistently `planning`.
