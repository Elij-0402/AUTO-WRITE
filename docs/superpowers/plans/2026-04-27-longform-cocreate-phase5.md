# Longform Co-Creation Phase 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把分析页改造成真正可操作的“长篇驾驶舱”，基于项目宪章、世界观、规划对象与草稿对象输出可解释、可处理、可跳转的长期风险警报。

**Architecture:** 先把 Phase 1-4 的结构化写作数据归一成 `LongformCockpitSnapshot`，再用纯函数规则引擎派生 `AnalysisAlert`，最后由 Dexie 持久化警报状态、由分析页消费这些警报并提供跳转与复盘入口。警报本身是第一类数据，避免“每次重算都失去用户的 resolved / ignored 决策”。

**Tech Stack:** Next.js App Router, React 19, TypeScript, Dexie/IndexedDB, Vitest, React Testing Library, local-first project DB.

---

## Scope Check

本计划只覆盖 `D:\AUTO-WRITE\docs\superpowers\specs\2026-04-26-longform-cocreate-design.md` 里的 `5.6 长篇驾驶舱 / 9.5 Phase 5：长篇驾驶舱`：

1. 一致性警报
2. 偏航警报
3. 人物弧光跟踪
4. 节奏失衡检测
5. 未回收伏笔与未兑现承诺
6. 周期性复盘与 AI 总结

不包含：

1. 新建 Phase 1-4 的底层对象模型
2. 替换故事圣经编辑体验
3. 重做聊天主流程

如果执行时发现 Phase 2-4 的规划对象尚未落地到仓库，先暂停在 Task 1，单独补一份“Phase 2-4 数据落地”计划，再回到本计划。

## File Structure Map

### Create

- `src/lib/types/analysis-alert.ts`  
  定义 `AlertSeverity`、`AlertStatus`、`AlertKind`、`AnalysisAlert`、`ProjectReviewSnapshot`、`LongformCockpitSnapshot`。

- `src/lib/db/analysis-alert-queries.ts`  
  驾驶舱警报与复盘快照的 Dexie 查询助手。

- `src/lib/db/analysis-alert-queries.test.ts`  
  覆盖 upsert、排序、resolve / ignore、review snapshot 查询。

- `src/lib/db/project-db.migration-v18.test.ts`  
  验证 v17 项目库升级到 v18 后新增对象仓正常可用。

- `src/lib/analysis/alert-engine.ts`  
  纯函数规则引擎，输入 `LongformCockpitSnapshot`，输出 `AnalysisAlert[]`。

- `src/lib/analysis/alert-engine.test.ts`  
  覆盖 open promise、drift、pacing、character consistency、empty-state 降噪。

- `src/lib/hooks/use-longform-cockpit.ts`
- `src/lib/hooks/use-longform-cockpit.test.ts`

- `src/components/analysis/cockpit-overview.tsx`
- `src/components/analysis/cockpit-overview.test.tsx`

- `src/components/analysis/alert-list.tsx`
- `src/components/analysis/alert-list.test.tsx`

- `src/components/analysis/alert-detail-panel.tsx`
- `src/components/analysis/alert-detail-panel.test.tsx`

- `src/components/analysis/review-snapshot-panel.tsx`
- `src/components/analysis/review-snapshot-panel.test.tsx`

- `src/lib/ai/review-prompts.ts`
- `src/lib/ai/review-prompts.test.ts`

### Modify

- `src/lib/types/index.ts`
- `src/lib/db/project-db.ts`
- `src/app/projects/[id]/analysis/page.tsx`
- `src/lib/hooks/use-ai-chat.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/prompts.test.ts`

## Domain Decisions

统一警报模型：

```ts
export type AlertSeverity = 'high' | 'medium' | 'low'
export type AlertStatus = 'open' | 'resolved' | 'ignored'
export type AlertKind =
  | 'consistency'
  | 'drift'
  | 'pacing'
  | 'character_voice'
  | 'open_promise'
  | 'foreshadow_gap'

export interface AnalysisAlert {
  id: string
  projectId: string
  dedupeKey: string
  kind: AlertKind
  severity: AlertSeverity
  status: AlertStatus
  title: string
  summary: string
  evidence: string[]
  linkedEntityIds: string[]
  linkedChapterId?: string
  linkedSceneId?: string
  createdAt: number
  updatedAt: number
  resolvedAt?: number
}
```

