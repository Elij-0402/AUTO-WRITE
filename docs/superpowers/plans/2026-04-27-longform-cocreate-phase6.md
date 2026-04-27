# Longform Co-Creation Phase 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a resumable newcomer incubation flow that takes a new writer from a vague premise to a real project with a saved charter, starter world entries, a seeded first chapter, and the first writable scene opened in the main workspace.

**Architecture:** Phase 6 should build on the current local-first project model instead of inventing a second project type. In the current codebase, the durable structured objects already visible from the targeted files are `ProjectCharter`, `WorldEntry`, `Chapter`, and layout state; there is no dedicated `StoryArc` or `SceneCard` table yet, so this phase should seed the first planning chain through existing charter, world, chapter outline, and editor content primitives. The incubation flow itself should be tracked in a small `incubationSessions` table in each project database and surfaced through a single hook plus a modal dialog.

**Tech Stack:** Next.js App Router, React, TypeScript, Dexie/IndexedDB, Vitest, React Testing Library, local-first storage, existing project dashboard + modal flow.

---

## Scope Check

This plan covers only `9.6 Phase 6：从零到一新手流程` from `D:\AUTO-WRITE\docs\superpowers\specs\2026-04-26-longform-cocreate-design.md`.

What ships in this phase:

1. A recommended `孵化新故事` project-creation path
2. A resumable incubation dialog seeded from idea, mood, conflict, and protagonist
3. Structured writeback into existing `ProjectCharter`, `WorldEntry`, and `Chapter` records
4. Direct handoff into the main writing workspace with the first chapter selected

What does **not** ship in this phase:

1. A second persistent project type
2. Non-persistent free-form onboarding chat
3. New dedicated planning tables such as `StoryArc` / `SceneCard` if they do not already exist in the repository
4. Broad dashboard redesign outside the incubation CTA and launch flow

## Reality Check From Current Codebase

The original Phase 6 draft was not fully aligned with the current repository. The plan below is adjusted to the files and data structures that actually exist in the targeted code paths today:

1. Dashboard empty state component path is `src/components/project/empty-dashboard.tsx`, not `src/components/dashboard/empty-dashboard.tsx`
2. Main project workspace route is `src/app/projects/[id]/page.tsx`, not `src/app/projects/[id]/workspace/page.tsx`
3. Existing structured project objects visible from the targeted files are:
   - `ProjectCharter` in `src/lib/types/project-charter.ts`
   - `WorldEntry` in `src/lib/types/world-entry.ts`
   - `Chapter` in `src/lib/types/chapter.ts`
4. Newcomer finalization should therefore seed:
   - charter fields
   - starter world entries
   - a first chapter with `outlineSummary`
   - starter editor content in the chapter document

## File Structure Map

### Create

- `src/lib/types/incubation.ts`  
  Incubation step union, saved session shape, and generation payloads.

- `src/lib/db/incubation-queries.ts`  
  Dexie helpers for create/read/update/complete of incubation sessions.

- `src/lib/db/incubation-queries.test.ts`

- `src/lib/db/project-db.migration-v18.test.ts`  
  Migration proof that a v17 project DB upgrades and exposes `incubationSessions`.

- `src/lib/ai/incubation-prompts.ts`  
  Pure prompt builders for charter, world, and first-chapter seeding.

- `src/lib/ai/incubation-prompts.test.ts`

- `src/lib/hooks/use-incubation.ts`  
  Single hook for step state, autosave, generation, writeback, and completion.

- `src/lib/hooks/use-incubation.test.ts`

- `src/components/project/incubation-dialog.tsx`
- `src/components/project/incubation-step-premise.tsx`
- `src/components/project/incubation-step-charter.tsx`
- `src/components/project/incubation-step-world.tsx`
- `src/components/project/incubation-step-launch.tsx`
- `src/components/project/incubation-dialog.test.tsx`

### Modify

- `src/lib/types/index.ts`
- `src/lib/db/project-db.ts`
- `src/lib/hooks/use-projects.ts`
- `src/components/project/create-project-modal.tsx`
- `src/components/project/create-project-modal.test.tsx`
- `src/components/project/empty-dashboard.tsx`
- `src/components/project/project-dashboard.tsx`
- `src/lib/hooks/use-workspace-layout.ts`
- `src/app/projects/[id]/page.tsx`

## Domain Model

Create `src/lib/types/incubation.ts` with this exact starting model:

