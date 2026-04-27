# Longform Co-Creation Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild InkForge's writing surface so `ChapterPlan` and `SceneCard` become the primary path to scene drafting, chapter assembly, and focused AI-assisted revision.

**Architecture:** Phase 4 builds a dedicated writing model on top of the Phase 3 planning chain instead of overloading `Chapter` or the generic AI chat stream. We add durable `SceneDraft` / `ChapterDraft` / `RevisionPass` objects, a writing workbench in the workspace center pane, and prompt builders that always ground generation in the current scene card, linked plan, charter, story bible, and current chapter progress.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie/IndexedDB, Vitest, React Testing Library, existing InkForge AI prompt pipeline, local-first workspace architecture.

---

## Current Codebase Reality Check

The current `AUTO-WRITE` worktree has **not** landed the full Phase 3 planning model yet:

1. `src/lib/types` currently exports `project`, `project-charter`, `chapter`, `world-entry`, and `relation` types only.
2. `src/lib/db/project-db.ts` is still at schema v17 and does **not** define `storyArcs`, `chapterPlans`, `sceneCards`, `sceneDrafts`, `chapterDrafts`, or `revisionPasses`.
3. The main project route is `src/app/projects/[id]/page.tsx`; there is no `src/app/projects/[id]/workspace/page.tsx`.
4. The left rail currently exposes `chapters`, `outline`, and `world` tabs through `src/components/chapter/chapter-sidebar.tsx` and `src/lib/hooks/use-layout.ts`.
5. There is no `src/components/planning` directory in this repo snapshot; the closest existing phase-3-adjacent surface is `src/components/outline/outline-tab.tsx`.

## Scope Check

This plan still targets only `9.4 Phase 4：写作台重构` from `D:\AUTO-WRITE\docs\superpowers\specs\2026-04-26-longform-cocreate-design.md`, but it now makes the Phase 3 dependency explicit.

**Gate before implementation:** do **not** start Phase 4 coding until one of the following is true:

1. a separate Phase 3 branch already provides durable `StoryArc` / `ChapterPlan` / `SceneCard` storage and UI, and this worktree is rebased onto it; or
2. Task 0 in this plan lands the minimum planning primitives Phase 4 depends on.

Once that gate is satisfied, the Phase 4 scope remains:

1. `以场景为单位生成`
2. `场景草稿合成章节`
3. `基于场景目标的改写、扩写、补张力、补伏笔`
4. `左侧章纲 / 场景卡，右侧 AI 陪跑 / 引用 / 提醒，中间正文`
5. `聊天面板降级为写作辅助入口`

This phase explicitly does **not** include:

1. Phase 5 longform cockpit alerts
2. Phase 6 onboarding / incubation flow
3. free-form whole-book generation outside scene constraints

## File Structure Map

### Create

- `src/lib/types/planning.ts`  
  Minimum Phase 3 planning types if they are still absent in the target branch: `StoryArc`, `ChapterPlan`, `SceneCard`, `IdeaNote`, status enums, and creation payloads.

- `src/lib/db/planning-queries.ts`  
  Minimum persistence/query helpers Phase 4 needs to read ordered `ChapterPlan` and `SceneCard` data.

- `src/lib/db/planning-queries.test.ts`  
  Focused tests proving ordered `ChapterPlan` / `SceneCard` reads work before writing features are layered on top.

- `src/lib/types/writing.ts`  
  Writing domain types: `SceneDraft`, `ChapterDraft`, `RevisionPass`, writing action enums, and payload helpers.

- `src/lib/db/writing-queries.ts`  
  Dexie CRUD/query helpers for scene drafts, chapter drafts, chapter assembly, and revision tracking.

- `src/lib/db/writing-queries.test.ts`  
  Query tests for scene draft creation, chapter assembly ordering, revision persistence, and soft-delete behavior.

- `src/lib/db/project-db.migration-v20.test.ts`  
  Migration test proving the latest pre-writing project DB upgrades cleanly and exposes writing tables.

- `src/lib/hooks/use-writing-workbench.ts`  
  LiveQuery-backed hook for the writing surface, selected scene state, draft mutations, and assembly actions.

- `src/lib/ai/writing-prompts.ts`  
  Scene- and chapter-specific prompt builders for draft generation and revision actions.

- `src/lib/ai/writing-prompts.test.ts`  
  Prompt coverage for scene grounding, revision action sections, and chapter assembly context.