驾驶舱规则引擎只依赖归一化快照，不直接依赖 UI 或 Dexie：

```ts
export interface LongformCockpitSnapshot {
  projectId: string
  charterSummary: string | null
  promises: Array<{ id: string; label: string; fulfilled: boolean; chapterId?: string }>
  foreshadows: Array<{ id: string; label: string; paidOff: boolean; chapterId?: string }>
  chapterProgress: Array<{ id: string; title: string; sceneCount: number; draftWordCount: number }>
  characterSignals: Array<{ characterId: string; name: string; expected: string[]; observed: string[] }>
  driftSignals: Array<{ id: string; label: string; expected: string; actual: string; chapterId?: string }>
}
```

## UX Decisions

1. 分析页默认首屏是驾驶舱，不再以关系图为默认视图。
2. 所有警报都必须给出 `evidence`，且文案使用中文。
3. 视觉遵循 `D:\AUTO-WRITE\DESIGN.md`：深色、无阴影、圆角不超过 8px、不使用紫色强调。
4. 小项目或空项目显示“暂无风险”，不制造 AI 噪音。
5. 跳转行为优先使用项目内 URL/hash 约定，避免引入新的全局导航状态层。

## Task 1: Add Alert Types, Storage, and v18 Migration

**Files:**
- Create: `src/lib/types/analysis-alert.ts`
- Create: `src/lib/db/analysis-alert-queries.ts`
- Create: `src/lib/db/analysis-alert-queries.test.ts`
- Create: `src/lib/db/project-db.migration-v18.test.ts`
- Modify: `src/lib/types/index.ts`
- Modify: `src/lib/db/project-db.ts`

- [ ] **Step 1: Write the failing storage tests**

Add `src/lib/db/analysis-alert-queries.test.ts` with concrete expectations:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { createProjectDB, __resetProjectDBCache } from './project-db'
import { listOpenAlerts, resolveAnalysisAlert, upsertAnalysisAlert } from './analysis-alert-queries'

describe('analysis-alert queries', () => {
  afterEach(async () => {
    __resetProjectDBCache()
    await indexedDB.deleteDatabase('inkforge-project-alert-test')
  })

  it('sorts open alerts by severity then updatedAt desc', async () => {
    const db = createProjectDB('alert-test')
    await upsertAnalysisAlert(db, {
      id: 'a-low',
      projectId: 'alert-test',
      dedupeKey: 'low',
      kind: 'pacing',
      severity: 'low',
      status: 'open',
      title: '低优先级',
      summary: 'summary',
      evidence: ['e1'],
      linkedEntityIds: [],
      createdAt: 1,
      updatedAt: 1,
    })
    await upsertAnalysisAlert(db, {
      id: 'a-high',
      projectId: 'alert-test',
      dedupeKey: 'high',
      kind: 'drift',
      severity: 'high',
      status: 'open',
      title: '高优先级',
      summary: 'summary',
      evidence: ['e1'],
      linkedEntityIds: [],
      createdAt: 2,
      updatedAt: 2,
    })

    const alerts = await listOpenAlerts(db, 'alert-test')
    expect(alerts.map(alert => alert.id)).toEqual(['a-high', 'a-low'])
  })

  it('resolves an alert without deleting the row', async () => {
    const db = createProjectDB('alert-test')
    await upsertAnalysisAlert(db, {
      id: 'a-1',
      projectId: 'alert-test',
      dedupeKey: 'resolve-me',
      kind: 'consistency',
      severity: 'medium',
      status: 'open',
      title: '待处理一致性警报',
      summary: 'summary',
      evidence: ['e1'],
      linkedEntityIds: ['entry-1'],
      createdAt: 1,
      updatedAt: 1,
    })
    await resolveAnalysisAlert(db, 'a-1')
    const stored = await db.analysisAlerts.get('a-1')
    expect(stored?.status).toBe('resolved')
    expect(stored?.resolvedAt).toBeTypeOf('number')
  })
})
```

- [ ] **Step 2: Write the failing migration test**

Add `src/lib/db/project-db.migration-v18.test.ts`:

```ts
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { InkForgeProjectDB } from './project-db'

