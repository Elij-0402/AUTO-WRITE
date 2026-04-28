# Stability Audit And Performance Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reproducible stability baseline for InkForge, rank the real failures in the core writing workflow plus data/sync layers, and land bounded fixes with regression coverage.

**Architecture:** This phase is evidence-driven. Work starts by creating an audit ledger, running baseline checks, and mapping failures to one of five ownership zones: workspace entry/layout, chapter editing/autosave, AI chat, project DB/migrations, and sync. Each confirmed issue then follows the same loop: reproduce, write or tighten a failing test, implement the smallest fix in the owning module, rerun targeted checks, and record the outcome.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Playwright, Dexie, idb, Supabase client, pnpm

---

## File Map

**Create**
- `docs/superpowers/audits/2026-04-28-stability-audit-log.md` - Baseline results, issue ledger, severity, remediation decisions, and final verification notes

**Modify during audit/remediation as evidence requires**
- `tests/e2e/project-workflow.spec.ts` - Core workflow regression coverage
- `src/app/projects/[id]/page.tsx` - Project workspace entry, panel wiring, editor shell behavior
- `src/lib/hooks/use-workspace-layout.ts` - Workspace state initialization and tab/chapter selection
- `src/lib/hooks/use-chapter-editor.ts` - Chapter content loading, editor state updates, and persistence triggers
- `src/lib/hooks/use-autosave.ts` - Debounce, blur/unmount save behavior, save-state correctness
- `src/lib/hooks/use-ai-chat.ts` - AI chat request lifecycle, state isolation, error handling, summarization side effects
- `src/components/workspace/ai-chat-panel/index.tsx` and related tests - User-facing chat error and recovery behavior
- `src/lib/db/project-db.ts` - IndexedDB schema and migrations
- `src/lib/db/project-db.test.ts`
- `src/lib/db/project-db.migration-v17.test.ts`
- `src/lib/db/project-db.migration-v18.test.ts`
- `src/lib/db/project-db.migration-v19.test.ts`
- `src/lib/sync/sync-queue.ts`
- `src/lib/sync/sync-queue.test.ts`
- `src/lib/sync/sync-engine.ts`
- `src/lib/sync/field-mapping.test.ts`

**Read first when triaging**
- `package.json`
- `README.md`
- `DESIGN.md`
- `src/lib/db/meta-db.ts`
- `src/components/editor/editor.tsx`
- `src/components/workspace/layouts/normal-layout.tsx`

### Task 1: Create The Audit Ledger

**Files:**
- Create: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`
- Modify: `docs/superpowers/plans/2026-04-28-stability-audit-and-performance-hardening.md`

- [ ] **Step 1: Create the audit log file**

```markdown
# InkForge Stability Audit Log

Date: 2026-04-28
Plan: `docs/superpowers/plans/2026-04-28-stability-audit-and-performance-hardening.md`

## Baseline Commands

| Command | Status | Notes |
| --- | --- | --- |
| `pnpm lint` | pending |  |
| `pnpm test` | pending |  |
| `pnpm build` | pending |  |
| `pnpm test:e2e -- tests/e2e/project-workflow.spec.ts` | pending |  |

## Issue Ledger

| ID | Severity | Area | Evidence | Owner Files | Fix Decision | Verification |
| --- | --- | --- | --- | --- | --- | --- |

## Deferred

| ID | Reason | Follow-up |
| --- | --- | --- |

## Final Verification

| Command | Result | Notes |
| --- | --- | --- |
```

- [ ] **Step 2: Verify the file exists**

Run: `Test-Path .\docs\superpowers\audits\2026-04-28-stability-audit-log.md`
Expected: `True`

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/audits/2026-04-28-stability-audit-log.md docs/superpowers/plans/2026-04-28-stability-audit-and-performance-hardening.md
git commit -m "docs(audit): scaffold stability audit log"
```

### Task 2: Capture The Repository Baseline

**Files:**
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Run lint baseline**

Run: `pnpm lint`
Expected: exit `0`, or a deterministic failure list that can be copied into the `Baseline Commands` table

- [ ] **Step 2: Record lint outcome in the audit log**

```markdown
| `pnpm lint` | fail | `src/app/projects/[id]/page.tsx`: placeholder copy violates design token policy |
```