```ts
export type IncubationStep = 'premise' | 'charter' | 'world' | 'launch'

export interface IncubationCharterDraft {
  oneLinePremise: string
  storyPromise: string
  themes: string[]
  tone: string
  targetReader: string
}

export interface IncubationWorldDraft {
  characters: Array<{ name: string; personality: string; background: string }>
  locations: Array<{ name: string; description: string; features: string }>
  rules: Array<{ name: string; content: string; scope: string }>
}

export interface IncubationChapterDraft {
  title: string
  outlineSummary: string
  openingParagraph: string
}

export interface IncubationSession {
  id: 'incubation'
  projectId: string
  currentStep: IncubationStep
  premiseInput: string
  moodInput: string
  conflictInput: string
  protagonistInput: string
  charterDraft: IncubationCharterDraft | null
  worldDraft: IncubationWorldDraft | null
  chapterDraft: IncubationChapterDraft | null
  firstChapterId: string | null
  completedAt: number | null
  createdAt: number
  updatedAt: number
}
```

## UX Decisions

1. New users should see one recommended action: `孵化新故事（推荐）`
2. Experienced users must still be able to choose `空白项目`
3. Each incubation step asks for a small amount of input and then shows editable structured output
4. Closing the dialog must not lose progress
5. Completion should route into the normal project page and open the seeded first chapter for writing

## Task 1: Add Incubation Types, Storage, and Migration

**Files:**
- Create: `src/lib/types/incubation.ts`
- Create: `src/lib/db/incubation-queries.ts`
- Create: `src/lib/db/incubation-queries.test.ts`
- Create: `src/lib/db/project-db.migration-v18.test.ts`
- Modify: `src/lib/types/index.ts`
- Modify: `src/lib/db/project-db.ts`

- [ ] **Step 1: Write the failing storage test file**

Create `src/lib/db/incubation-queries.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetProjectDBCache, createProjectDB } from './project-db'
import {
  completeIncubationSession,
  createIncubationSession,
  getIncubationSession,
  updateIncubationSession,
} from './incubation-queries'

describe('incubation-queries', () => {
  const projectId = 'phase6-project'

  beforeEach(async () => {
    __resetProjectDBCache()
    await createProjectDB(projectId).delete()
  })

  it('creates a resumable incubation session', async () => {
    await createIncubationSession(projectId)
    const session = await getIncubationSession(projectId)
    expect(session?.id).toBe('incubation')
    expect(session?.currentStep).toBe('premise')
    expect(session?.completedAt).toBeNull()
  })

  it('updates the current step and saved draft fields', async () => {
    await createIncubationSession(projectId)
    await updateIncubationSession(projectId, {
      currentStep: 'world',
      premiseInput: '雨夜里继承一座旧戏楼',
    })
    const session = await getIncubationSession(projectId)
    expect(session?.currentStep).toBe('world')
    expect(session?.premiseInput).toContain('旧戏楼')
  })

  it('marks the session complete', async () => {
    await createIncubationSession(projectId)
    await completeIncubationSession(projectId, { firstChapterId: 'chapter-1' })
    const session = await getIncubationSession(projectId)
    expect(session?.completedAt).not.toBeNull()
    expect(session?.firstChapterId).toBe('chapter-1')
  })
})
```

- [ ] **Step 2: Write the failing migration test**

Create `src/lib/db/project-db.migration-v18.test.ts`:

```ts
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { InkForgeProjectDB, __resetProjectDBCache } from './project-db'

class LegacyV17Db extends Dexie {
  constructor(name: string) {
    super(name)
    this.version(17).stores({
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
  }
}

describe('project-db v18 migration', () => {
  const name = 'inkforge-project-migration-v18'

  afterEach(async () => {
    __resetProjectDBCache()
    await Dexie.delete(name)
  })

  it('adds incubationSessions when upgrading from v17', async () => {
    const legacy = new LegacyV17Db(name)
    await legacy.open()
    legacy.close()

    const db = new InkForgeProjectDB('migration-v18')
    db.close()
  })
})
```

- [ ] **Step 3: Run the targeted tests to confirm failure**

Run:

```bash
npx vitest run src/lib/db/incubation-queries.test.ts src/lib/db/project-db.migration-v18.test.ts
```

Expected: FAIL with missing module or missing table errors for incubation storage.

- [ ] **Step 4: Add the incubation types**

Create `src/lib/types/incubation.ts` with the exact domain model from the `Domain Model` section above.

- [ ] **Step 5: Re-export the new types**

Update `src/lib/types/index.ts`:

```ts
export type {
  IncubationStep,
  IncubationCharterDraft,
  IncubationWorldDraft,
  IncubationChapterDraft,
  IncubationSession,
} from './incubation'
```

- [ ] **Step 6: Add the Dexie v18 table**

Append a new version in `src/lib/db/project-db.ts`:

```ts
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
  incubationSessions: 'id, projectId, currentStep, updatedAt, completedAt',
})
```

Also declare the table on the class:

```ts
incubationSessions!: Table<IncubationSession, string>
```

And add the import:

```ts
import type { PreferenceMemory, ProjectCharter, IncubationSession } from '../types'
```

- [ ] **Step 7: Implement the query helpers**

Create `src/lib/db/incubation-queries.ts`:

```ts
import type { IncubationSession } from '../types'
import { createProjectDB } from './project-db'

function createDefaultSession(projectId: string, now: number = Date.now()): IncubationSession {
  return {
    id: 'incubation',
    projectId,
    currentStep: 'premise',
    premiseInput: '',
    moodInput: '',
    conflictInput: '',
    protagonistInput: '',
    charterDraft: null,
    worldDraft: null,
    chapterDraft: null,
    firstChapterId: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export async function createIncubationSession(projectId: string): Promise<IncubationSession> {
  const db = createProjectDB(projectId)
  const session = createDefaultSession(projectId)
  await db.incubationSessions.put(session)
  return session
}

export async function getIncubationSession(projectId: string): Promise<IncubationSession | undefined> {
  return createProjectDB(projectId).incubationSessions.get('incubation')
}

export async function updateIncubationSession(
  projectId: string,
  updates: Partial<Omit<IncubationSession, 'id' | 'projectId' | 'createdAt'>>
): Promise<IncubationSession> {
  const db = createProjectDB(projectId)
  const current = (await db.incubationSessions.get('incubation')) ?? createDefaultSession(projectId)
  const next: IncubationSession = {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  }
  await db.incubationSessions.put(next)
  return next
}

export async function completeIncubationSession(
  projectId: string,
  updates: { firstChapterId: string }
): Promise<IncubationSession> {
  return updateIncubationSession(projectId, {
    firstChapterId: updates.firstChapterId,
    completedAt: Date.now(),
    currentStep: 'launch',
  })
}
```

- [ ] **Step 8: Finish the migration assertion**

Update the migration test assertion body:

```ts
const db = new InkForgeProjectDB('migration-v18')
await db.open()
expect(db.tables.some(table => table.name === 'incubationSessions')).toBe(true)
await db.close()
```

- [ ] **Step 9: Re-run the targeted tests**

Run:

```bash
npx vitest run src/lib/db/incubation-queries.test.ts src/lib/db/project-db.migration-v18.test.ts
```

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/lib/types/incubation.ts src/lib/types/index.ts src/lib/db/project-db.ts src/lib/db/incubation-queries.ts src/lib/db/incubation-queries.test.ts src/lib/db/project-db.migration-v18.test.ts
git commit -m "feat(incubation): add session storage and migration"
```

## Task 2: Add Pure Prompt Builders for Charter, World, and First Chapter

**Files:**
- Create: `src/lib/ai/incubation-prompts.ts`
- Create: `src/lib/ai/incubation-prompts.test.ts`

- [ ] **Step 1: Write the failing prompt tests**

Create `src/lib/ai/incubation-prompts.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildCharterPrompt,
  buildWorldPrompt,
  buildFirstChapterPrompt,
} from './incubation-prompts'

describe('incubation-prompts', () => {
  it('builds a charter prompt from premise inputs', () => {
    const prompt = buildCharterPrompt({
      premiseInput: '一个替人守灯的少女接管鬼市',
      moodInput: '冷清、压抑、宿命',
      conflictInput: '她必须在救弟弟和守规矩之间做选择',
      protagonistInput: '嘴硬心软，记忆力极强',
    })

    expect(prompt).toContain('oneLinePremise')
    expect(prompt).toContain('storyPromise')
    expect(prompt).toContain('targetReader')
  })

  it('builds a world prompt from a charter draft', () => {
    const prompt = buildWorldPrompt({
      oneLinePremise: '鬼市守灯少女的选择故事',
      storyPromise: '诡市成长',
      themes: ['代价', '亲情'],
      tone: '冷寂',
      targetReader: '女频悬疑奇幻读者',
    })

    expect(prompt).toContain('characters')
    expect(prompt).toContain('locations')
    expect(prompt).toContain('rules')
  })

  it('builds a first-chapter prompt from premise + world drafts', () => {
    const prompt = buildFirstChapterPrompt({
      premiseInput: '守灯少女接管鬼市',
      charterTitle: '鬼市守灯录',
      worldSummary: '人物、地点、规则已确定',
    })

    expect(prompt).toContain('title')
    expect(prompt).toContain('outlineSummary')
    expect(prompt).toContain('openingParagraph')
  })
})
```

- [ ] **Step 2: Run the prompt tests to verify failure**

Run:

```bash
npx vitest run src/lib/ai/incubation-prompts.test.ts
```

Expected: FAIL because the prompt module does not exist yet.

- [ ] **Step 3: Implement the charter prompt builder**

Create the first function in `src/lib/ai/incubation-prompts.ts`:

```ts
export function buildCharterPrompt(input: {
  premiseInput: string
  moodInput: string
  conflictInput: string
  protagonistInput: string
}): string {
  return [
    '你是中文长篇策划助手。',
    '请把用户的模糊灵感整理成 JSON，不要输出额外解释。',
    '字段必须包含：oneLinePremise, storyPromise, themes, tone, targetReader。',
    `灵感：${input.premiseInput}`,
    `情绪：${input.moodInput}`,
    `冲突：${input.conflictInput}`,
    `主角：${input.protagonistInput}`,
  ].join('\n')
}
```

- [ ] **Step 4: Implement the world and first-chapter builders**

Append:

```ts
import type { IncubationCharterDraft } from '../types'