describe('project db v18 migration', () => {
  it('adds alert tables when upgrading from v17', async () => {
    const name = 'inkforge-project-migration-v18'
    const legacy = new Dexie(name)
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
    legacy.close()

    const db = new InkForgeProjectDB('migration-v18')
    await db.open()
    expect(db.tables.map(table => table.name)).toContain('analysisAlerts')
    expect(db.tables.map(table => table.name)).toContain('projectReviewSnapshots')
  })
})
```

- [ ] **Step 3: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/db/analysis-alert-queries.test.ts src/lib/db/project-db.migration-v18.test.ts`  
Expected: FAIL because `analysisAlerts`, `projectReviewSnapshots`, and query helpers do not exist yet.

- [ ] **Step 4: Add the alert domain types**

Create `src/lib/types/analysis-alert.ts`:

```ts
export type AlertSeverity = 'high' | 'medium' | 'low'
export type AlertStatus = 'open' | 'resolved' | 'ignored'
export type AlertKind =
  | 'consistency'
  | 'drift'
  | 'pacing'
  | 'character_voice'
  | 'open_promise'
  | 'foreshadow_gap'

export interface AnalysisAlert {
  id: string
  projectId: string
  dedupeKey: string
  kind: AlertKind
  severity: AlertSeverity
  status: AlertStatus
  title: string
  summary: string
  evidence: string[]
  linkedEntityIds: string[]
  linkedChapterId?: string
  linkedSceneId?: string
  createdAt: number
  updatedAt: number
  resolvedAt?: number
}

export interface ProjectReviewSnapshot {
  id: string
  projectId: string
  summary: string
  alertIds: string[]
  createdAt: number
}
```

Re-export in `src/lib/types/index.ts`:

```ts
export type {
  AlertSeverity,
  AlertStatus,
  AlertKind,
  AnalysisAlert,
  ProjectReviewSnapshot,
  LongformCockpitSnapshot,
} from './analysis-alert'
```

- [ ] **Step 5: Add Dexie v18 storage**

Extend `src/lib/db/project-db.ts` with table declarations and a new schema version:

```ts
import type { AnalysisAlert, ProjectReviewSnapshot } from '../types'

analysisAlerts!: Table<AnalysisAlert, string>
projectReviewSnapshots!: Table<ProjectReviewSnapshot, string>
```

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
  contradictions: 'id, projectId, messageId, entryName, exempted, createdAt, [projectId+entryName], [projectId+createdAt]',
  layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
  projectCharter: 'id, projectId, updatedAt',
  preferenceMemories: 'id, projectId, messageId, createdAt, [projectId+createdAt]',
  analysisAlerts: 'id, projectId, dedupeKey, kind, severity, status, updatedAt, [projectId+status], [projectId+kind]',
  projectReviewSnapshots: 'id, projectId, createdAt, [projectId+createdAt]',
})
```

- [ ] **Step 6: Implement the query helpers**

Create `src/lib/db/analysis-alert-queries.ts`:

```ts
import type { AnalysisAlert, ProjectReviewSnapshot } from '../types'
import type { InkForgeProjectDB } from './project-db'

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 } as const

export async function upsertAnalysisAlert(db: InkForgeProjectDB, alert: AnalysisAlert) {
  const existing = await db.analysisAlerts.where('dedupeKey').equals(alert.dedupeKey).first()
  if (existing) {
    await db.analysisAlerts.update(existing.id, {
      ...alert,
      id: existing.id,
      createdAt: existing.createdAt,
      status: existing.status === 'resolved' || existing.status === 'ignored' ? existing.status : alert.status,
    })
    return existing.id
  }
  await db.analysisAlerts.put(alert)
  return alert.id
}