- [ ] **Step 3: Run unit/component baseline**

Run: `pnpm test`
Expected: exit `0`, or a deterministic list of failing suites and flaky suites

- [ ] **Step 4: Record test outcome in the audit log**

```markdown
| `pnpm test` | fail | `src/lib/hooks/use-autosave.test.ts`: unmount save race; `src/lib/sync/sync-queue.test.ts`: retry state mismatch |
```

- [ ] **Step 5: Run production build baseline**

Run: `pnpm build`
Expected: exit `0`, or a deterministic build error with file ownership

- [ ] **Step 6: Record build outcome in the audit log**

```markdown
| `pnpm build` | pass | no production build blocker |
```

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "docs(audit): record lint test and build baseline"
```

### Task 3: Validate The Core Workflow End-To-End

**Files:**
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`
- Test: `tests/e2e/project-workflow.spec.ts`

- [ ] **Step 1: Run the targeted workflow suite**

Run: `pnpm test:e2e -- tests/e2e/project-workflow.spec.ts`
Expected: deterministic pass/fail coverage for project creation, chapter save/reload, navigation, world entries, and chat input

- [ ] **Step 2: Record workflow failures in the issue ledger**

```markdown
| WF-001 | P0 | workspace-entry | `tests/e2e/project-workflow.spec.ts` scenario `2.2 左侧导航可切换` fails after tab switch | `src/app/projects/[id]/page.tsx`, `src/lib/hooks/use-workspace-layout.ts` | investigate | pending |
| WF-002 | P1 | chapter-persistence | `tests/e2e/project-workflow.spec.ts` scenario `1. 创建项目 + 创建章节 + 编辑器保存，刷新后仍在` fails on reload | `src/lib/hooks/use-chapter-editor.ts`, `src/lib/hooks/use-autosave.ts` | investigate | pending |
```

- [ ] **Step 3: If the e2e suite is noisy in dev mode, rerun the single failing scenario**

Run: `pnpm test:e2e -- --grep "左侧导航可切换|编辑器保存，刷新后仍在"`
Expected: the failure reproduces with the same signature before any fix is attempted

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "docs(audit): add workflow baseline findings"
```

### Task 4: Triage Failures Into Ownership Zones

**Files:**
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`
- Read: `src/app/projects/[id]/page.tsx`
- Read: `src/lib/hooks/use-autosave.ts`
- Read: `src/lib/hooks/use-ai-chat.ts`
- Read: `src/lib/db/project-db.ts`
- Read: `src/lib/sync/sync-engine.ts`

- [ ] **Step 1: Add an ownership section to the audit log**

```markdown
## Ownership Zones

- `workspace-entry`: `src/app/projects/[id]/page.tsx`, `src/lib/hooks/use-workspace-layout.ts`
- `chapter-editing`: `src/lib/hooks/use-chapter-editor.ts`, `src/components/editor/editor.tsx`
- `autosave-persistence`: `src/lib/hooks/use-autosave.ts`, `src/lib/db/chapter-queries.ts`, `src/lib/db/revisions.ts`
- `ai-chat`: `src/lib/hooks/use-ai-chat.ts`, `src/components/workspace/ai-chat-panel/index.tsx`
- `db-migrations`: `src/lib/db/project-db.ts`, `src/lib/db/project-db*.test.ts`
- `sync`: `src/lib/sync/sync-queue.ts`, `src/lib/sync/sync-engine.ts`
```

- [ ] **Step 2: For each baseline failure, assign one primary owner area**

```markdown
| WF-002 | P1 | autosave-persistence | reload lost latest content after editor change | `src/lib/hooks/use-autosave.ts`, `src/lib/hooks/use-chapter-editor.ts` | promote to fix queue | pending |
```

- [ ] **Step 3: Move non-reproducible items to observation status**

```markdown
| OBS-001 | P3 | ai-chat | one-off timeout during Playwright run did not reproduce on rerun | `tests/e2e/project-workflow.spec.ts` | defer until reproduced | n/a |
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "docs(audit): map failures to ownership zones"
```

### Task 5: Repair Workspace Entry And Navigation Breakers

