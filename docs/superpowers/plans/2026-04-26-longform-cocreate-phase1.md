# Longform Co-Creation Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first shippable slice of InkForge's longform co-creation direction by adding a project charter, wiring charter context into AI calls, and persisting user rejection feedback as long-term preference memory.

**Architecture:** This plan deliberately covers only Phase 1 from `docs/superpowers/specs/2026-04-26-longform-cocreate-design.md`. The slice is anchored on the per-project Dexie database: a singleton `projectCharter` row defines "what this book is", `preferenceMemories` capture "what this book is not", and the AI prompt builder consumes both through explicit structured context rather than chat-history drift.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie/IndexedDB, Vitest, React Testing Library, Zod, existing InkForge AI prompt pipeline.

---

## Scope Check

The source spec spans six phases and multiple subsystems. Do **not** try to implement all six in one execution plan. This plan covers the smallest complete, testable release slice:

1. A writable `作品宪章` page
2. Charter-aware AI prompt construction
3. Persistent preference memory from rejected AI output
4. Obvious entry points that push users toward the charter-first workflow

Phases 2-6 need follow-on plans after this slice ships.

## File Structure Map

### Create

- `src/lib/types/project-charter.ts`  
  Phase 1 domain types: `ProjectCharter`, `PreferenceMemory`, input payloads, and default factory helpers.

- `src/lib/db/project-charter-queries.ts`  
  Dexie query helpers for reading/writing the singleton charter row and append-only preference memory rows.

- `src/lib/db/project-charter-queries.test.ts`  
  Query-layer tests for default seeding, updates, and newest-first preference memory ordering.

- `src/lib/db/project-db.migration-v17.test.ts`  
  Migration test proving a v16 DB upgrades cleanly and seeds a usable charter row.

- `src/lib/hooks/use-project-charter.ts`  
  LiveQuery-backed hook for the charter page and any future overview widgets.

- `src/components/project-charter/project-charter-form.tsx`  
  Main Phase 1 editor form for `作品宪章`.

- `src/components/project-charter/project-charter-form.test.tsx`  
  Form test for render, validation, and save payload wiring.

- `src/app/projects/[id]/charter/page.tsx`  
  New route: first-class `作品宪章` page under each project.

- `src/components/workspace/preference-feedback-dialog.tsx`  
  Reusable dialog for recording "this is not my book" feedback from AI outputs.

- `src/components/workspace/preference-feedback-dialog.test.tsx`  
  Dialog test for category selection and note submission.

- `src/components/workspace/workspace-topbar.test.tsx`  
  Smoke test for the new charter-first workspace entry.

### Modify

- `src/lib/types/index.ts`  
  Re-export the new charter types.

- `src/lib/db/project-db.ts`  
  Add Dexie v17 schema, typed tables, and exported table interfaces.

- `src/lib/ai/prompts.ts`  
  Add explicit `作品宪章` segment to the system prompt builder.

- `src/lib/ai/prompts.test.ts`  
  Extend prompt tests to assert charter context placement and flattening.

- `src/lib/hooks/use-ai-chat.ts`  
  Load the persisted charter and include it in every AI request.

- `src/lib/hooks/use-projects.ts`  
  Seed a default charter row on project creation so new projects have a stable Phase 1 starting point.

- `src/components/workspace/draft-card.tsx`  
  Reuse the new feedback dialog and write `PreferenceMemory` rows alongside draft rejection telemetry.

- `src/components/workspace/message-bubble.tsx`  
  Add a lightweight "记录偏差" action for assistant replies, not just draft cards.

- `src/components/workspace/ai-chat-panel/index.tsx`  
  Pass project/message context needed by the new feedback actions.

- `src/components/workspace/workspace-topbar.tsx`  
  Add a first-class `作品宪章` entry point in the project workspace.

- `src/components/project/create-project-modal.tsx`  
  Route brand-new projects into `/projects/[id]/charter` instead of dropping them straight into the generic workspace.

### Existing Tests to Re-run