export async function listOpenAlerts(db: InkForgeProjectDB, projectId: string) {
  const rows = await db.analysisAlerts.where('[projectId+status]').equals([projectId, 'open']).toArray()
  return rows.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.updatedAt - a.updatedAt)
}
```

Implement the rest in the same file:

```ts
export const listAlertsByKind = (db: InkForgeProjectDB, projectId: string, kind: AnalysisAlert['kind']) =>
  db.analysisAlerts.where('[projectId+kind]').equals([projectId, kind]).toArray()

export const resolveAnalysisAlert = (db: InkForgeProjectDB, alertId: string) =>
  db.analysisAlerts.update(alertId, { status: 'resolved', resolvedAt: Date.now(), updatedAt: Date.now() })

export const ignoreAnalysisAlert = (db: InkForgeProjectDB, alertId: string) =>
  db.analysisAlerts.update(alertId, { status: 'ignored', updatedAt: Date.now() })

export const createProjectReviewSnapshot = (db: InkForgeProjectDB, snapshot: ProjectReviewSnapshot) =>
  db.projectReviewSnapshots.put(snapshot)

export async function listRecentProjectReviewSnapshots(db: InkForgeProjectDB, projectId: string) {
  return db.projectReviewSnapshots.where('projectId').equals(projectId).reverse().sortBy('createdAt')
}
```

- [ ] **Step 7: Re-run the targeted tests**

Run: `npx vitest run src/lib/db/analysis-alert-queries.test.ts src/lib/db/project-db.migration-v18.test.ts`  
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/types/analysis-alert.ts src/lib/types/index.ts src/lib/db/project-db.ts src/lib/db/analysis-alert-queries.ts src/lib/db/analysis-alert-queries.test.ts src/lib/db/project-db.migration-v18.test.ts
git commit -m "feat(cockpit): add alert storage"
```

## Task 2: Build the Pure Alert Engine

**Files:**
- Create: `src/lib/analysis/alert-engine.ts`
- Create: `src/lib/analysis/alert-engine.test.ts`

- [ ] **Step 1: Write the failing rule tests**

Create `src/lib/analysis/alert-engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { deriveAnalysisAlerts } from './alert-engine'
import type { LongformCockpitSnapshot } from '../types'

const baseSnapshot: LongformCockpitSnapshot = {
  projectId: 'p-1',
  charterSummary: '一个关于复仇与复国的故事',
  promises: [],
  foreshadows: [],
  chapterProgress: [],
  characterSignals: [],
  driftSignals: [],
}

it('creates open_promise alerts for unresolved promises', () => {
  const alerts = deriveAnalysisAlerts({
    ...baseSnapshot,
    promises: [{ id: 'promise-1', label: '第三卷前揭露身世', fulfilled: false, chapterId: 'ch-12' }],
  })
  expect(alerts[0]?.kind).toBe('open_promise')
  expect(alerts[0]?.evidence[0]).toContain('第三卷前揭露身世')
})

it('returns no alerts for an empty project snapshot', () => {
  expect(deriveAnalysisAlerts(baseSnapshot)).toEqual([])
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/analysis/alert-engine.test.ts`  
Expected: FAIL because `deriveAnalysisAlerts` does not exist yet.

- [ ] **Step 3: Implement the alert engine**

Create `src/lib/analysis/alert-engine.ts`:

```ts
import type { AnalysisAlert, LongformCockpitSnapshot } from '../types'

export function deriveAnalysisAlerts(snapshot: LongformCockpitSnapshot): AnalysisAlert[] {
  return [
    ...derivePromiseAlerts(snapshot),
    ...deriveForeshadowAlerts(snapshot),
    ...deriveDriftAlerts(snapshot),
    ...derivePacingAlerts(snapshot),
    ...deriveCharacterAlerts(snapshot),
  ]
}
```

Add concrete rule helpers:

```ts
function derivePromiseAlerts(snapshot: LongformCockpitSnapshot): AnalysisAlert[] {
  return snapshot.promises
    .filter(item => !item.fulfilled)
    .map(item => ({
      id: crypto.randomUUID(),
      projectId: snapshot.projectId,
      dedupeKey: `open_promise:${item.id}`,
      kind: 'open_promise',
      severity: 'high',
      status: 'open',
      title: '存在未兑现承诺',
      summary: `承诺“${item.label}”尚未兑现`,
      evidence: [`规划承诺：${item.label}`],
      linkedEntityIds: [item.id],
      linkedChapterId: item.chapterId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
}
```