export function buildWorldPrompt(charter: IncubationCharterDraft): string {
  return [
    '基于以下作品宪章，生成起步世界骨架 JSON。',
    '字段必须包含：characters, locations, rules。',
    JSON.stringify(charter, null, 2),
  ].join('\n')
}

export function buildFirstChapterPrompt(input: {
  premiseInput: string
  charterTitle: string
  worldSummary: string
}): string {
  return [
    '请只生成第一章启动包 JSON。',
    '字段必须包含：title, outlineSummary, openingParagraph。',
    `项目标题：${input.charterTitle}`,
    `核心灵感：${input.premiseInput}`,
    `世界摘要：${input.worldSummary}`,
  ].join('\n')
}
```

- [ ] **Step 5: Re-run the prompt tests**

Run:

```bash
npx vitest run src/lib/ai/incubation-prompts.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/incubation-prompts.ts src/lib/ai/incubation-prompts.test.ts
git commit -m "feat(incubation): add incubation prompt builders"
```

## Task 3: Extend Project Creation With an Incubation Entry Path

**Files:**
- Modify: `src/lib/hooks/use-projects.ts`
- Modify: `src/lib/hooks/use-projects.test.ts`
- Modify: `src/components/project/create-project-modal.tsx`
- Modify: `src/components/project/create-project-modal.test.tsx`
- Modify: `src/components/project/empty-dashboard.tsx`
- Modify: `src/components/project/project-dashboard.tsx`

- [ ] **Step 1: Write the failing hook test for incubated creation**

Add to `src/lib/hooks/use-projects.test.ts`:

```ts
it('seeds an incubation session when creating an incubated project', async () => {
  const { result } = renderHook(() => useProjects())

  let createdId: string | undefined
  await act(async () => {
    createdId = await result.current.createProject({
      title: '孵化项目',
      creationMode: 'incubation',
    })
  })

  const projectDb = createProjectDB(createdId!)
  const session = await projectDb.incubationSessions.get('incubation')
  expect(session?.projectId).toBe(createdId)
  expect(session?.currentStep).toBe('premise')
})
```

- [ ] **Step 2: Write the failing modal test for path selection**

Replace `src/components/project/create-project-modal.test.tsx` with assertions for both paths:

```ts
it('submits incubation mode and routes to the project page', async () => {
  const onSubmit = vi.fn().mockResolvedValue('p-42')
  render(<CreateProjectModal open onOpenChange={vi.fn()} onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText('标题 *'), {
    target: { value: '新项目' },
  })
  fireEvent.click(screen.getByRole('radio', { name: '孵化新故事（推荐）' }))
  fireEvent.click(screen.getByRole('button', { name: '开始孵化' }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      title: '新项目',
      genre: '',
      synopsis: '',
      creationMode: 'incubation',
    })
    expect(pushMock).toHaveBeenCalledWith('/projects/p-42')
  })
})
```

- [ ] **Step 3: Run the targeted creation tests to verify failure**

Run:

```bash
npx vitest run src/lib/hooks/use-projects.test.ts src/components/project/create-project-modal.test.tsx
```

Expected: FAIL because `creationMode` does not exist yet.

- [ ] **Step 4: Extend the project-creation input**

In `src/lib/types/project.ts`, add:

```ts
export interface CreateProjectInput {
  title: string
  genre?: string
  synopsis?: string
  creationMode?: 'blank' | 'incubation'
}
```

- [ ] **Step 5: Seed incubation during project creation**

Update `src/lib/hooks/use-projects.ts`:

```ts
import { createIncubationSession } from '../db/incubation-queries'

if (input.creationMode === 'incubation') {
  await createIncubationSession(id)
}
```

Keep the existing charter seed:

```ts
await projectDb.projectCharter.put(createDefaultProjectCharter(id))
```

- [ ] **Step 6: Add mode selection to the modal**

In `src/components/project/create-project-modal.tsx`, extend the form defaults and submit button copy:

```ts
const createProjectSchema = z.object({
  title: z.string().min(1, '请输入标题').max(100, '标题不能超过100字'),
  genre: z.string().optional(),
  synopsis: z.string().max(500, '简介不能超过500字').optional(),
  creationMode: z.enum(['incubation', 'blank']).default('incubation'),
})
```

Add the radio group body:

```tsx
<fieldset className="space-y-3">
  <Label>创建方式</Label>
  <label className="flex items-start gap-3 rounded-md border p-3">
    <input type="radio" value="incubation" {...register('creationMode')} />
    <div>
      <p className="text-sm font-medium">孵化新故事（推荐）</p>
      <p className="text-xs text-muted-foreground">从灵感一路走到第一章第一场</p>
    </div>
  </label>
  <label className="flex items-start gap-3 rounded-md border p-3">
    <input type="radio" value="blank" {...register('creationMode')} />
    <div>
      <p className="text-sm font-medium">空白项目</p>
      <p className="text-xs text-muted-foreground">直接进入常规写作工作台</p>
    </div>
  </label>