- `src/components/workspace/draft-card.test.tsx`
- `src/lib/ai/prompts.test.ts`
- `src/lib/db/project-db.test.ts`

## Task 1: Add Phase 1 Charter Storage

**Files:**
- Create: `src/lib/types/project-charter.ts`
- Create: `src/lib/db/project-charter-queries.ts`
- Create: `src/lib/db/project-charter-queries.test.ts`
- Create: `src/lib/db/project-db.migration-v17.test.ts`
- Modify: `src/lib/db/project-db.ts`
- Modify: `src/lib/types/index.ts`

- [ ] **Step 1: Write the failing DB/query tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { __resetProjectDBCache, createProjectDB } from './project-db'
import {
  getProjectCharter,
  saveProjectCharter,
  recordPreferenceMemory,
  listPreferenceMemories,
} from './project-charter-queries'

describe('project charter queries', () => {
  const projectId = 'phase1-charter'

  beforeEach(async () => {
    __resetProjectDBCache()
    indexedDB.deleteDatabase(`inkforge-project-${projectId}`)
  })

  it('seeds a default charter and persists updates', async () => {
    const initial = await getProjectCharter(projectId)
    expect(initial.id).toBe('charter')
    expect(initial.projectId).toBe(projectId)
    expect(initial.storyPromise).toBe('')

    await saveProjectCharter(projectId, {
      oneLinePremise: '一个废柴皇子在边荒收拾旧山河',
      storyPromise: '高压权谋与热血复国并行',
      tone: '苍凉、克制、带锋刃',
    })

    const updated = await getProjectCharter(projectId)
    expect(updated.oneLinePremise).toContain('废柴皇子')
    expect(updated.storyPromise).toContain('复国')
    expect(updated.tone).toContain('锋刃')
    expect(updated.aiUnderstanding).toContain('高压权谋')
  })

  it('records preference memories newest-first', async () => {
    await recordPreferenceMemory(projectId, {
      source: 'draft',
      messageId: 'm-1',
      verdict: 'reject',
      category: 'voice',
      note: '语言太像通用古风，不像这本书',
    })
    await recordPreferenceMemory(projectId, {
      source: 'chat',
      messageId: 'm-2',
      verdict: 'reject',
      category: 'plot',
      note: '冲突升级太快，缺少铺垫',
    })

    const rows = await listPreferenceMemories(projectId)
    expect(rows).toHaveLength(2)
    expect(rows[0].messageId).toBe('m-2')
    expect(rows[1].messageId).toBe('m-1')
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { InkForgeProjectDB } from './project-db'

describe('project db v17 migration', () => {
  it('upgrades a v16 database with empty charter tables', async () => {
    const dbName = 'inkforge-project-migration-v17'
    await Dexie.delete(dbName)

    const legacy = new Dexie(dbName)
    legacy.version(16).stores({
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
    })
    await legacy.open()
    await legacy.close()

    const upgraded = new InkForgeProjectDB('migration-v17')
    ;(upgraded as unknown as { name: string }).name = dbName
    await upgraded.open()

    expect(upgraded.tables.some(table => table.name === 'projectCharter')).toBe(true)
    expect(upgraded.tables.some(table => table.name === 'preferenceMemories')).toBe(true)

    await upgraded.close()
    await Dexie.delete(dbName)
  })
})
```

- [ ] **Step 2: Run the targeted tests and confirm they fail**

Run:

```bash
npx vitest run src/lib/db/project-charter-queries.test.ts src/lib/db/project-db.migration-v17.test.ts
```

Expected:

```text
FAIL  Cannot find module './project-charter-queries'
FAIL  Property 'projectCharter' does not exist on type 'InkForgeProjectDB'
```

- [ ] **Step 3: Implement the charter types, Dexie tables, and query helpers**

```ts
// src/lib/types/project-charter.ts
export interface ProjectCharter {
  id: 'charter'
  projectId: string
  oneLinePremise: string
  storyPromise: string
  themes: string[]
  tone: string
  targetReader: string
  styleDos: string[]
  tabooList: string[]
  positiveReferences: string[]
  negativeReferences: string[]
  aiUnderstanding: string
  createdAt: number
  updatedAt: number
}

export interface PreferenceMemory {
  id: string
  projectId: string
  source: 'chat' | 'draft'
  messageId: string
  verdict: 'accept' | 'reject'
  category: 'voice' | 'worldbuilding' | 'plot' | 'character' | 'other'
  note: string
  createdAt: number
}

export function createDefaultProjectCharter(projectId: string, now = Date.now()): ProjectCharter {
  return {
    id: 'charter',
    projectId,
    oneLinePremise: '',
    storyPromise: '',
    themes: [],
    tone: '',
    targetReader: '',
    styleDos: [],
    tabooList: [],
    positiveReferences: [],
    negativeReferences: [],
    aiUnderstanding: '',
    createdAt: now,
    updatedAt: now,
  }
}
```

```ts
// src/lib/db/project-db.ts (additions only)
import type { ProjectCharter, PreferenceMemory } from '../types/project-charter'

export class InkForgeProjectDB extends Dexie {
  projectCharter!: Table<ProjectCharter, 'charter'>
  preferenceMemories!: Table<PreferenceMemory, string>

  constructor(projectId: string) {
    super(`inkforge-project-${projectId}`)
    // ...existing versions...
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
      projectCharter: '&id, projectId, updatedAt',
      preferenceMemories: 'id, projectId, createdAt, messageId, verdict',
    })
  }
}
```

```ts
// src/lib/db/project-charter-queries.ts
import { nanoid } from 'nanoid'
import { createProjectDB } from './project-db'
import {
  createDefaultProjectCharter,
  type PreferenceMemory,
  type ProjectCharter,
} from '../types/project-charter'

function buildAiUnderstanding(charter: ProjectCharter): string {
  return [
    charter.oneLinePremise && `故事核心：${charter.oneLinePremise}`,
    charter.storyPromise && `作品承诺：${charter.storyPromise}`,
    charter.tone && `情绪基调：${charter.tone}`,
    charter.themes.length > 0 && `主题：${charter.themes.join(' / ')}`,
    charter.styleDos.length > 0 && `风格偏好：${charter.styleDos.join('；')}`,
    charter.tabooList.length > 0 && `避免：${charter.tabooList.join('；')}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export async function getProjectCharter(projectId: string): Promise<ProjectCharter> {
  const db = createProjectDB(projectId)
  const existing = await db.projectCharter.get('charter')
  if (existing) return existing

  const seeded = createDefaultProjectCharter(projectId)
  await db.projectCharter.put(seeded)
  return seeded
}

export async function saveProjectCharter(
  projectId: string,
  patch: Partial<ProjectCharter>
): Promise<ProjectCharter> {
  const current = await getProjectCharter(projectId)
  const next: ProjectCharter = {
    ...current,
    ...patch,
    aiUnderstanding: buildAiUnderstanding({ ...current, ...patch } as ProjectCharter),
    updatedAt: Date.now(),
  }
  await createProjectDB(projectId).projectCharter.put(next)
  return next
}

export async function recordPreferenceMemory(
  projectId: string,
  input: Omit<PreferenceMemory, 'id' | 'projectId' | 'createdAt'>
): Promise<PreferenceMemory> {
  const row: PreferenceMemory = {
    id: nanoid(),
    projectId,
    createdAt: Date.now(),
    ...input,
  }
  await createProjectDB(projectId).preferenceMemories.add(row)
  return row
}

export async function listPreferenceMemories(projectId: string): Promise<PreferenceMemory[]> {
  return createProjectDB(projectId).preferenceMemories
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('createdAt')
}
```

- [ ] **Step 4: Re-run the targeted tests and confirm they pass**

Run:

```bash
npx vitest run src/lib/db/project-charter-queries.test.ts src/lib/db/project-db.migration-v17.test.ts
```

Expected:

```text
PASS  src/lib/db/project-charter-queries.test.ts
PASS  src/lib/db/project-db.migration-v17.test.ts
```

- [ ] **Step 5: Commit the storage layer**

```bash
git add src/lib/types/project-charter.ts src/lib/types/index.ts src/lib/db/project-db.ts src/lib/db/project-charter-queries.ts src/lib/db/project-charter-queries.test.ts src/lib/db/project-db.migration-v17.test.ts
git commit -m "feat(charter): add phase1 charter storage and preference memory"
```

## Task 2: Make AI Requests Charter-Aware

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`
- Modify: `src/lib/hooks/use-ai-chat.ts`

- [ ] **Step 1: Extend prompt tests to fail on missing charter context**

```ts
import { describe, expect, it } from 'vitest'
import { buildSegmentedSystemPrompt, flattenSystemPrompt } from './prompts'

describe('buildSegmentedSystemPrompt', () => {
  it('includes a project charter block before the world bible block', () => {
    const segments = buildSegmentedSystemPrompt({
      projectCharter: {
        id: 'charter',
        projectId: 'p-1',
        oneLinePremise: '流亡太子重建山河',
        storyPromise: '权谋、征伐、缓慢燃烧的君臣关系',
        themes: ['复国', '忠诚'],
        tone: '冷峻克制',
        targetReader: '喜欢高压权谋的网文读者',
        styleDos: ['少说教', '冲突递进'],
        tabooList: ['现代吐槽腔'],
        positiveReferences: ['史诗感'],
        negativeReferences: ['轻飘玩梗'],
        aiUnderstanding: '故事核心：流亡太子重建山河',
        createdAt: 1,
        updatedAt: 1,
      },
      worldEntries: [],
    })

    expect(segments.projectCharterContext).toContain('【作品宪章】')
    expect(flattenSystemPrompt(segments)).toMatch(/【作品宪章】[\s\S]*【世界观百科】/)
  })
})
```

- [ ] **Step 2: Run the prompt test and confirm it fails**

Run:

```bash
npx vitest run src/lib/ai/prompts.test.ts
```

Expected:

```text
FAIL  Property 'projectCharter' does not exist on type 'BuildSystemPromptParams'
FAIL  Property 'projectCharterContext' does not exist on type 'SegmentedSystemPrompt'
```

- [ ] **Step 3: Add the charter segment and load it inside `useAIChat`**

```ts
// src/lib/ai/prompts.ts (relevant additions)
import type { ProjectCharter } from '../types/project-charter'

export interface BuildSystemPromptParams {
  projectCharter?: ProjectCharter | null
  worldEntries: WorldEntry[]
  selectedText?: string
  rollingSummary?: string
  chapterDraftInstruction?: string
}

export interface SegmentedSystemPrompt {
  baseInstruction: string
  projectCharterContext: string
  worldBibleContext: string
  runtimeContext: string
  chapterDraftContext?: string
}

function buildProjectCharterBlock(charter?: ProjectCharter | null): string {
  if (!charter) return '【作品宪章】\n(尚未填写作品宪章)'
  return [
    '【作品宪章】',
    charter.oneLinePremise && `一句话设定：${charter.oneLinePremise}`,
    charter.storyPromise && `作品承诺：${charter.storyPromise}`,
    charter.tone && `情绪基调：${charter.tone}`,
    charter.targetReader && `目标读者：${charter.targetReader}`,
    charter.themes.length > 0 && `主题：${charter.themes.join(' / ')}`,
    charter.styleDos.length > 0 && `风格偏好：${charter.styleDos.join('；')}`,
    charter.tabooList.length > 0 && `禁忌：${charter.tabooList.join('；')}`,
    charter.aiUnderstanding && `AI 当前理解：${charter.aiUnderstanding}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildSegmentedSystemPrompt(params: BuildSystemPromptParams): SegmentedSystemPrompt {
  return {
    baseInstruction: BASE_INSTRUCTION,
    projectCharterContext: buildProjectCharterBlock(params.projectCharter),
    worldBibleContext: buildWorldBibleBlock(params.worldEntries),
    runtimeContext,
    chapterDraftContext: params.chapterDraftInstruction,
  }
}

export function flattenSystemPrompt(segments: SegmentedSystemPrompt): string {
  return [
    segments.baseInstruction,
    segments.projectCharterContext,
    segments.worldBibleContext,
    segments.runtimeContext,
    segments.chapterDraftContext,
  ]
    .filter(Boolean)
    .join('\n\n')
}
```

```ts
// src/lib/hooks/use-ai-chat.ts (inside sendMessage)
import { getProjectCharter } from '../db/project-charter-queries'

const charter = await getProjectCharter(projectId)

const segmentedSystem = buildSegmentedSystemPrompt({
  projectCharter: charter,
  worldEntries: trimmedEntries,
  selectedText: options?.selectedText,
  rollingSummary: conversation?.rollingSummary,
})
```

- [ ] **Step 4: Re-run the prompt test**

Run:

```bash
npx vitest run src/lib/ai/prompts.test.ts
```

Expected:

```text
PASS  src/lib/ai/prompts.test.ts
```

- [ ] **Step 5: Commit the prompt integration**

```bash
git add src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts src/lib/hooks/use-ai-chat.ts
git commit -m "feat(ai): inject project charter into system prompts"
```

## Task 3: Ship the `作品宪章` Page

**Files:**
- Create: `src/lib/hooks/use-project-charter.ts`
- Create: `src/components/project-charter/project-charter-form.tsx`
- Create: `src/components/project-charter/project-charter-form.test.tsx`
- Create: `src/app/projects/[id]/charter/page.tsx`
- Modify: `src/lib/hooks/use-projects.ts`

- [ ] **Step 1: Write the failing form test**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectCharterForm } from './project-charter-form'

describe('ProjectCharterForm', () => {
  it('submits normalized arrays and saves the charter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <ProjectCharterForm
        initialValue={{
          oneLinePremise: '',
          storyPromise: '',
          themes: [],
          tone: '',
          targetReader: '',
          styleDos: [],
          tabooList: [],
          positiveReferences: [],
          negativeReferences: [],
          aiUnderstanding: '',
        }}
        onSave={onSave}
      />
    )

    await user.type(screen.getByLabelText('一句话设定'), '流亡太子重返帝京')
    await user.type(screen.getByLabelText('作品承诺'), '权谋与复国并行')
    await user.type(screen.getByLabelText('主题'), '复国, 忠诚')
    await user.click(screen.getByRole('button', { name: '保存宪章' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          oneLinePremise: '流亡太子重返帝京',
          storyPromise: '权谋与复国并行',
          themes: ['复国', '忠诚'],
        })
      )
    })
  })
})
```

- [ ] **Step 2: Run the form test and confirm it fails**

Run:

```bash
npx vitest run src/components/project-charter/project-charter-form.test.tsx
```

Expected:

```text
FAIL  Cannot find module './project-charter-form'
```

- [ ] **Step 3: Implement the hook, form, route, and creation seeding**

```ts
// src/lib/hooks/use-project-charter.ts
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getProjectCharter, saveProjectCharter } from '../db/project-charter-queries'
import type { ProjectCharter } from '../types/project-charter'