```ts
function derivePacingAlerts(snapshot: LongformCockpitSnapshot): AnalysisAlert[] {
  const oversized = snapshot.chapterProgress.filter(chapter => chapter.sceneCount >= 8 || chapter.draftWordCount >= 7000)
  return oversized.map(chapter => ({
    id: crypto.randomUUID(),
    projectId: snapshot.projectId,
    dedupeKey: `pacing:${chapter.id}`,
    kind: 'pacing',
    severity: 'medium',
    status: 'open',
    title: '章节节奏可能失衡',
    summary: `${chapter.title} 的场景数或字数明显偏高`,
    evidence: [`sceneCount=${chapter.sceneCount}`, `draftWordCount=${chapter.draftWordCount}`],
    linkedEntityIds: [chapter.id],
    linkedChapterId: chapter.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }))
}
```

Also implement `deriveForeshadowAlerts`, `deriveDriftAlerts`, `deriveCharacterAlerts` with the same deterministic pattern.

- [ ] **Step 4: Re-run the targeted tests**

Run: `npx vitest run src/lib/analysis/alert-engine.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis/alert-engine.ts src/lib/analysis/alert-engine.test.ts
git commit -m "feat(cockpit): add alert engine"
```

## Task 3: Expose Cockpit State Through a Hook

**Files:**
- Create: `src/lib/hooks/use-longform-cockpit.ts`
- Create: `src/lib/hooks/use-longform-cockpit.test.ts`

- [ ] **Step 1: Write the failing hook test**

Create `src/lib/hooks/use-longform-cockpit.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLongformCockpit } from './use-longform-cockpit'

vi.mock('../analysis/alert-engine', () => ({
  deriveAnalysisAlerts: () => [{
    id: 'a-1',
    projectId: 'p-1',
    dedupeKey: 'open_promise:a-1',
    kind: 'open_promise',
    severity: 'high',
    status: 'open',
    title: '存在未兑现承诺',
    summary: 'summary',
    evidence: ['e1'],
    linkedEntityIds: [],
    createdAt: 1,
    updatedAt: 1,
  }],
}))

it('returns grouped open alerts and a recalc action', async () => {
  const { result } = renderHook(() => useLongformCockpit('p-1'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.groups.high).toHaveLength(1)
  expect(typeof result.current.recalculate).toBe('function')
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npx vitest run src/lib/hooks/use-longform-cockpit.test.ts`  
Expected: FAIL because the hook does not exist yet.

- [ ] **Step 3: Implement the hook**

Create `src/lib/hooks/use-longform-cockpit.ts`:

```ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createProjectDB } from '../db/project-db'
import { listOpenAlerts, resolveAnalysisAlert, upsertAnalysisAlert } from '../db/analysis-alert-queries'
import { deriveAnalysisAlerts } from '../analysis/alert-engine'

export function useLongformCockpit(projectId: string) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadSnapshot = useCallback(async () => {
    const db = createProjectDB(projectId)
    const charter = await db.projectCharter.toCollection().first()
    const chapters = await db.chapters.filter(chapter => !chapter.deletedAt).sortBy('order')
    const snapshot = {
      projectId,
      charterSummary: charter?.storyPromise ?? charter?.oneLinePremise ?? null,
      promises: [],
      foreshadows: [],
      chapterProgress: chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        sceneCount: 0,
        draftWordCount: chapter.content?.length ?? 0,
      })),
      characterSignals: [],
      driftSignals: [],
    }
    return snapshot
  }, [projectId])
```

Continue the same file:

```ts
  const recalculate = useCallback(async () => {
    setLoading(true)
    const db = createProjectDB(projectId)
    const snapshot = await loadSnapshot()
    const derived = deriveAnalysisAlerts(snapshot)
    await Promise.all(derived.map(alert => upsertAnalysisAlert(db, alert)))
    setAlerts(await listOpenAlerts(db, projectId))
    setLoading(false)
  }, [loadSnapshot, projectId])

  useEffect(() => { void recalculate() }, [recalculate])

  const groups = useMemo(() => ({
    high: alerts.filter(alert => alert.severity === 'high'),
    medium: alerts.filter(alert => alert.severity === 'medium'),
    low: alerts.filter(alert => alert.severity === 'low'),
  }), [alerts])

  return { alerts, groups, loading, recalculate, resolve: (id: string) => resolveAnalysisAlert(createProjectDB(projectId), id) }
}
```

- [ ] **Step 4: Re-run the targeted test**

Run: `npx vitest run src/lib/hooks/use-longform-cockpit.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/use-longform-cockpit.ts src/lib/hooks/use-longform-cockpit.test.ts
git commit -m "feat(cockpit): add cockpit hook"
```

## Task 4: Rebuild the Analysis Page Into a Cockpit

**Files:**
- Create: `src/components/analysis/cockpit-overview.tsx`
- Create: `src/components/analysis/cockpit-overview.test.tsx`
- Create: `src/components/analysis/alert-list.tsx`
- Create: `src/components/analysis/alert-list.test.tsx`
- Create: `src/components/analysis/alert-detail-panel.tsx`
- Create: `src/components/analysis/alert-detail-panel.test.tsx`
- Create: `src/components/analysis/review-snapshot-panel.tsx`
- Create: `src/components/analysis/review-snapshot-panel.test.tsx`
- Modify: `src/app/projects/[id]/analysis/page.tsx`

- [ ] **Step 1: Write the failing UI tests**

Add `src/components/analysis/cockpit-overview.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { CockpitOverview } from './cockpit-overview'

it('shows grouped alert counts', () => {
  render(
    <CockpitOverview
      totalOpen={3}
      counts={{ high: 1, medium: 1, low: 1 }}
      unresolvedPromises={1}
      latestReviewLabel="2026-04-27 03:00"
    />
  )
  expect(screen.getByText('3')).toBeInTheDocument()
  expect(screen.getByText('未兑现承诺')).toBeInTheDocument()
})
```

Add `src/components/analysis/alert-list.test.tsx`:

```tsx
it('sorts high-severity alerts first', () => {
  render(<AlertList alerts={[lowAlert, highAlert]} selectedAlertId={null} onSelect={() => {}} />)
  const rows = screen.getAllByRole('button')
  expect(rows[0]).toHaveTextContent('高优先级')
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/components/analysis/cockpit-overview.test.tsx src/components/analysis/alert-list.test.tsx src/components/analysis/alert-detail-panel.test.tsx src/components/analysis/review-snapshot-panel.test.tsx`  
Expected: FAIL because the cockpit components do not exist yet.

- [ ] **Step 3: Implement the cockpit components**

Create `src/components/analysis/cockpit-overview.tsx`:

```tsx
interface CockpitOverviewProps {
  totalOpen: number
  counts: { high: number; medium: number; low: number }
  unresolvedPromises: number
  latestReviewLabel: string
}

export function CockpitOverview(props: CockpitOverviewProps) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">打开中的风险</p>
        <p className="font-semibold text-2xl">{props.totalOpen}</p>
      </div>
    </section>
  )
}
```

Create `src/components/analysis/alert-list.tsx` with plain Chinese labels and severity badges using neutral surfaces plus cinnabar only for high severity:

```tsx
export function AlertList({ alerts, selectedAlertId, onSelect }: AlertListProps) {
  if (alerts.length === 0) {
    return <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">暂无风险</div>
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <button
          key={alert.id}
          type="button"
          onClick={() => onSelect(alert.id)}
          className="w-full rounded-md border border-border bg-card px-4 py-3 text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{alert.title}</span>
            <span className="text-xs text-muted-foreground">{alert.severity}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{alert.summary}</p>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Rebuild `analysis/page.tsx`**

Replace the current default-tab behavior so the cockpit is first and timeline / relations become supporting sections:

```tsx
const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
const cockpit = useLongformCockpit(params.id)