</fieldset>
```

And route conditionally:

```ts
router.push(data.creationMode === 'incubation' ? `/projects/${id}` : `/projects/${id}/charter`)
```

- [ ] **Step 7: Update dashboard CTA copy**

In `src/components/project/empty-dashboard.tsx`, change the visible copy to reflect the new recommendation:

```tsx
<h2 className="mb-4 text-[32px] font-semibold leading-tight text-center">
  从一点念头，孵出第一章
</h2>

<p className="mb-10 text-[15px] text-muted-foreground max-w-md text-center leading-relaxed">
  先给我母题、情绪和冲突，我会陪你把它压成一个能开写的故事起点。
</p>

<Button size="lg" onClick={onCreateProject}>
  孵化新故事
</Button>
```

- [ ] **Step 8: Re-run the targeted creation tests**

Run:

```bash
npx vitest run src/lib/hooks/use-projects.test.ts src/components/project/create-project-modal.test.tsx
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/types/project.ts src/lib/hooks/use-projects.ts src/lib/hooks/use-projects.test.ts src/components/project/create-project-modal.tsx src/components/project/create-project-modal.test.tsx src/components/project/empty-dashboard.tsx src/components/project/project-dashboard.tsx
git commit -m "feat(incubation): add incubated project creation path"
```

## Task 4: Build the Incubation Hook and Structured Writeback

**Files:**
- Create: `src/lib/hooks/use-incubation.ts`
- Create: `src/lib/hooks/use-incubation.test.ts`
- Modify: `src/lib/db/project-charter-queries.ts`

- [ ] **Step 1: Write the failing hook tests**

Create `src/lib/hooks/use-incubation.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetProjectDBCache, createProjectDB } from '../db/project-db'
import { createIncubationSession } from '../db/incubation-queries'
import { useIncubation } from './use-incubation'

describe('useIncubation', () => {
  const projectId = 'incubation-hook-project'

  beforeEach(async () => {
    __resetProjectDBCache()
    await createProjectDB(projectId).delete()
    await createIncubationSession(projectId)
  })

  it('loads the saved incubation session', async () => {
    const { result } = renderHook(() => useIncubation(projectId))
    await waitFor(() => expect(result.current.session?.projectId).toBe(projectId))
  })

  it('advances and persists the current step', async () => {
    const { result } = renderHook(() => useIncubation(projectId))
    await act(async () => {
      await result.current.savePremise({
        premiseInput: '守灯少女',
        moodInput: '冷寂',
        conflictInput: '救弟弟还是守规矩',
        protagonistInput: '嘴硬心软',
      })
    })
    expect(result.current.session?.currentStep).toBe('charter')
  })

  it('finalizes charter, world entries, and first chapter', async () => {
    const { result } = renderHook(() => useIncubation(projectId))
    await act(async () => {
      await result.current.finalize({
        charterDraft: {
          oneLinePremise: '守灯少女接管鬼市',
          storyPromise: '成长与代价',
          themes: ['代价'],
          tone: '冷清',
          targetReader: '女频奇幻读者',
        },
        worldDraft: {
          characters: [{ name: '沈灯', personality: '克制', background: '守灯人后裔' }],
          locations: [{ name: '鬼市', description: '只在子夜开启', features: '戏台、旧灯、薄雾' }],
          rules: [{ name: '灯契', content: '灯不可灭', scope: '鬼市核心秩序' }],
        },
        chapterDraft: {
          title: '第一章 灯未灭',
          outlineSummary: '少女第一次独自守夜',
          openingParagraph: '子时一到，旧戏楼里的最后一盏灯亮了。',
        },
      })
    })

    const db = createProjectDB(projectId)
    expect(await db.projectCharter.get('charter')).toBeTruthy()
    expect((await db.worldEntries.toArray()).length).toBeGreaterThan(0)
    expect((await db.chapters.toArray()).length).toBe(1)
  })
})
```

- [ ] **Step 2: Run the hook test to verify failure**

Run:

```bash
npx vitest run src/lib/hooks/use-incubation.test.ts
```

Expected: FAIL because the hook does not exist yet.

- [ ] **Step 3: Implement hook state and premise save**

Create `src/lib/hooks/use-incubation.ts`:

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { getProjectCharter, saveProjectCharter } from '../db/project-charter-queries'
import { addChapter, updateChapterContent, updateOutlineFields } from '../db/chapter-queries'
import { addWorldEntry, updateWorldEntryFields } from '../db/world-entry-queries'
import { createProjectDB } from '../db/project-db'
import {
  getIncubationSession,
  updateIncubationSession,
  completeIncubationSession,
} from '../db/incubation-queries'
import type {
  IncubationChapterDraft,
  IncubationCharterDraft,
  IncubationSession,
  IncubationWorldDraft,
} from '../types'

export function useIncubation(projectId: string) {
  const [session, setSession] = useState<IncubationSession | null>(null)

  useEffect(() => {
    getIncubationSession(projectId).then(next => setSession(next ?? null))
  }, [projectId])

  const savePremise = useCallback(async (input: {
    premiseInput: string
    moodInput: string
    conflictInput: string
    protagonistInput: string
  }) => {
    const next = await updateIncubationSession(projectId, {
      ...input,
      currentStep: 'charter',
    })
    setSession(next)
    return next
  }, [projectId])
```