**Files:**
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/lib/hooks/use-workspace-layout.ts`
- Test: `tests/e2e/project-workflow.spec.ts`
- Test: `src/lib/hooks/use-sidebar-nav.test.tsx`
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Reproduce the workspace/navigation failure with the narrowest test**

Run: `pnpm test:e2e -- --grep "左侧导航可切换|项目页支持直接访问"`
Expected: one deterministic failure tied to project entry, deep link, or sidebar switching

- [ ] **Step 2: Add or tighten the failing assertion before changing runtime code**

```ts
test('2.2 左侧导航可切换，大纲/世界观/规划都能进入', async ({ page }) => {
  await page.getByRole('button', { name: '世界观' }).click()
  await expect(page.getByPlaceholder('搜索世界观...')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: '规划' }).click()
  await expect(page.getByText('灵感').first()).toBeVisible({ timeout: 10000 })
})
```

- [ ] **Step 3: Implement the smallest fix in the owning layout state**

```ts
const mainContent = layout.activeTab === 'outline' && layout.activeOutlineId ? (
  <OutlineEditForm
    projectId={params.id}
    chapterId={layout.activeOutlineId}
    onPrevious={layout.handleOutlinePrevious}
    onNext={layout.handleOutlineNext}
    hasPrevious={layout.hasPrevious}
    hasNext={layout.hasNext}
  />
) : layout.activeTab === 'world' && layout.activeWorldEntryId ? (
  <WorldEntryEditForm
    projectId={params.id}
    entryId={layout.activeWorldEntryId}
    onPrevious={layout.handleWorldPrevious}
    onNext={layout.handleWorldNext}
    hasPrevious={layout.hasWorldPrevious}
    hasNext={layout.hasWorldNext}
    onSelectEntry={layout.handleSelectWorldEntry}
    allEntries={layout.entries || []}
  />
) : layout.activeTab === 'planning' ? (
  <PlanningWorkbench
    projectId={params.id}
    selection={layout.activePlanningItem}
    onSelectItem={layout.setActivePlanningItem}
    onOpenLinkedChapter={(chapterId) => {
      layout.handleTabChange('chapters')
      layout.setActivePlanningItem(null)
      layout.setActiveChapterId(chapterId)
    }}
  />
) : layout.activeChapterId ? (
  <EditorWithStatus
    projectId={params.id}
    chapterId={layout.activeChapterId}
    chapter={layout.currentChapter}
    chapterNumber={layout.currentChapterNumber}
    editorRef={editorRef}
    editorContentRef={editorContentRef}
    onDiscuss={handleDiscuss}
  />
) : (
  <Placeholder activeTab={layout.activeTab} />
)
```

- [ ] **Step 4: Rerun targeted coverage**

Run: `pnpm test:e2e -- --grep "左侧导航可切换|项目页支持直接访问"`
Expected: PASS

- [ ] **Step 5: Record the fix**

```markdown
| WF-001 | P0 | workspace-entry | sidebar navigation stopped switching views | `src/app/projects/[id]/page.tsx`, `src/lib/hooks/use-workspace-layout.ts` | fixed | targeted Playwright pass |
```

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/project-workflow.spec.ts src/app/projects/[id]/page.tsx src/lib/hooks/use-workspace-layout.ts docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "fix(workspace): restore project entry and navigation stability"
```

### Task 6: Repair Chapter Persistence And Autosave Breakers

**Files:**
- Modify: `src/lib/hooks/use-autosave.ts`
- Modify: `src/lib/hooks/use-chapter-editor.ts`
- Test: `src/lib/hooks/use-autosave.test.ts`
- Test: `src/lib/hooks/use-chapter-editor.test.ts`
- Test: `tests/e2e/project-workflow.spec.ts`
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Reproduce the persistence failure in unit scope first**

Run: `npx vitest run src/lib/hooks/use-autosave.test.ts src/lib/hooks/use-chapter-editor.test.ts`
Expected: a deterministic failure around unmount save, blur save, or chapter switch state

- [ ] **Step 2: Add the failing regression test**

```ts
it('flushes a pending debounced save before unmounting', async () => {
  const saveFn = vi.fn().mockResolvedValue(undefined)
  const { rerender, unmount } = renderHook(
    ({ deps }) => useAutoSave(saveFn, deps, 500),
    { initialProps: { deps: ['draft-1'] } }
  )

  rerender({ deps: ['draft-2'] })
  unmount()

  await waitFor(() => expect(saveFn).toHaveBeenCalledTimes(1))
})
```