export function useProjectCharter(projectId: string) {
  const charter = useLiveQuery(() => getProjectCharter(projectId), [projectId], null)

  return {
    charter,
    loading: charter === null,
    save: (patch: Partial<ProjectCharter>) => saveProjectCharter(projectId, patch),
  }
}
```

```tsx
// src/components/project-charter/project-charter-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectCharter } from '@/lib/types/project-charter'

function splitList(value: string): string[] {
  return value
    .split(/[,\n，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function ProjectCharterForm({
  initialValue,
  onSave,
}: {
  initialValue: Pick<ProjectCharter, 'oneLinePremise' | 'storyPromise' | 'themes' | 'tone' | 'targetReader' | 'styleDos' | 'tabooList' | 'positiveReferences' | 'negativeReferences' | 'aiUnderstanding'>
  onSave: (patch: Partial<ProjectCharter>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    oneLinePremise: initialValue.oneLinePremise,
    storyPromise: initialValue.storyPromise,
    themes: initialValue.themes.join(', '),
    tone: initialValue.tone,
    targetReader: initialValue.targetReader,
    styleDos: initialValue.styleDos.join(', '),
    tabooList: initialValue.tabooList.join(', '),
    positiveReferences: initialValue.positiveReferences.join(', '),
    negativeReferences: initialValue.negativeReferences.join(', '),
  })

  const submit = async () => {
    setSaving(true)
    try {
      await onSave({
        oneLinePremise: form.oneLinePremise.trim(),
        storyPromise: form.storyPromise.trim(),
        themes: splitList(form.themes),
        tone: form.tone.trim(),
        targetReader: form.targetReader.trim(),
        styleDos: splitList(form.styleDos),
        tabooList: splitList(form.tabooList),
        positiveReferences: splitList(form.positiveReferences),
        negativeReferences: splitList(form.negativeReferences),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-[34px] text-foreground">作品宪章</h1>
        <p className="text-[14px] text-muted-foreground">先定义这本书，再让 AI 参与这本书。</p>
      </header>

      <section className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="premise">一句话设定</Label>
          <Input id="premise" aria-label="一句话设定" value={form.oneLinePremise} onChange={e => setForm(prev => ({ ...prev, oneLinePremise: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promise">作品承诺</Label>
          <Textarea id="promise" aria-label="作品承诺" rows={3} value={form.storyPromise} onChange={e => setForm(prev => ({ ...prev, storyPromise: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="themes">主题</Label>
          <Input id="themes" aria-label="主题" value={form.themes} onChange={e => setForm(prev => ({ ...prev, themes: e.target.value }))} />
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving}>
          {saving ? '保存中...' : '保存宪章'}
        </Button>
      </div>
    </div>
  )
}
```

```tsx
// src/app/projects/[id]/charter/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { ProjectCharterForm } from '@/components/project-charter/project-charter-form'
import { useProjectCharter } from '@/lib/hooks/use-project-charter'

export default function ProjectCharterPage() {
  const params = useParams<{ id: string }>()
  const { charter, loading, save } = useProjectCharter(params.id)

  if (loading || !charter) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">加载作品宪章...</div>
  }

  return <ProjectCharterForm initialValue={charter} onSave={save} />
}
```

```ts
// src/lib/hooks/use-projects.ts (inside createProject)
import { saveProjectCharter } from '../db/project-charter-queries'

await createProjectDB(id).projects.put(project)
await saveProjectCharter(id, {})
```

- [ ] **Step 4: Re-run the charter UI test**

Run:

```bash
npx vitest run src/components/project-charter/project-charter-form.test.tsx
```

Expected:

```text
PASS  src/components/project-charter/project-charter-form.test.tsx
```

- [ ] **Step 5: Commit the charter page**

```bash
git add src/lib/hooks/use-project-charter.ts src/components/project-charter/project-charter-form.tsx src/components/project-charter/project-charter-form.test.tsx src/app/projects/[id]/charter/page.tsx src/lib/hooks/use-projects.ts
git commit -m "feat(charter): add project charter authoring flow"
```

## Task 4: Persist Rejected AI Output as Preference Memory

**Files:**
- Create: `src/components/workspace/preference-feedback-dialog.tsx`
- Create: `src/components/workspace/preference-feedback-dialog.test.tsx`
- Modify: `src/components/workspace/draft-card.tsx`
- Modify: `src/components/workspace/message-bubble.tsx`
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`

- [ ] **Step 1: Write the failing feedback dialog test**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PreferenceFeedbackDialog } from './preference-feedback-dialog'

describe('PreferenceFeedbackDialog', () => {
  it('submits a category and note', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <PreferenceFeedbackDialog
        open={true}
        onClose={() => {}}
        onSubmit={onSubmit}
      />
    )

    await user.click(screen.getByLabelText('人物不对味'))
    await user.type(screen.getByLabelText('具体偏差'), '主角说话太轻浮')
    await user.click(screen.getByRole('button', { name: '记录偏差' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        category: 'character',
        note: '主角说话太轻浮',
      })
    })
  })
})
```

- [ ] **Step 2: Run the feedback dialog test and confirm it fails**

Run:

```bash
npx vitest run src/components/workspace/preference-feedback-dialog.test.tsx
```

Expected:

```text
FAIL  Cannot find module './preference-feedback-dialog'
```

- [ ] **Step 3: Implement the reusable feedback dialog and wire it into assistant outputs**

```tsx
// src/components/workspace/preference-feedback-dialog.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const OPTIONS = [
  { value: 'voice', label: '语言不对味' },
  { value: 'character', label: '人物不对味' },
  { value: 'plot', label: '情节不对味' },
  { value: 'worldbuilding', label: '设定不对味' },
  { value: 'other', label: '其他偏差' },
] as const

export function PreferenceFeedbackDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { category: 'voice' | 'character' | 'plot' | 'worldbuilding' | 'other'; note: string }) => Promise<void>
}) {
  const [category, setCategory] = useState<'voice' | 'character' | 'plot' | 'worldbuilding' | 'other'>('voice')
  const [note, setNote] = useState('')

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">记录这次偏差</DialogTitle>
        </DialogHeader>
        <fieldset className="space-y-2">
          {OPTIONS.map(option => (
            <label key={option.value} className="flex items-center gap-2 text-[13px]">
              <input
                aria-label={option.label}
                type="radio"
                checked={category === option.value}
                onChange={() => setCategory(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
        <div className="space-y-1">
          <Label htmlFor="feedback-note">具体偏差</Label>
          <textarea
            id="feedback-note"
            aria-label="具体偏差"
            rows={4}
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 500))}
            className="w-full rounded-md surface-2 border border-[hsl(var(--line))] px-2.5 py-1.5 text-[13px]"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={() => onSubmit({ category, note: note.trim() })}>记录偏差</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

```tsx
// src/components/workspace/message-bubble.tsx (assistant branch additions)
import { recordPreferenceMemory } from '@/lib/db/project-charter-queries'
import { PreferenceFeedbackDialog } from './preference-feedback-dialog'

const [feedbackOpen, setFeedbackOpen] = useState(false)

const handleRecordFeedback = async (payload: { category: 'voice' | 'character' | 'plot' | 'worldbuilding' | 'other'; note: string }) => {
  await recordPreferenceMemory(projectId, {
    source: 'chat',
    messageId: message.id,
    verdict: 'reject',
    category: payload.category,
    note: payload.note,
  })
  setFeedbackOpen(false)
}

<button
  onClick={() => setFeedbackOpen(true)}
  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
>
  记录偏差
</button>

<PreferenceFeedbackDialog
  open={feedbackOpen}
  onClose={() => setFeedbackOpen(false)}
  onSubmit={handleRecordFeedback}
/>
```

```tsx
// src/components/workspace/draft-card.tsx (inside handleReject)
import { recordPreferenceMemory } from '@/lib/db/project-charter-queries'

await recordPreferenceMemory(projectId, {
  source: 'draft',
  messageId,
  verdict: 'reject',
  category: reason === 'conflict' ? 'worldbuilding' : 'other',
  note: note?.trim() || '用户拒绝采纳章节草稿',
})
```

- [ ] **Step 4: Re-run the new dialog test and the existing draft card test**

Run:

```bash
npx vitest run src/components/workspace/preference-feedback-dialog.test.tsx src/components/workspace/draft-card.test.tsx
```

Expected:

```text
PASS  src/components/workspace/preference-feedback-dialog.test.tsx
PASS  src/components/workspace/draft-card.test.tsx
```

- [ ] **Step 5: Commit the feedback memory flow**

```bash
git add src/components/workspace/preference-feedback-dialog.tsx src/components/workspace/preference-feedback-dialog.test.tsx src/components/workspace/draft-card.tsx src/components/workspace/message-bubble.tsx src/components/workspace/ai-chat-panel/index.tsx
git commit -m "feat(feedback): persist rejected ai output as preference memory"
```

## Task 5: Make Charter-First Workflow Discoverable

**Files:**
- Create: `src/components/workspace/workspace-topbar.test.tsx`
- Modify: `src/components/workspace/workspace-topbar.tsx`
- Modify: `src/components/project/create-project-modal.tsx`

- [ ] **Step 1: Add a failing smoke assertion for the new route behavior**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceTopbar } from './workspace-topbar'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('WorkspaceTopbar', () => {
  it('exposes a charter link in the workspace chrome', () => {
    render(
      <WorkspaceTopbar
        projectId="p-1"
        focusMode={false}
        onToggleFocusMode={() => {}}
        onOpenAIConfig={() => {}}
        onOpenDraftDialog={() => {}}
      />
    )

    expect(screen.getByRole('link', { name: '作品宪章' })).toHaveAttribute('href', '/projects/p-1/charter')
  })
})
```

- [ ] **Step 2: Run the smoke test and confirm it fails**

Run:

```bash
npx vitest run src/components/workspace/workspace-topbar.test.tsx
```

Expected:

```text
FAIL  Unable to find role="link" with name "作品宪章"
```

- [ ] **Step 3: Add the topbar charter entry and send new projects to the charter page first**

```tsx
// src/components/workspace/workspace-topbar.tsx (relevant additions)
import { ScrollText } from 'lucide-react'

<Tooltip>
  <TooltipTrigger asChild>
    <Button asChild variant="ghost" size="icon-sm">
      <Link href={`/projects/${projectId}/charter`} aria-label="作品宪章">
        <ScrollText />
      </Link>
    </Button>
  </TooltipTrigger>
  <TooltipContent>作品宪章</TooltipContent>
</Tooltip>
```

```tsx
// src/components/project/create-project-modal.tsx (inside handleFormSubmit)
requestAnimationFrame(() => {
  router.push(`/projects/${id}/charter`)
})
```

- [ ] **Step 4: Re-run the topbar smoke test**

Run:

```bash
npx vitest run src/components/workspace/workspace-topbar.test.tsx
```

Expected:

```text
PASS  src/components/workspace/workspace-topbar.test.tsx
```

- [ ] **Step 5: Commit the workflow entry points**

```bash
git add src/components/workspace/workspace-topbar.tsx src/components/project/create-project-modal.tsx src/components/workspace/workspace-topbar.test.tsx
git commit -m "feat(workflow): make charter the first stop for new projects"
```

## Final Verification

- [ ] **Step 1: Run focused regression tests**

```bash
npx vitest run src/lib/db/project-charter-queries.test.ts src/lib/db/project-db.migration-v17.test.ts src/lib/ai/prompts.test.ts src/components/project-charter/project-charter-form.test.tsx src/components/workspace/preference-feedback-dialog.test.tsx src/components/workspace/draft-card.test.tsx src/components/workspace/workspace-topbar.test.tsx
```

Expected:

```text
All targeted Phase 1 tests PASS
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
git commit -m "test(charter): verify phase1 charter workflow"
```

## Self-Review

### Spec coverage

- `作品宪章页面` -> Task 3
- `所有 AI 调用统一接入作品宪章上下文` -> Task 2
- `用户否决记录与偏好回写` -> Task 4
- `首发转向版本必须可发布` -> Task 5 + Final Verification

### Intentional omissions

- `故事圣经升级` intentionally deferred to a future Phase 2 plan
- `卷纲 / 章纲 / 场景卡` intentionally deferred to a future Phase 3 plan
- `长篇驾驶舱` intentionally deferred to a future Phase 5 plan

### Placeholder scan

Completed manually before handoff: no placeholder markers, deferred-code markers, or task-shortcut references remain in this plan.