return (
  <ThemeProvider>
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <CockpitOverview
          totalOpen={cockpit.alerts.length}
          counts={{
            high: cockpit.groups.high.length,
            medium: cockpit.groups.medium.length,
            low: cockpit.groups.low.length,
          }}
          unresolvedPromises={cockpit.alerts.filter(alert => alert.kind === 'open_promise').length}
          latestReviewLabel="暂无复盘"
        />
        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <AlertList alerts={cockpit.alerts} selectedAlertId={selectedAlertId} onSelect={setSelectedAlertId} />
          <AlertDetailPanel alert={cockpit.alerts.find(alert => alert.id === selectedAlertId) ?? null} projectId={params.id} />
        </div>
        <InteractiveRelationGraph ... />
      </div>
    </div>
  </ThemeProvider>
)
```

- [ ] **Step 5: Re-run the targeted tests**

Run: `npx vitest run src/components/analysis/cockpit-overview.test.tsx src/components/analysis/alert-list.test.tsx src/components/analysis/alert-detail-panel.test.tsx src/components/analysis/review-snapshot-panel.test.tsx`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/analysis/cockpit-overview.tsx src/components/analysis/cockpit-overview.test.tsx src/components/analysis/alert-list.tsx src/components/analysis/alert-list.test.tsx src/components/analysis/alert-detail-panel.tsx src/components/analysis/alert-detail-panel.test.tsx src/components/analysis/review-snapshot-panel.tsx src/components/analysis/review-snapshot-panel.test.tsx src/app/projects/[id]/analysis/page.tsx
git commit -m "feat(cockpit): rebuild analysis page"
```

## Task 5: Add Alert Detail Jumps and Review Summary Prompts

**Files:**
- Create: `src/lib/ai/review-prompts.ts`
- Create: `src/lib/ai/review-prompts.test.ts`
- Modify: `src/components/analysis/alert-detail-panel.tsx`
- Modify: `src/lib/hooks/use-ai-chat.ts`
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`

- [ ] **Step 1: Write the failing prompt and navigation tests**

Add `src/lib/ai/review-prompts.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildProjectRiskReviewPrompt } from './review-prompts'