- [ ] **Step 3: Implement the smallest persistence fix**

```ts
return () => {
  if (timerRef.current) {
    clearTimeout(timerRef.current)
    timerRef.current = null
  }
  void saveFnRef.current().catch((err) => {
    console.error('Auto-save on unmount failed:', err)
  })
}
```

- [ ] **Step 4: Rerun unit coverage**

Run: `npx vitest run src/lib/hooks/use-autosave.test.ts src/lib/hooks/use-chapter-editor.test.ts`
Expected: PASS

- [ ] **Step 5: Rerun the workflow persistence scenario**

Run: `pnpm test:e2e -- --grep "编辑器保存，刷新后仍在"`
Expected: PASS

- [ ] **Step 6: Record the fix**

```markdown
| WF-002 | P1 | autosave-persistence | latest chapter content was not flushed before reload | `src/lib/hooks/use-autosave.ts`, `src/lib/hooks/use-chapter-editor.ts` | fixed | vitest + Playwright pass |
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/hooks/use-autosave.ts src/lib/hooks/use-chapter-editor.ts src/lib/hooks/use-autosave.test.ts src/lib/hooks/use-chapter-editor.test.ts tests/e2e/project-workflow.spec.ts docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "fix(editor): harden autosave and chapter persistence"
```

### Task 7: Repair AI Chat Isolation And Recovery Breakers