- `src/components/writing/writing-sidebar-tab.tsx`  
  Left rail surface for chapter plans, scene cards, scene progress, and chapter assembly actions.

- `src/components/writing/scene-draft-editor.tsx`  
  Main draft editor for the currently selected `SceneCard`.

- `src/components/writing/chapter-draft-panel.tsx`  
  Aggregated chapter surface that assembles scene drafts into a coherent chapter draft.

- `src/components/writing/writing-ai-panel.tsx`  
  Right-side AI action panel for generate / continue / rewrite / add tension / add foreshadow / compress.

- `src/components/writing/writing-empty-state.tsx`  
  Empty state when no scene card is selected or no chapter plan has scenes yet.

- `src/components/writing/writing-sidebar-tab.test.tsx`  
  Sidebar test coverage for grouping, selection, and chapter assembly actions.

- `src/components/writing/scene-draft-editor.test.tsx`  
  Editor tests for autosave, scene status transitions, and action-triggered content replacement.

- `src/components/writing/chapter-draft-panel.test.tsx`  
  Tests for ordered chapter assembly and linked scene draft summaries.

- `src/components/writing/writing-ai-panel.test.tsx`  
  Tests for action gating and payload assembly.

### Modify

- `src/lib/types/index.ts`  
  Re-export the planning and writing types.

- `src/lib/db/project-db.ts`  
  Add Dexie schema upgrades for missing planning tables first, then writing tables.

- `src/lib/hooks/use-layout.ts`  
  Add `writing` as a first-class workspace tab alongside `chapters`, `outline`, and `world`.

- `src/lib/hooks/use-workspace-layout.ts`  
  Add writing selection state and sync it with chapter and outline selections.

- `src/components/chapter/chapter-sidebar.tsx`  
  Surface `写作` in the workspace rail and route its body to the new writing sidebar.

- `src/components/outline/outline-tab.tsx`  
  Add “进入写作” affordances from the planning list once `ChapterPlan` / `SceneCard` data is available.

- `src/components/workspace/ai-chat-panel/index.tsx`  
  Demote generic chat into scene-support mode when the writing tab is active.

- `src/lib/hooks/use-ai-chat.ts`  
  Load active writing context into generic chat requests and route structured writing actions.

- `src/lib/ai/prompts.ts`  
  Add compact writing digest sections for generic chat.

- `src/lib/ai/prompts.test.ts`  
  Assert writing digest sections appear only when writing context exists.

- `src/components/workspace/layouts/normal-layout.tsx`  
  Provide the 3-column shell for the writing workbench inside the existing project page.

- `src/app/projects/[id]/page.tsx`  
  Mount the new writing workbench inside the current project route.

## Domain Model Decisions

### `SceneDraft`

```ts
export type SceneDraftStatus = 'idle' | 'drafting' | 'revising' | 'done'

export interface SceneDraft {
  id: string
  projectId: string
  chapterPlanId: string
  sceneCardId: string
  title: string
  content: string
  summary: string
  status: SceneDraftStatus
  source: 'manual' | 'ai' | 'mixed'
  wordCount: number
  lastAction: WritingActionType | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

### `ChapterDraft`

```ts
export type ChapterDraftStatus = 'assembling' | 'drafting' | 'revising' | 'ready'