- [ ] **Step 4: Implement charter/world draft saves and finalization**

Append:

```ts
  const saveCharterDraft = useCallback(async (charterDraft: IncubationCharterDraft) => {
    const next = await updateIncubationSession(projectId, {
      charterDraft,
      currentStep: 'world',
    })
    setSession(next)
    return next
  }, [projectId])

  const saveWorldDraft = useCallback(async (worldDraft: IncubationWorldDraft, chapterDraft: IncubationChapterDraft) => {
    const next = await updateIncubationSession(projectId, {
      worldDraft,
      chapterDraft,
      currentStep: 'launch',
    })
    setSession(next)
    return next
  }, [projectId])

  const finalize = useCallback(async (payload: {
    charterDraft: IncubationCharterDraft
    worldDraft: IncubationWorldDraft
    chapterDraft: IncubationChapterDraft
  }) => {
    await getProjectCharter(projectId)
    await saveProjectCharter(projectId, {
      oneLinePremise: payload.charterDraft.oneLinePremise,
      storyPromise: payload.charterDraft.storyPromise,
      themes: payload.charterDraft.themes,
      tone: payload.charterDraft.tone,
      targetReader: payload.charterDraft.targetReader,
    })

    const db = createProjectDB(projectId)
    for (const character of payload.worldDraft.characters) {
      const id = await addWorldEntry(db, projectId, 'character', character.name)
      await updateWorldEntryFields(db, id, {
        personality: character.personality,
        background: character.background,
      })
    }
    for (const location of payload.worldDraft.locations) {
      const id = await addWorldEntry(db, projectId, 'location', location.name)
      await updateWorldEntryFields(db, id, {
        description: location.description,
        features: location.features,
      })
    }
    for (const rule of payload.worldDraft.rules) {
      const id = await addWorldEntry(db, projectId, 'rule', rule.name)
      await updateWorldEntryFields(db, id, {
        content: rule.content,
        scope: rule.scope,
      })
    }

    const chapterId = await addChapter(db, projectId, payload.chapterDraft.title)
    await updateOutlineFields(db, chapterId, {
      outlineSummary: payload.chapterDraft.outlineSummary,
      outlineStatus: 'in_progress',
    })
    await updateChapterContent(db, chapterId, {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: payload.chapterDraft.openingParagraph }] }],
    })

    const next = await completeIncubationSession(projectId, { firstChapterId: chapterId })
    setSession(next)
    return chapterId
  }, [projectId])

  return { session, savePremise, saveCharterDraft, saveWorldDraft, finalize }
}
```

- [ ] **Step 5: Re-run the hook test**

Run:

```bash
npx vitest run src/lib/hooks/use-incubation.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-incubation.ts src/lib/hooks/use-incubation.test.ts
git commit -m "feat(incubation): add incubation hook and writeback"
```

## Task 5: Build the Incubation Dialog UI

**Files:**
- Create: `src/components/project/incubation-dialog.tsx`
- Create: `src/components/project/incubation-step-premise.tsx`
- Create: `src/components/project/incubation-step-charter.tsx`
- Create: `src/components/project/incubation-step-world.tsx`
- Create: `src/components/project/incubation-step-launch.tsx`
- Create: `src/components/project/incubation-dialog.test.tsx`

- [ ] **Step 1: Write the failing dialog test**

Create `src/components/project/incubation-dialog.test.tsx`:

```ts
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IncubationDialog } from './incubation-dialog'

describe('IncubationDialog', () => {
  it('renders the premise step first', () => {
    render(
      <IncubationDialog
        open
        projectId="p-1"
        onOpenChange={vi.fn()}
        onFinished={vi.fn()}
      />
    )

    expect(screen.getByText('先从一点念头开始')).toBeInTheDocument()
  })

  it('shows a launch action on the final step', async () => {
    render(
      <IncubationDialog
        open
        projectId="p-1"
        forcedStep="launch"
        onOpenChange={vi.fn()}
        onFinished={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '进入第一章' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the dialog test to verify failure**

Run:

```bash
npx vitest run src/components/project/incubation-dialog.test.tsx
```

Expected: FAIL because the dialog components do not exist yet.

- [ ] **Step 3: Implement the premise step**

Create `src/components/project/incubation-step-premise.tsx`:

```tsx
interface PremiseStepProps {
  value: {
    premiseInput: string
    moodInput: string
    conflictInput: string
    protagonistInput: string
  }
  onChange: (next: PremiseStepProps['value']) => void
}