**Files:**
- Modify: `src/lib/hooks/use-ai-chat.ts`
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`
- Test: `src/components/workspace/ai-chat-panel/index.test.tsx`
- Test: `src/lib/hooks/use-ai-config.test.ts`
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Reproduce the failure in targeted chat coverage**

Run: `npx vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/lib/hooks/use-ai-config.test.ts`
Expected: deterministic failure if missing provider config, aborted streams, or stale conversation state break the panel

- [ ] **Step 2: Add the failing regression test**

```tsx
it('renders the chat input without crashing when no API key is configured', () => {
  render(<AIChatPanel projectId="project-1" />)

  expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  expect(screen.getByText('AI 写作伙伴')).toBeInTheDocument()
})
```

- [ ] **Step 3: Implement the smallest state-isolation fix**

```ts
if (!conversationId) {
  return { success: false, needsConfig: true, message: '未选择对话' }
}
if (!config.apiKey) {
  return { success: false, needsConfig: true, message: '还没设置 API 密钥，去设置一下？' }
}
```

- [ ] **Step 4: Rerun targeted chat tests**

Run: `npx vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/lib/hooks/use-ai-config.test.ts`
Expected: PASS

- [ ] **Step 5: Record the fix**

```markdown
| AI-001 | P1 | ai-chat | missing config path surfaced as broken chat flow instead of recoverable message | `src/lib/hooks/use-ai-chat.ts`, `src/components/workspace/ai-chat-panel/index.tsx` | fixed | vitest pass |
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-ai-chat.ts src/components/workspace/ai-chat-panel/index.tsx src/components/workspace/ai-chat-panel/index.test.tsx src/lib/hooks/use-ai-config.test.ts docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "fix(ai-chat): harden config and recovery states"
```

### Task 8: Repair Project DB And Migration Breakers

**Files:**
- Modify: `src/lib/db/project-db.ts`
- Test: `src/lib/db/project-db.test.ts`
- Test: `src/lib/db/project-db.migration-v17.test.ts`
- Test: `src/lib/db/project-db.migration-v18.test.ts`
- Test: `src/lib/db/project-db.migration-v19.test.ts`
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Run migration and DB query coverage**

Run: `npx vitest run src/lib/db/project-db.test.ts src/lib/db/project-db.migration-v17.test.ts src/lib/db/project-db.migration-v18.test.ts src/lib/db/project-db.migration-v19.test.ts`
Expected: deterministic failures if a migration, backfill, or schema assumption is unsafe

- [ ] **Step 2: Add the failing migration regression test**

```ts
it('upgrades a v18 database with planning tables', async () => {
  const projectId = 'migration-v19'
  const dbName = `inkforge-project-${projectId}`
  __resetProjectDBCache()
  await Dexie.delete(dbName)

  const legacy = new Dexie(dbName)
  legacy.version(18).stores({
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
    storyTrackers:
      'id, projectId, kind, status, createdAt, updatedAt, ' +
      '[projectId+kind], [projectId+status]',
  })
  await legacy.open()
  legacy.close()

  const upgraded = new InkForgeProjectDB(projectId)
  await upgraded.open()

  expect(upgraded.tables.some(table => table.name === 'ideaNotes')).toBe(true)
  expect(upgraded.tables.some(table => table.name === 'storyArcs')).toBe(true)
  expect(upgraded.tables.some(table => table.name === 'chapterPlans')).toBe(true)
  expect(upgraded.tables.some(table => table.name === 'sceneCards')).toBe(true)
})
```

- [ ] **Step 3: Implement the smallest schema or backfill fix**

```ts
this.version(19).stores({
  conversations: 'id, projectId, updatedAt',
  aiUsage: 'id, projectId, conversationId, createdAt, model',
  storyTrackers:
    'id, projectId, kind, status, createdAt, updatedAt, ' +
    '[projectId+kind], [projectId+status]',
  ideaNotes: 'id, projectId, status, updatedAt, deletedAt',
  storyArcs: 'id, projectId, order, status, updatedAt, deletedAt',
  chapterPlans:
    'id, projectId, arcId, linkedChapterId, order, status, updatedAt, deletedAt',
  sceneCards:
    'id, projectId, chapterPlanId, order, status, updatedAt, deletedAt, ' +
    '[projectId+chapterPlanId]',
})
```

- [ ] **Step 4: Rerun DB coverage**

Run: `npx vitest run src/lib/db/project-db.test.ts src/lib/db/project-db.migration-v17.test.ts src/lib/db/project-db.migration-v18.test.ts src/lib/db/project-db.migration-v19.test.ts`
Expected: PASS

- [ ] **Step 5: Record the fix**

```markdown
| DB-001 | P1 | db-migrations | schema upgrade dropped or misread legacy rows | `src/lib/db/project-db.ts`, `src/lib/db/project-db.migration-v19.test.ts` | fixed | vitest pass |
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/project-db.ts src/lib/db/project-db.test.ts src/lib/db/project-db.migration-v17.test.ts src/lib/db/project-db.migration-v18.test.ts src/lib/db/project-db.migration-v19.test.ts docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "fix(db): harden project schema migrations"
```

### Task 9: Repair Sync Queue And Sync Engine Breakers

**Files:**
- Modify: `src/lib/sync/sync-queue.ts`
- Modify: `src/lib/sync/sync-engine.ts`
- Test: `src/lib/sync/sync-queue.test.ts`
- Test: `src/lib/sync/field-mapping.test.ts`
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Run sync-layer coverage**

Run: `npx vitest run src/lib/sync/sync-queue.test.ts src/lib/sync/field-mapping.test.ts`
Expected: deterministic failure if retry state, failed queue items, or local-only degradation are incorrect

- [ ] **Step 2: Add the failing retry-state test**

```ts
async function readAll(): Promise<SyncQueueItem[]> {
  const { openDB } = await import('idb')
  const db = await openDB('inkforge-sync-queue', 1)
  const all = (await db.getAll('queue')) as SyncQueueItem[]
  db.close()
  return all
}