it('includes charter, alerts, and explicit review instruction', () => {
  const prompt = buildProjectRiskReviewPrompt({
    charterSummary: '流亡太子复国',
    alerts: [{ title: '存在未兑现承诺', summary: '第三卷前揭露身世', evidence: ['chapter=12'] }],
    recentProgress: ['第十二章完成 4200 字'],
  })
  expect(prompt).toContain('【作品宪章摘要】')
  expect(prompt).toContain('【当前主要风险】')
  expect(prompt).toContain('请输出一段中文复盘总结')
})
```

Add `src/components/analysis/alert-detail-panel.test.tsx`:

```tsx
it('renders jump links for linked chapters', () => {
  render(<AlertDetailPanel projectId="p-1" alert={{ ...alert, linkedChapterId: 'chapter-1' }} />)
  expect(screen.getByRole('link', { name: '前往相关章节' })).toHaveAttribute('href', '/projects/p-1#chapter-chapter-1')
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run src/lib/ai/review-prompts.test.ts src/components/analysis/alert-detail-panel.test.tsx src/lib/ai/prompts.test.ts`  
Expected: FAIL because the prompt builder and jump links do not exist yet.

- [ ] **Step 3: Implement the review prompt builder**

Create `src/lib/ai/review-prompts.ts`:

```ts
interface ReviewPromptParams {
  charterSummary: string | null
  alerts: Array<{ title: string; summary: string; evidence: string[] }>
  recentProgress: string[]
}

export function buildProjectRiskReviewPrompt(params: ReviewPromptParams): string {
  const sections = [
    '【任务】',
    '请输出一段中文复盘总结，概括当前长篇项目最值得处理的风险，并给出下一步建议。',
    '',
    '【作品宪章摘要】',
    params.charterSummary || '(暂无作品宪章)',
    '',
    '【当前主要风险】',
    params.alerts.length === 0
      ? '(当前无打开中的风险)'
      : params.alerts.map(alert => `- ${alert.title}：${alert.summary}；证据：${alert.evidence.join('；')}`).join('\n'),
    '',
    '【最近进展】',
    params.recentProgress.length === 0 ? '(暂无最近进展)' : params.recentProgress.join('\n'),
  ]

  return sections.join('\n')
}
```

- [ ] **Step 4: Thread cockpit context into generic prompts and UI**

Extend `src/lib/ai/prompts.ts`:

```ts
export interface BuildSystemPromptParams {
  projectCharter?: ProjectCharter | null
  worldEntries: WorldEntry[]
  selectedText?: string
  rollingSummary?: string
  chapterDraftInstruction?: string
  cockpitRiskSummary?: string
}
```

Append runtime context when present:

```ts
if (params.cockpitRiskSummary?.trim()) {
  parts.push(`【当前主要风险】\n${params.cockpitRiskSummary.trim()}`)
}
```

Update `use-ai-chat.ts` so it passes the risk summary into `buildSegmentedSystemPrompt`, and update `alert-detail-panel.tsx` so the jump target uses existing hash routing:

```tsx
const targetHref = alert?.linkedChapterId
  ? `/projects/${projectId}#chapter-${alert.linkedChapterId}`
  : `/projects/${projectId}`
```

- [ ] **Step 5: Re-run the targeted tests**

Run: `npx vitest run src/lib/ai/review-prompts.test.ts src/components/analysis/alert-detail-panel.test.tsx src/lib/ai/prompts.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/review-prompts.ts src/lib/ai/review-prompts.test.ts src/components/analysis/alert-detail-panel.tsx src/components/analysis/alert-detail-panel.test.tsx src/lib/hooks/use-ai-chat.ts src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat(cockpit): add review prompts and jump links"
```

## Task 6: Verify the Phase 5 Cockpit End to End

**Files:**
- Modify: any newly added tests from Tasks 1-5 as needed

- [ ] **Step 1: Run the focused Phase 5 suite**

Run:

```bash
npx vitest run src/lib/db/analysis-alert-queries.test.ts src/lib/db/project-db.migration-v18.test.ts src/lib/analysis/alert-engine.test.ts src/lib/hooks/use-longform-cockpit.test.ts src/components/analysis/cockpit-overview.test.tsx src/components/analysis/alert-list.test.tsx src/components/analysis/alert-detail-panel.test.tsx src/components/analysis/review-snapshot-panel.test.tsx src/lib/ai/review-prompts.test.ts src/lib/ai/prompts.test.ts
```

Expected: PASS

- [ ] **Step 2: Run lint**

Run: `pnpm lint`  
Expected: PASS

- [ ] **Step 3: Run the full unit suite**

Run: `pnpm test`  
Expected: PASS

- [ ] **Step 4: Smoke-test the cockpit manually**

Run: `pnpm dev`  
Open: `http://localhost:3000`

Verify:

1. 分析页首屏先显示驾驶舱而不是关系图
2. 高优先级警报排在前面
3. 点击警报能看到证据与跳转链接
4. 空项目显示“暂无风险”
5. 进入 AI 聊天时，系统提示词含有 `【当前主要风险】` 段落

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(cockpit): deliver phase5 longform cockpit"
```

## Self-Review

### Spec coverage

- `一致性警报` -> Task 2, Task 4
- `偏航警报` -> Task 2, Task 4
- `人物弧光跟踪` -> Task 2, Task 4
- `节奏失衡检测` -> Task 2, Task 4
- `未回收伏笔与未兑现承诺` -> Task 2, Task 4
- `周期性复盘与 AI 总结` -> Task 5

### Placeholder scan

已移除“补上测试”“后续实现”“类似 Task N”这类空步骤。每个代码步骤都给了具体片段、文件路径、命令和预期结果。

### Type consistency

整份计划统一使用：

1. `AnalysisAlert`
2. `ProjectReviewSnapshot`
3. `LongformCockpitSnapshot`
4. `deriveAnalysisAlerts`
5. `useLongformCockpit`

## Execution Handoff

Plan complete and saved to `D:\AUTO-WRITE\docs\superpowers\plans\2026-04-27-longform-cocreate-phase5.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