export interface ChapterDraft {
  id: string
  projectId: string
  chapterPlanId: string
  linkedChapterId: string | null
  title: string
  content: string
  summary: string
  status: ChapterDraftStatus
  assembledSceneDraftIds: string[]
  wordCount: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

### `RevisionPass`

```ts
export type WritingActionType =
  | 'generate_scene'
  | 'continue_scene'
  | 'rewrite_scene'
  | 'expand_scene'
  | 'add_tension'
  | 'add_foreshadow'
  | 'compress_scene'
  | 'assemble_chapter'

export interface RevisionPass {
  id: string
  projectId: string
  targetType: 'scene' | 'chapter'
  targetId: string
  actionType: WritingActionType
  instruction: string
  beforeContent: string
  afterContent: string
  createdAt: number
}
```

These objects are intentionally narrow. Phase 4 is about durable drafting and revision history, not longform diagnostics.

## UX Decisions

1. `SceneCard` is the smallest draftable unit. No direct “write a full chapter” shortcut.
2. The left pane shows structure and progress, not prose.
3. The center pane is always prose-first: selected scene draft or assembled chapter.
4. The right pane is action-first: scene-aware AI actions plus a compact context summary.
5. Generic chat stays available, but in writing mode it inherits the active scene and chapter context by default.

## Task 0: Land the Planning Prerequisite or Rebase Onto It

**Files:**
- Create: `src/lib/types/planning.ts`
- Create: `src/lib/db/planning-queries.ts`
- Create: `src/lib/db/planning-queries.test.ts`
- Modify: `src/lib/types/index.ts`
- Modify: `src/lib/db/project-db.ts`

- [ ] **Step 1: Verify whether the Phase 3 branch is already merged**

Run: `git status --short`  
Expected: understand whether this worktree already contains unrelated in-flight Phase 3 changes that must be preserved.

- [ ] **Step 2: Inspect the current planning surface before writing new schema**

Run: `npx vitest run src/lib/db/project-db.test.ts src/components/chapter/chapter-sidebar.test.tsx --runInBand`  
Expected: either existing planning primitives are already present in the branch, or the repo still only exposes chapter-outline storage.

- [ ] **Step 3: Add the minimum planning types if they are still missing**

Add:

```ts
export type StoryArcStatus = 'draft' | 'active' | 'done'
export type ChapterPlanStatus = 'draft' | 'ready' | 'writing' | 'done'
export type SceneCardStatus = 'todo' | 'drafting' | 'done'

export interface ChapterPlan {
  id: string
  projectId: string
  arcId: string | null
  linkedChapterId: string | null
  title: string
  summary: string
  order: number
  status: ChapterPlanStatus
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface SceneCard {
  id: string
  projectId: string
  chapterPlanId: string
  title: string
  objective: string
  obstacle: string
  outcome: string
  order: number
  status: SceneCardStatus
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

- [ ] **Step 4: Add the prerequisite Dexie tables**

Add schema entries for:

```ts
chapterPlans: 'id, projectId, arcId, linkedChapterId, order, status, updatedAt, deletedAt'
sceneCards: 'id, projectId, chapterPlanId, order, status, updatedAt, deletedAt'
```

- [ ] **Step 5: Add planning query coverage**

Implement ordered read helpers for:

1. `listChapterPlans(projectId)`
2. `listSceneCards(chapterPlanId)`
3. `getChapterPlan(chapterPlanId)`
4. `getSceneCard(sceneCardId)`

- [ ] **Step 6: Run the prerequisite tests**

Run: `npx vitest run src/lib/db/planning-queries.test.ts src/lib/db/project-db.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/types/planning.ts src/lib/types/index.ts src/lib/db/project-db.ts src/lib/db/planning-queries.ts src/lib/db/planning-queries.test.ts
git commit -m "feat(planning): add phase4 prerequisites"
```

## Task 1: Add Writing Storage and Migration

**Files:**
- Create: `src/lib/types/writing.ts`
- Create: `src/lib/db/writing-queries.ts`
- Create: `src/lib/db/writing-queries.test.ts`
- Create: `src/lib/db/project-db.migration-v20.test.ts`
- Modify: `src/lib/types/index.ts`
- Modify: `src/lib/db/project-db.ts`

- [ ] **Step 1: Write the failing storage tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetProjectDBCache, createProjectDB } from './project-db'
import {
  createSceneDraft,
  createOrUpdateChapterDraft,
  listWritingSnapshot,
} from './writing-queries'

describe('writing queries', () => {
  const projectId = 'phase4-writing'

  beforeEach(async () => {
    __resetProjectDBCache()
    indexedDB.deleteDatabase(`inkforge-project-${projectId}`)
  })

  it('creates scene drafts and assembles a chapter draft in scene order', async () => {
    const db = createProjectDB(projectId)

    await createSceneDraft(db, projectId, {
      chapterPlanId: 'cp-1',
      sceneCardId: 'sc-1',
      title: '雨夜入城',
      content: '第一场内容',
    })
    await createSceneDraft(db, projectId, {
      chapterPlanId: 'cp-1',
      sceneCardId: 'sc-2',
      title: '宫门盘查',
      content: '第二场内容',
    })

    const chapterDraft = await createOrUpdateChapterDraft(db, projectId, {
      chapterPlanId: 'cp-1',
      title: '第1章 雨夜押解',
      orderedSceneDraftIds: ['sc-1', 'sc-2'],
    })

    expect(chapterDraft.content).toContain('第一场内容')
    expect(chapterDraft.content).toContain('第二场内容')

    const snapshot = await listWritingSnapshot(db, 'cp-1')
    expect(snapshot.sceneDrafts).toHaveLength(2)
    expect(snapshot.chapterDraft?.chapterPlanId).toBe('cp-1')
  })
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/db/writing-queries.test.ts src/lib/db/project-db.migration-v20.test.ts`  
Expected: FAIL because the writing types, tables, and query helpers do not exist yet.

- [ ] **Step 3: Add the writing domain types**

Add the full type definitions from the “Domain Model Decisions” section to `src/lib/types/writing.ts`, then re-export them from `src/lib/types/index.ts`.

- [ ] **Step 4: Add Dexie v20 storage**

```ts
this.version(20).stores({
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
  sceneDrafts: 'id, projectId, chapterPlanId, sceneCardId, status, updatedAt, deletedAt',
  chapterDrafts: 'id, projectId, chapterPlanId, linkedChapterId, status, updatedAt, deletedAt',
  revisionPasses: 'id, projectId, targetType, targetId, actionType, createdAt',
})
```

Also add:

```ts
sceneDrafts!: Table<SceneDraft, string>
chapterDrafts!: Table<ChapterDraft, string>
revisionPasses!: Table<RevisionPass, string>
```

- [ ] **Step 5: Implement the writing query helpers**

Implement:

1. `createSceneDraft`
2. `updateSceneDraft`
3. `getSceneDraftBySceneCardId`
4. `createOrUpdateChapterDraft`
5. `recordRevisionPass`
6. `listWritingSnapshot`
7. `softDeleteSceneDraft`

Use the existing project DB cache and `crypto.randomUUID()` or the repo's existing ID helper.

- [ ] **Step 6: Add the migration test**

Create `src/lib/db/project-db.migration-v20.test.ts` that upgrades the latest pre-writing schema in this repo and asserts `sceneDrafts`, `chapterDrafts`, and `revisionPasses` exist.

- [ ] **Step 7: Run the targeted tests to verify they pass**

Run: `npx vitest run src/lib/db/writing-queries.test.ts src/lib/db/project-db.migration-v20.test.ts`  
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/types/writing.ts src/lib/types/index.ts src/lib/db/project-db.ts src/lib/db/writing-queries.ts src/lib/db/writing-queries.test.ts src/lib/db/project-db.migration-v20.test.ts
git commit -m "feat(writing): add phase4 writing storage"
```

## Task 2: Build Writing Prompts and AI Actions

**Files:**
- Create: `src/lib/ai/writing-prompts.ts`
- Create: `src/lib/ai/writing-prompts.test.ts`
- Modify: `src/lib/hooks/use-ai-chat.ts`
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`

- [ ] **Step 1: Write the failing prompt tests**

```ts
import { describe, expect, it } from 'vitest'
import { buildSceneWritingPrompt } from './writing-prompts'

describe('writing prompts', () => {
  it('grounds scene generation in the active scene card and chapter plan', () => {
    const prompt = buildSceneWritingPrompt({
      action: 'generate_scene',
      chapterPlan: {
        id: 'cp-1',
        title: '第1章 雨夜押解',
        summary: '押解途中第一次看见追杀者',
      } as never,
      sceneCard: {
        id: 'sc-1',
        title: '城门前换车',
        objective: '确认路线被人动过手脚',
        obstacle: '雨夜与盘查打乱节奏',
        outcome: '主角意识到押解队伍不安全',
      } as never,
    })

    expect(prompt).toContain('【当前章纲】')
    expect(prompt).toContain('【当前场景卡】')
    expect(prompt).toContain('确认路线被人动过手脚')
  })
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/ai/writing-prompts.test.ts src/lib/ai/prompts.test.ts`  
Expected: FAIL because the writing prompt builder does not exist yet.

- [ ] **Step 3: Implement the writing prompt builder**

Add action-specific builders for:

1. `generate_scene`
2. `continue_scene`
3. `rewrite_scene`
4. `expand_scene`
5. `add_tension`
6. `add_foreshadow`
7. `compress_scene`
8. `assemble_chapter`

Each builder must include:

- `【作品宪章】`
- `【故事圣经摘要】`
- `【当前章纲】`
- `【当前场景卡】`
- `【已有场景草稿】` when applicable
- `【本次写作动作】`

- [ ] **Step 4: Thread writing context into generic chat**

In `use-ai-chat.ts`, when a writing tab selection exists, load:

1. the active `ChapterPlan`
2. the active `SceneCard`
3. the active `SceneDraft`
4. the current `ChapterDraft`

Pass a compact digest into `src/lib/ai/prompts.ts` using sections such as:

```ts
'【当前写作单元】'
'【当前场景目标】'
'【当前章节进度】'
```

- [ ] **Step 5: Re-run the prompt tests**

Run: `npx vitest run src/lib/ai/writing-prompts.test.ts src/lib/ai/prompts.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/writing-prompts.ts src/lib/ai/writing-prompts.test.ts src/lib/hooks/use-ai-chat.ts src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat(writing): add scene-aware writing prompts"
```

## Task 3: Expose Writing State Through Hooks and Layout

**Files:**
- Create: `src/lib/hooks/use-writing-workbench.ts`
- Modify: `src/lib/hooks/use-layout.ts`
- Modify: `src/lib/hooks/use-workspace-layout.ts`
- Modify: `src/components/chapter/chapter-sidebar.tsx`

- [ ] **Step 1: Write the failing hook/layout tests**

Create a new `src/lib/hooks/use-writing-workbench.test.ts` with a simple loading assertion, and extend `src/components/chapter/chapter-sidebar.test.tsx` to expect a `写作` rail item.

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/hooks/use-writing-workbench.test.ts src/components/chapter/chapter-sidebar.test.tsx`  
Expected: FAIL because the writing hook and rail item do not exist yet.

- [ ] **Step 3: Implement `useWritingWorkbench`**

Expose:

1. active chapter plan lookup
2. active scene card lookup
3. scene draft read/write
4. chapter assembly action
5. revision action dispatcher

The hook should use the existing planning data rather than duplicating planning state.

- [ ] **Step 4: Add writing selection state**

If the workspace tab model does not already have a clean writing state, add:

```ts
export type ActiveTab = 'chapters' | 'outline' | 'world' | 'planning' | 'writing'
```

and:

```ts
const [activeWritingTarget, setActiveWritingTarget] = useState<{
  chapterPlanId: string
  sceneCardId: string | null
} | null>(null)
```

- [ ] **Step 5: Add the writing rail tab**

Use the same density and icon treatment as the existing rail items. The label must be `写作`.

- [ ] **Step 6: Re-run the targeted tests**

Run: `npx vitest run src/lib/hooks/use-writing-workbench.test.ts src/components/chapter/chapter-sidebar.test.tsx`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/hooks/use-writing-workbench.ts src/lib/hooks/use-layout.ts src/lib/hooks/use-workspace-layout.ts src/components/chapter/chapter-sidebar.tsx
git commit -m "feat(writing): add writing workbench state"
```

## Task 4: Build the Writing Surface

**Files:**
- Create: `src/components/writing/writing-sidebar-tab.tsx`
- Create: `src/components/writing/scene-draft-editor.tsx`
- Create: `src/components/writing/chapter-draft-panel.tsx`
- Create: `src/components/writing/writing-ai-panel.tsx`
- Create: `src/components/writing/writing-empty-state.tsx`
- Create: `src/components/writing/writing-sidebar-tab.test.tsx`
- Create: `src/components/writing/scene-draft-editor.test.tsx`
- Create: `src/components/writing/chapter-draft-panel.test.tsx`
- Create: `src/components/writing/writing-ai-panel.test.tsx`
- Modify: `src/components/workspace/layouts/normal-layout.tsx`
- Modify: `src/app/projects/[id]/page.tsx`

- [ ] **Step 1: Write the failing UI tests**

At minimum:

1. sidebar renders selected chapter and scene progress
2. scene draft editor autosaves content changes
3. chapter draft panel assembles scene drafts in order
4. AI action panel disables scene-only actions when no scene is selected

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/components/writing/writing-sidebar-tab.test.tsx src/components/writing/scene-draft-editor.test.tsx src/components/writing/chapter-draft-panel.test.tsx src/components/writing/writing-ai-panel.test.tsx`  
Expected: FAIL because the writing components do not exist yet.

- [ ] **Step 3: Implement the writing sidebar**

The sidebar should show:

1. the selected chapter plan
2. ordered scene cards
3. per-scene status badges (`未起草 / 起草中 / 已完成`)
4. an `合成章节草稿` button at chapter scope

- [ ] **Step 4: Implement the scene draft editor**

The editor should:

1. show the active scene title and objective
2. autosave prose content
3. allow manual editing independent of AI actions
4. update `SceneDraft.status` as the user moves from blank to drafting to done

- [ ] **Step 5: Implement the chapter draft panel**

Show:

1. chapter draft title
2. assembled prose
3. contributing scene draft count
4. lightweight summary of missing scenes, if any

- [ ] **Step 6: Implement the writing AI panel**

Support buttons for:

1. `生成场景`
2. `续写场景`
3. `重写场景`
4. `补张力`
5. `补伏笔`
6. `压缩场景`

Each action should call into the writing prompt builder, not the generic chat surface.

- [ ] **Step 7: Mount the writing workbench**

When `activeTab === 'writing'`, render:

1. left: `WritingSidebarTab`
2. center: `SceneDraftEditor` with `ChapterDraftPanel` below or toggleable
3. right: `WritingAIPanel`

- [ ] **Step 8: Re-run the targeted tests**

Run: `npx vitest run src/components/writing/writing-sidebar-tab.test.tsx src/components/writing/scene-draft-editor.test.tsx src/components/writing/chapter-draft-panel.test.tsx src/components/writing/writing-ai-panel.test.tsx`  
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/writing src/components/workspace/layouts/normal-layout.tsx src/app/projects/[id]/page.tsx
git commit -m "feat(writing): add phase4 writing surface"
```

## Task 5: Demote Generic Chat Into Writing Support Mode

**Files:**
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`
- Modify: `src/components/outline/outline-tab.tsx`
- Modify: writing tests as needed

- [ ] **Step 1: Write the failing support-mode tests**

Add tests that assert:

1. planning sidebar can open a selected scene in `写作`
2. generic chat panel shows active scene context when the writing tab is open

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/components/outline/outline-tab.test.tsx src/components/workspace/ai-chat-panel/index.test.tsx`  
Expected: FAIL because the writing handoff and support mode do not exist yet.

- [ ] **Step 3: Add “进入写作” actions from planning**

Allow `ChapterPlan` and `SceneCard` rows to open the writing tab directly via shared workspace layout state.

- [ ] **Step 4: Add writing support mode to chat**

When the writing tab is active, the panel should show:

1. current chapter plan title
2. current scene card title
3. a brief note that generic chat now assists the active writing unit

Do not remove free-form chat; only bias it toward the active unit.

- [ ] **Step 5: Re-run the targeted tests**

Run: `npx vitest run src/components/planning/planning-sidebar-tab.test.tsx src/components/workspace/ai-chat-panel/index.test.tsx`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/workspace/ai-chat-panel/index.tsx src/components/outline/outline-tab.tsx
git commit -m "feat(writing): make chat a writing support surface"
```

## Task 6: Verify the Phase 4 Writing Workflow

**Files:**
- Modify: any newly added writing tests from Tasks 1-5 as needed

- [ ] **Step 1: Run the focused Phase 4 suite**

Run:

```bash
npx vitest run src/lib/db/writing-queries.test.ts src/lib/db/project-db.migration-v20.test.ts src/lib/hooks/use-writing-workbench.test.ts src/lib/ai/writing-prompts.test.ts src/lib/ai/prompts.test.ts src/components/writing/writing-sidebar-tab.test.tsx src/components/writing/scene-draft-editor.test.tsx src/components/writing/chapter-draft-panel.test.tsx src/components/writing/writing-ai-panel.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run lint**

Run: `pnpm lint`  
Expected: PASS

- [ ] **Step 3: Run the full unit test suite**

Run: `pnpm test`  
Expected: PASS

- [ ] **Step 4: Smoke-test the writing path manually**

Run: `pnpm dev`  
Open: `http://localhost:3000`

Verify:

1. `规划` 中可从 `SceneCard` 进入 `写作`
2. 可以生成或手写一个场景草稿
3. 可以合成章节草稿
4. 右侧 AI 动作与当前 scene/card 对齐
5. 现有规划、世界观、分析页未回归

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(writing): deliver phase4 writing workbench"
```

## Self-Review

### Spec coverage

- `以场景为单位生成` → Tasks 1-4
- `场景草稿合成章节` → Tasks 1 and 4
- `改写、扩写、补张力、补伏笔` → Task 2 and Task 4
- `左侧结构 / 中间正文 / 右侧辅助` → Task 4
- `聊天面板降级为写作辅助入口` → Task 5

### Placeholder scan

No `TODO`, `TBD`, or “similar to above” shortcuts remain. Each task names concrete files, commands, and validation steps.

### Type consistency

Phase 4 uses the same object names across storage, hooks, UI, and AI:

1. `SceneDraft`
2. `ChapterDraft`
3. `RevisionPass`
4. `WritingActionType`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-27-longform-cocreate-phase4.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, faster iteration
2. **Inline Execution** - execute tasks in this session using `executing-plans`, batching work with checkpoints