it('does not report retryable items as fresh pending work in the same flush window', async () => {
  await enqueueChange({
    table: 'chapters',
    operation: 'update',
    data: { id: 'c1', projectId: 'p1' },
    localUpdatedAt: 1,
    userId: 'u1',
  })

  const queued = await readAll()
  const first = queued.find(item => (item.data as { id: string }).id === 'c1')
  expect(first).toBeDefined()

  await markFailed([first!.id])

  const pending = await getPendingChanges()
  const retryable = await getRetryableItems()

  expect(retryable.every(item => !pending.some(p => p.id === item.id))).toBe(true)
})
```

- [ ] **Step 3: Implement the smallest sync fix**

```ts
const pending = await getPendingChanges()
const retryable = await getRetryableItems()
const newRetryable = retryable.filter(item => !pending.some(p => p.id === item.id))
const batch = [...pending, ...newRetryable].slice(0, SYNC_BATCH_SIZE)
```

- [ ] **Step 4: Rerun sync tests**

Run: `npx vitest run src/lib/sync/sync-queue.test.ts src/lib/sync/field-mapping.test.ts`
Expected: PASS

- [ ] **Step 5: Record the fix**

```markdown
| SYNC-001 | P1 | sync | failed items were eligible for duplicate processing in the same flush cycle | `src/lib/sync/sync-queue.ts`, `src/lib/sync/sync-engine.ts` | fixed | vitest pass |
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/sync/sync-queue.ts src/lib/sync/sync-engine.ts src/lib/sync/sync-queue.test.ts src/lib/sync/field-mapping.test.ts docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "fix(sync): harden queue retry and flush behavior"
```

### Task 10: Address Stability-Linked Performance Hotspots

**Files:**
- Modify: `src/lib/hooks/use-autosave.ts`
- Modify: `src/lib/hooks/use-ai-chat.ts`
- Modify: `src/lib/hooks/use-workspace-layout.ts`
- Test: `src/lib/hooks/use-autosave.test.ts`
- Test: `src/lib/hooks/use-workspace-layout.test.ts`
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Only enter this task if a P2 issue was confirmed in the issue ledger**

Run: `Select-String -Path .\docs\superpowers\audits\2026-04-28-stability-audit-log.md -Pattern '\| P2 \|'`
Expected: one or more confirmed P2 rows

- [ ] **Step 2: Add the failing performance-protection test**

```ts
it('does not schedule duplicate saves when deps change repeatedly before the debounce fires', async () => {
  vi.useFakeTimers()
  const saveFn = vi.fn().mockResolvedValue(undefined)

  const { rerender } = renderHook(
    ({ deps }) => useAutoSave(saveFn, deps, 500),
    { initialProps: { deps: ['v1'] } }
  )

  rerender({ deps: ['v2'] })
  rerender({ deps: ['v3'] })
  vi.advanceTimersByTime(500)

  await waitFor(() => expect(saveFn).toHaveBeenCalledTimes(1))
})
```

- [ ] **Step 3: Implement the smallest hotspot fix**

```ts
if (timerRef.current) {
  clearTimeout(timerRef.current)
}

timerRef.current = setTimeout(() => {
  doSave()
}, debounceMs)
```

- [ ] **Step 4: Rerun the targeted hotspot tests**

Run: `npx vitest run src/lib/hooks/use-autosave.test.ts src/lib/hooks/use-workspace-layout.test.ts`
Expected: PASS

- [ ] **Step 5: Record the fix**

```markdown
| PERF-001 | P2 | autosave-persistence | repeated state changes scheduled duplicate writes inside one debounce window | `src/lib/hooks/use-autosave.ts` | fixed | vitest pass |
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-autosave.ts src/lib/hooks/use-ai-chat.ts src/lib/hooks/use-workspace-layout.ts src/lib/hooks/use-autosave.test.ts src/lib/hooks/use-workspace-layout.test.ts docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "perf(workspace): remove stability-linked duplicate work"
```

### Task 11: Run Final Regression And Close The Audit

**Files:**
- Modify: `docs/superpowers/audits/2026-04-28-stability-audit-log.md`

- [ ] **Step 1: Run final lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 2: Run final unit/component suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Run final production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 4: Run final workflow e2e**

Run: `pnpm test:e2e -- tests/e2e/project-workflow.spec.ts`
Expected: PASS, or only explicitly deferred failures already documented in the audit log

- [ ] **Step 5: Fill the final verification table**

```markdown
| `pnpm lint` | pass |  |
| `pnpm test` | pass | targeted fixes covered by updated hook and DB tests |
| `pnpm build` | pass |  |
| `pnpm test:e2e -- tests/e2e/project-workflow.spec.ts` | pass | core workflow stable after fixes |
```

- [ ] **Step 6: Summarize deferred items**

```markdown
| PERF-002 | Requires cross-panel state architecture work across `use-workspace-layout` and `NormalLayout`; out of scope for this phase | create a dedicated workspace-state refactor spec |
```

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/audits/2026-04-28-stability-audit-log.md
git commit -m "docs(audit): finalize stability audit results"
```