export function IncubationStepPremise({ value, onChange }: PremiseStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-medium text-[24px]">先从一点念头开始</h2>
        <p className="text-sm text-muted-foreground">不用完整，只要能点亮第一盏灯。</p>
      </div>
      <Textarea value={value.premiseInput} onChange={e => onChange({ ...value, premiseInput: e.target.value })} />
      <Input value={value.moodInput} onChange={e => onChange({ ...value, moodInput: e.target.value })} />
      <Input value={value.conflictInput} onChange={e => onChange({ ...value, conflictInput: e.target.value })} />
      <Input value={value.protagonistInput} onChange={e => onChange({ ...value, protagonistInput: e.target.value })} />
    </div>
  )
}
```

- [ ] **Step 4: Implement the draft-review steps**

Create `src/components/project/incubation-step-charter.tsx` and `src/components/project/incubation-step-world.tsx` with simple editable text surfaces:

```tsx
export function IncubationStepCharter({ draft, onChange }: {
  draft: IncubationCharterDraft
  onChange: (next: IncubationCharterDraft) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-medium text-[24px]">把故事立起来</h2>
      <Textarea value={draft.oneLinePremise} onChange={e => onChange({ ...draft, oneLinePremise: e.target.value })} />
      <Textarea value={draft.storyPromise} onChange={e => onChange({ ...draft, storyPromise: e.target.value })} />
    </div>
  )
}
```

```tsx
export function IncubationStepWorld({ summary, onChange }: {
  summary: string
  onChange: (next: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-medium text-[24px]">给它骨架与落点</h2>
      <Textarea value={summary} onChange={e => onChange(e.target.value)} rows={10} />
    </div>
  )
}
```

- [ ] **Step 5: Implement the launch step and dialog shell**

Create `src/components/project/incubation-step-launch.tsx`:

```tsx
export function IncubationStepLaunch({
  chapterTitle,
  openingParagraph,
  onLaunch,
}: {
  chapterTitle: string
  openingParagraph: string
  onLaunch: () => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-medium text-[24px]">第一章已经点亮</h2>
      <p className="text-sm text-muted-foreground">{chapterTitle}</p>
      <div className="rounded-md border p-4 text-sm leading-7">{openingParagraph}</div>
      <Button onClick={onLaunch}>进入第一章</Button>
    </div>
  )
}
```

Create `src/components/project/incubation-dialog.tsx` to switch by `session.currentStep` and call `useIncubation(projectId)`.

- [ ] **Step 6: Re-run the dialog test**

Run:

```bash
npx vitest run src/components/project/incubation-dialog.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/project/incubation-dialog.tsx src/components/project/incubation-step-premise.tsx src/components/project/incubation-step-charter.tsx src/components/project/incubation-step-world.tsx src/components/project/incubation-step-launch.tsx src/components/project/incubation-dialog.test.tsx
git commit -m "feat(incubation): add newcomer incubation dialog"
```

## Task 6: Launch Completed Incubation Into the Existing Workspace

**Files:**
- Create: `src/lib/hooks/use-workspace-layout.test.ts`
- Modify: `src/lib/hooks/use-workspace-layout.ts`
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/components/project/project-dashboard.tsx`

- [ ] **Step 1: Write the failing workspace launch test**

Create `src/lib/hooks/use-workspace-layout.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspaceLayout } from './use-workspace-layout'

vi.mock('./use-layout', () => ({
  useLayout: () => ({
    activeTab: 'chapters',
    saveSidebarWidth: vi.fn(),
    saveActiveTab: vi.fn(),
    saveChatPanelWidth: vi.fn(),
  }),
}))

vi.mock('./use-chapters', () => ({
  useChapters: () => ({
    chapters: [
      {
        id: 'chapter-1',
        projectId: 'p-1',
        order: 0,
        title: '第一章 灯未灭',
        content: null,
        wordCount: 0,
        status: 'draft',
        outlineSummary: '',
        outlineTargetWordCount: null,
        outlineStatus: 'not_started',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ],
  }),
}))

vi.mock('./use-world-entries', () => ({
  useWorldEntries: () => ({
    entries: [],
    entriesByType: { character: [], location: [], rule: [], timeline: [] },
    addEntry: vi.fn(),
  }),
}))

vi.mock('./use-idle-mode', () => ({
  useIdleMode: () => false,
}))

describe('useWorkspaceLayout launch handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('selects the incubated first chapter when launch is requested', async () => {
    const { result } = renderHook(() => useWorkspaceLayout({ projectId: 'p-1' }))

    await act(async () => {
      result.current.handleLaunchToChapter('chapter-1')
    })

    await waitFor(() => {
      expect(result.current.activeChapterId).toBe('chapter-1')
      expect(result.current.activeTab).toBe('chapters')
    })
  })
})
```

- [ ] **Step 2: Add launch state to the layout hook**

In `src/lib/hooks/use-workspace-layout.ts`, add a one-shot initializer:

```ts
const [preferredLaunchChapterId, setPreferredLaunchChapterId] = useState<string | null>(null)

const handleLaunchToChapter = useCallback((chapterId: string) => {
  saveActiveTab('chapters')
  setActiveOutlineId(null)
  setActiveWorldEntryId(null)
  setPreferredLaunchChapterId(chapterId)
}, [saveActiveTab])
```

Update the chapter-selection effect:

```ts
if (preferredLaunchChapterId && sortedChapters.some(ch => ch.id === preferredLaunchChapterId)) {
  setActiveChapterId(preferredLaunchChapterId)
  setPreferredLaunchChapterId(null)
  return
}
```

- [ ] **Step 3: Open the incubation dialog automatically for unfinished sessions**

In `src/app/projects/[id]/page.tsx`, add:

```ts
const [incubationOpen, setIncubationOpen] = useState(false)

useEffect(() => {
  getIncubationSession(params.id).then(session => {
    if (session && session.completedAt === null) {
      setIncubationOpen(true)
    }
  })
}, [params.id])
```

Render:

```tsx
<IncubationDialog
  open={incubationOpen}
  projectId={params.id}
  onOpenChange={setIncubationOpen}
  onFinished={(chapterId) => {
    setIncubationOpen(false)
    layout.handleLaunchToChapter(chapterId)
  }}
/>
```

- [ ] **Step 4: Wire the launch callback through the hook return value**

Return the new callback from `useWorkspaceLayout`:

```ts
return {
  // existing fields...
  handleLaunchToChapter,
}
```

- [ ] **Step 5: Re-run the targeted launch test**

Run:

```bash
npx vitest run src/lib/hooks/use-incubation.test.ts src/components/project/incubation-dialog.test.tsx
```

Expected: PASS with the dialog able to finish and hand control into chapter selection.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-workspace-layout.ts src/app/projects/[id]/page.tsx src/components/project/project-dashboard.tsx
git commit -m "feat(incubation): launch finished incubation into writing workspace"
```

## Task 7: Verify the Full Phase 6 Flow

**Files:**
- Modify: any failing tests introduced in Tasks 1-6

- [ ] **Step 1: Run the focused Phase 6 suite**

Run:

```bash
npx vitest run src/lib/db/incubation-queries.test.ts src/lib/db/project-db.migration-v18.test.ts src/lib/ai/incubation-prompts.test.ts src/lib/hooks/use-projects.test.ts src/lib/hooks/use-incubation.test.ts src/components/project/create-project-modal.test.tsx src/components/project/incubation-dialog.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS

- [ ] **Step 3: Run the full unit suite**

Run:

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 4: Smoke-test the newcomer flow manually**

Run:

```bash
pnpm dev
```

Open: `http://localhost:3000`

Verify:

1. Empty dashboard recommends `孵化新故事`
2. `空白项目` still routes to the old charter-first workflow
3. `孵化新故事（推荐）` creates a project and opens the incubation dialog
4. Closing and reopening the same project resumes the saved step
5. Completing the flow creates:
   - a non-empty `projectCharter`
   - at least one `worldEntries` row
   - one first `chapters` row with non-empty `outlineSummary`
   - non-empty chapter editor content
6. Completion lands in the project page with the seeded first chapter selected

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(incubation): deliver phase6 newcomer flow"
```

## Self-Review

### Spec coverage

- `新建作品升级为孵化流程` → Tasks 3, 5, 6
- `从母题、情绪、人物冲突入手` → Tasks 4 and 5
- `AI 把模糊念头压成世界骨架和初版卷纲` → Tasks 2 and 4
- `走到第一章第一场` → Tasks 4 and 6

### Placeholder scan

The original draft had several plan failures:

1. incorrect file paths
2. references to data tables not present in the currently targeted files
3. code steps without concrete code
4. tests described only in prose

Those issues are removed in this rewrite.

### Type consistency

This plan uses one consistent set of Phase 6 names:

1. `IncubationStep`
2. `IncubationSession`
3. `IncubationCharterDraft`
4. `IncubationWorldDraft`
5. `IncubationChapterDraft`
6. `firstChapterId`

### Known implementation boundary

If the repository later reintroduces or adds dedicated planning entities such as `StoryArc`, `ChapterPlan`, or `SceneCard`, they should be implemented in a separate follow-up plan. They are intentionally not smuggled into this Phase 6 plan because the currently targeted code paths do not expose those tables.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-27-longform-cocreate-phase6.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
