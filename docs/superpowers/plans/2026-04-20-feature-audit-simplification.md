# InkForge Feature Audit Simplification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip over-engineered subsystems (RAG, retry sync, dev stats, multi-session) and simplify the UI to a lean v1.0 feature set for Chinese web novel authors.

**Architecture:** Offline-first IndexedDB stays (Dexie), Supabase sync simplified to single-direction push. Context injection downgrades from hybrid RAG to pure keyword matching. Multi-session management becomes single-session with history view.

**Tech Stack:** Next.js 16, React 19, Dexie.js (IndexedDB), Supabase (sync), Tiptap (editor), Vitest (tests).

---

## File Map

**Delete entirely:**
- `src/components/workspace/dev-stats-drawer.tsx`
- `src/components/workspace/dev-stats-drawer.test.tsx`
- `src/lib/db/dev-stats-queries.ts`
- `src/lib/db/dev-stats-queries.test.ts`
- `src/lib/rag/` (entire directory — 10 files including test files)
- `src/lib/sync/conflict-resolver.ts`

**Modify:**
- `src/app/projects/[id]/page.tsx` — remove DevStatsDrawer import/state/handler/JSX
- `src/components/workspace/workspace-topbar.tsx` — remove `onOpenDevStats` prop + button
- `src/components/workspace/draft-card.tsx` — simplify REASONS from 4→2
- `src/lib/db/project-db.ts` — narrow `draftRejectedReason` type; add v14 migration (drop embeddings)
- `src/lib/hooks/use-ai-chat.ts` — replace hybrid RAG with pure keyword (topK=6, budget=2000)
- `src/lib/hooks/use-context-injection.ts` — update DEFAULT_TOKEN_BUDGET to 2000
- `src/lib/sync/sync-engine.ts` — remove MAX_RETRIES, BASE_RETRY_DELAY, retryFailedSync(); mark failures as failed
- `src/lib/sync/sync-queue.ts` — remove retryCount/lastRetryAt; add failed?: boolean; remove incrementRetry()
- `src/components/workspace/onboarding-tour-dialog.tsx` — step 2: genre selection → template
- `src/components/editor/history-drawer.tsx` — remove SourceBadge type labels
- `src/components/workspace/conversation-drawer.tsx` — remove new/rename UI; add read-only view
- `src/components/workspace/ai-chat-panel.tsx` — remove session-switching; always use conversations[0]
- `src/lib/hooks/use-conversations.ts` — remove create() and rename(); keep remove()
- `src/components/workspace/message-bubble.tsx` — guard CitationChip behind citations experiment flag

---

## Phase 1 — No Dependencies

### Task 1: Remove DevStatsDrawer

**Files:**
- Delete: `src/components/workspace/dev-stats-drawer.tsx`
- Delete: `src/components/workspace/dev-stats-drawer.test.tsx`
- Delete: `src/lib/db/dev-stats-queries.ts`
- Delete: `src/lib/db/dev-stats-queries.test.ts`
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/components/workspace/workspace-topbar.tsx`

- [ ] **Step 1: Delete the four files**

```bash
rm src/components/workspace/dev-stats-drawer.tsx
rm src/components/workspace/dev-stats-drawer.test.tsx
rm src/lib/db/dev-stats-queries.ts
rm src/lib/db/dev-stats-queries.test.ts
```

- [ ] **Step 2: Remove DevStatsDrawer from the workspace page**

In `src/app/projects/[id]/page.tsx`, find and remove:

1. The import line:
```ts
import { DevStatsDrawer } from '@/components/workspace/dev-stats-drawer'
```

2. The state declaration (search for `devStatsOpen`):
```ts
const [devStatsOpen, setDevStatsOpen] = useState(false)
```

3. The keyboard handler line that calls `setDevStatsOpen` (around line 174 — search for `setDevStatsOpen`).

4. The `onOpenDevStats` prop on `WorkspaceTopbar`:
```tsx
onOpenDevStats={() => setDevStatsOpen(true)}
```

5. The `<DevStatsDrawer ... />` JSX block (search for `<DevStatsDrawer`):
```tsx
<DevStatsDrawer
  projectId={id}
  open={devStatsOpen}
  onOpenChange={setDevStatsOpen}
/>
```

- [ ] **Step 3: Remove the prop from WorkspaceTopbar**

In `src/components/workspace/workspace-topbar.tsx`, remove `onOpenDevStats?: () => void` from the props interface and remove the button that calls it (search for `onOpenDevStats` — the button shows an `<Activity />` icon with tooltip "开发者统计 · Ctrl+Alt+S").

- [ ] **Step 4: Verify build compiles**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors about DevStatsDrawer or dev-stats-queries.

- [ ] **Step 5: Run tests**

```bash
npm test 2>&1 | tail -20
```

Expected: PASS (the two deleted test files are gone, no new failures).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove DevStatsDrawer and dev-stats-queries"
```

---

### Task 2: Simplify Draft Card Rejection Options (4 → 2)

**Files:**
- Modify: `src/components/workspace/draft-card.tsx`
- Modify: `src/lib/db/project-db.ts`

- [ ] **Step 1: Write the failing test**

In `src/components/workspace/draft-card.test.tsx`, find or add a test for rejection options. Verify the test expects exactly 2 radio labels:

```tsx
it('shows only 2 rejection reason options', async () => {
  render(
    <DraftCard
      draftId="d1"
      content="some content"
      projectId="proj1"
      messageId="msg1"
      onInsert={() => {}}
    />
  )
  await userEvent.click(screen.getByRole('button', { name: '不采纳' }))
  const radios = screen.getAllByRole('radio')
  expect(radios).toHaveLength(2)
  expect(screen.getByLabelText('不符合设定')).toBeInTheDocument()
  expect(screen.getByLabelText('其他')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/workspace/draft-card.test.tsx -t "shows only 2"
```

Expected: FAIL (currently 4 options).

- [ ] **Step 3: Update the REASONS array and type in draft-card.tsx**

Replace the current `REASONS` constant and `RejectReason` type derivation:

```tsx
// OLD (4 options)
const REASONS: Array<{ value: RejectReason; label: string }> = [
  { value: 'conflict', label: '与世界观有冲突' },
  { value: 'style', label: '文风不对' },
  { value: 'plot', label: '情节不对' },
  { value: 'other', label: '其他' },
]
```

With:

```tsx
// NEW (2 options)
type RejectReason = 'conflict' | 'other'

const REASONS: Array<{ value: RejectReason; label: string }> = [
  { value: 'conflict', label: '不符合设定' },
  { value: 'other', label: '其他' },
]
```

Remove the import `type RejectReason = NonNullable<AIUsageEvent['draftRejectedReason']>` since we now define it locally. Also update the `useState` default from `'conflict'` to `'conflict'` (no change needed there).

- [ ] **Step 4: Narrow the DB type in project-db.ts**

In `src/lib/db/project-db.ts`, find the `AIUsageEvent` interface and update `draftRejectedReason`:

```ts
// OLD
draftRejectedReason?: 'conflict' | 'style' | 'plot' | 'other'

// NEW
draftRejectedReason?: 'conflict' | 'other'
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/components/workspace/draft-card.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/workspace/draft-card.tsx src/lib/db/project-db.ts
git commit -m "feat: simplify draft rejection to 2 options (不符合设定 / 其他)"
```

---

### Task 3: Simplify History Drawer — Remove Type Badges

**Files:**
- Modify: `src/components/editor/history-drawer.tsx`

- [ ] **Step 1: Write the failing test**

In `src/components/editor/history-drawer.test.tsx` (create if absent next to the component):

```tsx
import { render, screen } from '@testing-library/react'
import { HistoryDrawer } from './history-drawer'

const mockRevisions = [
  { id: 'r1', chapterId: 'c1', label: '', content: {}, createdAt: Date.now(), source: 'manual' as const, wordCount: 100 },
  { id: 'r2', chapterId: 'c1', label: 'My draft', content: {}, createdAt: Date.now() - 1000, source: 'ai-draft' as const, wordCount: 80 },
  { id: 'r3', chapterId: 'c1', label: '', content: {}, createdAt: Date.now() - 2000, source: 'autosnapshot' as const, wordCount: 90 },
]

it('does not show snapshot type badges', () => {
  render(
    <HistoryDrawer
      projectId="p1"
      chapterId="c1"
      currentContent={{}}
      revisions={mockRevisions}
      onRestore={() => {}}
    />
  )
  expect(screen.queryByText('手动')).not.toBeInTheDocument()
  expect(screen.queryByText('AI')).not.toBeInTheDocument()
  expect(screen.queryByText('自动')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/editor/history-drawer.test.tsx
```

Expected: FAIL (badges currently rendered).

- [ ] **Step 3: Remove the SourceBadge component and its usage**

In `src/components/editor/history-drawer.tsx`:

1. Delete the `SourceBadge` component entirely (the function that renders the amber/violet/muted pill spans).
2. Delete the `defaultLabel()` function that returns "手动快照" / "AI 草稿" / "自动快照".
3. In the revision list render, replace any `<SourceBadge source={rev.source} />` usage with nothing, and replace `defaultLabel(rev.source)` with a simple date string. Each row should show the revision's datetime and label (if set) without type classification:

```tsx
// Replace the label + badge line with just:
<span className="text-[12px] text-foreground/80 truncate">
  {rev.label || new Date(rev.createdAt).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })}
</span>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/editor/history-drawer.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run all tests to check no regressions**

```bash
npm test 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add src/components/editor/history-drawer.tsx
git commit -m "feat: remove snapshot type badges from history drawer"
```

---

### Task 4: Citations Chip — Guard Behind Experiment Flag

**Files:**
- Modify: `src/components/workspace/message-bubble.tsx`

The citations chip is already guarded by `message.citations && message.citations.length > 0`, but the spec requires an additional guard: only render when the `citations` experiment flag is `true`. This prevents stale citation data from showing on non-Anthropic providers or when the flag is toggled off.

- [ ] **Step 1: Read how aiConfig / experimentFlags is passed to message-bubble**

```bash
grep -n "citations\|experimentFlags\|CitationChip\|aiConfig" src/components/workspace/message-bubble.tsx | head -20
```

Note the prop name used for the citations flag (likely `useCitations: boolean` or `citations: boolean`).

- [ ] **Step 2: Write the failing test**

In `src/components/workspace/message-bubble.test.tsx`, add:

```tsx
it('hides citation chips when citations flag is false', () => {
  const message = {
    id: 'm1', role: 'assistant' as const, content: 'hello',
    citations: [{ entryId: 'e1', entryName: '主角', citedText: 'text', blockIndex: 0 }],
    timestamp: Date.now(), projectId: 'p1', conversationId: 'c1',
  }
  render(<MessageBubble message={message} useCitations={false} projectId="p1" />)
  expect(screen.queryByRole('button', { name: /溯源|citation/i })).not.toBeInTheDocument()
})

it('shows citation chips when citations flag is true', () => {
  const message = {
    id: 'm1', role: 'assistant' as const, content: 'hello',
    citations: [{ entryId: 'e1', entryName: '主角', citedText: 'text', blockIndex: 0 }],
    timestamp: Date.now(), projectId: 'p1', conversationId: 'c1',
  }
  render(<MessageBubble message={message} useCitations={true} projectId="p1" />)
  expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
})
```

(Adjust prop names to match the actual component interface.)

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/components/workspace/message-bubble.test.tsx -t "citation"
```

Expected: FAIL.

- [ ] **Step 4: Add useCitations prop and guard**

In `src/components/workspace/message-bubble.tsx`:

1. Add `useCitations: boolean` to the props interface.
2. Wrap the citation chips block with both conditions:

```tsx
// OLD
{message.citations && message.citations.length > 0 && (
  <div className="...">
    {message.citations.map((citation, idx) => (
      <CitationChip ... />
    ))}
  </div>
)}

// NEW
{useCitations && message.citations && message.citations.length > 0 && (
  <div className="...">
    {message.citations.map((citation, idx) => (
      <CitationChip ... />
    ))}
  </div>
)}
```

3. Find the call site of `MessageBubble` (likely in `ai-chat-panel.tsx`) and pass `useCitations={resolvedFlags.citations}` (or however the flag is available there).

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/components/workspace/message-bubble.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/workspace/message-bubble.tsx src/components/workspace/ai-chat-panel.tsx
git commit -m "feat: guard CitationChip behind citations experiment flag"
```

---

## Phase 2 — DB Migration + RAG Deletion

### Task 5: DB Schema Migration v13 → v14 (Drop embeddings table)

**Files:**
- Modify: `src/lib/db/project-db.ts`
- Test: `src/lib/db/project-db.migration-v14.test.ts` (new file)

- [ ] **Step 1: Write the failing migration test**

Create `src/lib/db/project-db.migration-v14.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { createProjectDB } from './project-db'

describe('project-db v14 migration', () => {
  it('opens at version 14 successfully', async () => {
    const db = createProjectDB('test-migration-v14')
    await db.open()
    expect(db.verno).toBe(14)
    await db.close()
  })

  it('does not have an embeddings table', async () => {
    const db = createProjectDB('test-no-embeddings')
    await db.open()
    expect(db.tables.map(t => t.name)).not.toContain('embeddings')
    await db.close()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/db/project-db.migration-v14.test.ts
```

Expected: FAIL (version is 13, embeddings table exists).

- [ ] **Step 3: Add version 14 to project-db.ts**

In `src/lib/db/project-db.ts`, after the existing `db.version(13).stores({...})` block, add:

```ts
// v14: drop embeddings table (RAG vector system removed in feature audit)
db.version(14)
  .stores({
    embeddings: null,
  })
  .upgrade(async tx => {
    // Clear any existing vector data before the object store is removed.
    // Dexie removes the store automatically when null is specified, but we
    // clear explicitly to handle edge cases where the store open partially.
    try {
      await (tx as Dexie.Transaction & { embeddings: Dexie.Table }).embeddings.clear()
    } catch {
      // Store may already be absent on some browser versions — safe to ignore.
    }
  })
```

- [ ] **Step 4: Run migration test to verify it passes**

```bash
npx vitest run src/lib/db/project-db.migration-v14.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all DB tests**

```bash
npx vitest run src/lib/db/
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/project-db.ts src/lib/db/project-db.migration-v14.test.ts
git commit -m "feat: db schema v14 — drop embeddings table"
```

---

### Task 6: Delete RAG Files

**Files:**
- Delete: all files in `src/lib/rag/` (10 files)

- [ ] **Step 1: Delete the entire rag directory**

```bash
rm -rf src/lib/rag/
```

- [ ] **Step 2: Fix the broken import in use-ai-chat.ts**

In `src/lib/hooks/use-ai-chat.ts`, remove these two lines:

```ts
import { searchRelevantEntries } from '../rag/search'
import { getDefaultEmbedder } from '../rag/default-embedder'
```

Also remove the `embedder` variable and the `searchRelevantEntries` call block (lines ~124–138):

```ts
// DELETE this block:
const embedder = getDefaultEmbedder()
const relevantEntries = entries
  ? await searchRelevantEntries({
      db,
      projectId,
      embedder,
      query: content,
      entries,
      entriesByType,
      topK: 12,
    })
  : []
const trimmedEntries = trimToTokenBudget(relevantEntries, 4000)
```

Replace with a temporary stub that keeps the code compiling (Task 7 will add the real keyword logic):

```ts
const trimmedEntries: WorldEntry[] = []
```

- [ ] **Step 3: Fix the broken import in rag/indexer.ts's consumers**

The `src/lib/rag/indexer.ts` imported `formatEntryForContext` from `use-context-injection`. Now that indexer.ts is deleted, there are no other import issues. Verify no remaining rag imports:

```bash
grep -rn "from.*rag/" src/ --include="*.ts" --include="*.tsx"
```

Expected: no matches.

- [ ] **Step 4: Check TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing errors unrelated to rag).

- [ ] **Step 5: Run all tests**

```bash
npm test 2>&1 | tail -20
```

Expected: all PASS (rag test files are deleted).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: delete RAG vector system (indexer, vector-store, hybrid-search, embedder)"
```

---

## Phase 3 — Context Injection + Sync Simplification

### Task 7: Simplify useAIChat Context Injection (Pure Keyword, topK=6, 2000 tokens)

**Files:**
- Modify: `src/lib/hooks/use-ai-chat.ts`
- Modify: `src/lib/hooks/use-context-injection.ts`

- [ ] **Step 1: Update DEFAULT_TOKEN_BUDGET in use-context-injection.ts**

In `src/lib/hooks/use-context-injection.ts`, change:

```ts
// OLD
export const DEFAULT_TOKEN_BUDGET = 4000

// NEW
export const DEFAULT_TOKEN_BUDGET = 2000
```

- [ ] **Step 2: Write test for the new retrieval behavior**

Add to `src/lib/hooks/use-context-injection.test.ts`:

```ts
describe('findRelevantEntries topK enforcement', () => {
  it('returns at most 6 entries when sliced', () => {
    // Build 10 entries where all match keyword "主角"
    const chars = Array.from({ length: 10 }, (_, i) => ({
      id: `e${i}`, projectId: 'p1', type: 'character' as const,
      name: `主角${i}`, tags: [], createdAt: Date.now(), updatedAt: Date.now(),
      deletedAt: null, personality: '', appearance: '', background: '', relationships: [],
    }))
    const entriesByType = {
      characters: chars, locations: [], rules: [], timelines: [],
    }
    const results = findRelevantEntries(extractKeywords('主角出场'), entriesByType).slice(0, 6)
    expect(results.length).toBeLessThanOrEqual(6)
  })
})

describe('DEFAULT_TOKEN_BUDGET', () => {
  it('is 2000', () => {
    expect(DEFAULT_TOKEN_BUDGET).toBe(2000)
  })
})
```

- [ ] **Step 3: Replace the temporary stub in use-ai-chat.ts with real keyword matching**

In `src/lib/hooks/use-ai-chat.ts`, replace the stub from Task 6:

```ts
// OLD stub from Task 6:
const trimmedEntries: WorldEntry[] = []
```

With:

```ts
// NEW: pure keyword matching, topK=6, 2000-token budget
const relevantEntries = entriesByType
  ? findRelevantEntries(extractKeywords(content), entriesByType).slice(0, 6)
  : []
const trimmedEntries = trimToTokenBudget(relevantEntries, 2000)
```

Make sure the following imports are present in `use-ai-chat.ts`:

```ts
import {
  extractKeywords,
  findRelevantEntries,
  trimToTokenBudget,
  injectContext,
} from './use-context-injection'
```

(Remove `searchRelevantEntries` and `getDefaultEmbedder` imports if not already done in Task 6.)

- [ ] **Step 4: Run context injection tests**

```bash
npx vitest run src/lib/hooks/use-context-injection.test.ts
```

Expected: all PASS (DEFAULT_TOKEN_BUDGET is now 2000, tests should still pass if they don't hard-code 4000).

If any test hard-codes 4000, update it to 2000.

- [ ] **Step 5: Run all tests**

```bash
npm test 2>&1 | tail -20
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-ai-chat.ts src/lib/hooks/use-context-injection.ts
git commit -m "feat: replace hybrid RAG with pure keyword context injection (topK=6, 2000 tokens)"
```

---

### Task 8: Simplify Sync Queue and Engine — Remove Retry Logic

**Files:**
- Modify: `src/lib/sync/sync-queue.ts`
- Modify: `src/lib/sync/sync-engine.ts`
- Delete: `src/lib/sync/conflict-resolver.ts`

- [ ] **Step 1: Delete conflict-resolver.ts**

```bash
rm src/lib/sync/conflict-resolver.ts
```

- [ ] **Step 2: Remove SyncQueueItem retry fields and incrementRetry from sync-queue.ts**

In `src/lib/sync/sync-queue.ts`:

**Update `SyncQueueItem` interface** — remove `retryCount` and `lastRetryAt`, add `failed`:

```ts
// REMOVE these two fields:
// retryCount: number
// lastRetryAt?: number

// ADD:
failed?: boolean
```

**Remove the `incrementRetry()` function** entirely.

**Add a `markFailed()` function** after `markSynced()`:

```ts
export async function markFailed(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = getSyncQueueDB()
  await db.table('syncQueue').where('id').anyOf(ids).modify({ failed: true })
}
```

- [ ] **Step 3: Simplify sync-engine.ts**

In `src/lib/sync/sync-engine.ts`:

1. **Remove constants:**

```ts
// DELETE:
const MAX_RETRIES = 5
const BASE_RETRY_DELAY = 1000
```

2. **Remove `retryFailedSync()` function** entirely.

3. **Remove the import of `incrementRetry`** from sync-queue.ts. **Add import of `markFailed`:**

```ts
import { getPendingChanges, markSynced, markFailed, clearSyncedItems } from './sync-queue'
```

4. **Remove the import and all usage of `conflict-resolver`:**

```bash
grep -n "conflict-resolver\|resolveConflict\|shouldPushToCloud\|shouldPullFromCloud" src/lib/sync/sync-engine.ts
```

Remove each import and usage found.

5. **In `flushSyncQueue()`**, replace the failure handling block that called `incrementRetry(failedIds)` with:

```ts
// OLD:
await incrementRetry(failedIds)

// NEW:
await markFailed(failedIds)
```

Also remove the `break` logic that stopped on full-batch failure if it was tied to retry logic. Keep the function draining all pending items.

6. **In `performInitialSync()`**, remove the complex merge/LWW logic that used `conflict-resolver`. Simplify to a straight push of local changes:

```ts
// The simplified version: just flush the queue, no conflict resolution.
await flushSyncQueue(projectId, db, userId)
```

(Remove any block that called `resolveConflict`, `shouldPushToCloud`, or `shouldPullFromCloud`.)

- [ ] **Step 4: Verify no remaining imports of deleted code**

```bash
grep -rn "conflict-resolver\|incrementRetry\|retryCount\|lastRetryAt\|retryFailedSync\|MAX_RETRIES\|BASE_RETRY_DELAY" src/ --include="*.ts" --include="*.tsx"
```

Expected: no matches.

- [ ] **Step 5: Run all tests**

```bash
npm test 2>&1 | tail -20
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sync/ -A
git commit -m "feat: simplify sync — remove retry/conflict-resolver, mark failures as failed"
```

---

## Phase 4 — Session Management + Onboarding

### Task 9: Downgrade Multi-Session to Single Session + History View

**Files:**
- Modify: `src/lib/hooks/use-conversations.ts`
- Modify: `src/components/workspace/conversation-drawer.tsx`
- Modify: `src/components/workspace/ai-chat-panel.tsx`

- [ ] **Step 1: Remove create() and rename() from use-conversations.ts**

In `src/lib/hooks/use-conversations.ts`:

1. Remove the `create(title?: string)` function entirely.
2. Remove the `rename(id: string, title: string)` function entirely.
3. Keep `conversations`, `loading`, and `remove(id)`.

The hook return object changes from:

```ts
return { conversations, loading, create, rename, remove }
```

To:

```ts
return { conversations, loading, remove }
```

- [ ] **Step 2: Simplify ConversationDrawer to read-only history view**

In `src/components/workspace/conversation-drawer.tsx`:

1. Remove the "新建" (`Plus` icon) button from the header.
2. Remove the `onCreate` prop from the component interface.
3. Remove the kebab dropdown with 重命名/删除 (or keep only 删除).
4. Remove the inline rename state and input (the `isComposing` guard, editing state, etc.).
5. The per-conversation row should show title + date, with only a delete button:

```tsx
<div key={conv.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
  <span className="truncate text-foreground/80">{conv.title}</span>
  <button
    onClick={() => remove(conv.id)}
    className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
    aria-label="删除对话"
  >
    <Trash2 className="h-3.5 w-3.5" />
  </button>
</div>
```

6. Update the empty state text: "还没有对话历史".
7. Update the header title to "对话历史".

- [ ] **Step 3: Simplify ai-chat-panel.tsx to always use conversations[0]**

In `src/components/workspace/ai-chat-panel.tsx`:

1. Remove the `Feather` icon "新建对话" button from the header.
2. The `History` icon button stays (opens ConversationDrawer for viewing/deleting history).
3. Remove `handleNewConversation()` function.
4. Remove the `setActiveConversationId` calls from drawer selection handler — the drawer is now read-only (just close on backdrop click).
5. Remove the `createConversation` import from `use-conversations`.
6. Auto-initialize: if `conversations.length === 0`, create one conversation automatically (this is an internal hook effect, not user-triggered — keep this in the hook or add a `useEffect` in ai-chat-panel):

```ts
// In ai-chat-panel.tsx, after loading conversations:
const db = useMemo(() => createProjectDB(projectId), [projectId])
useEffect(() => {
  if (!loading && conversations.length === 0) {
    // Auto-create the single session using db directly (bypass removed create())
    const id = crypto.randomUUID()
    db.table('conversations').add({
      id,
      projectId,
      title: '对话',
      messageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).catch(console.error)
  }
}, [loading, conversations.length, db, projectId])
```

7. Always use `conversations[0]?.id` as the active conversation (remove multi-select state):

```ts
// Replace activeConversationId state with:
const conversationId = conversations[0]?.id ?? null
```

- [ ] **Step 4: Fix all TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors from the removed `create`/`rename` props/calls.

- [ ] **Step 5: Run all tests**

```bash
npm test 2>&1 | tail -20
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-conversations.ts src/components/workspace/conversation-drawer.tsx src/components/workspace/ai-chat-panel.tsx
git commit -m "feat: downgrade multi-session to single session + history view"
```

---

### Task 10: Onboarding Step 2 — Genre Selection → Character Templates

**Files:**
- Modify: `src/components/workspace/onboarding-tour-dialog.tsx`

- [ ] **Step 1: Write failing test**

In `src/components/workspace/onboarding-tour-dialog.test.tsx` (create if absent):

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingTourDialog } from './onboarding-tour-dialog'

it('step 2 shows genre selection, not hardcoded role cards', async () => {
  render(
    <OnboardingTourDialog
      open
      onOpenChange={() => {}}
      projectId="p1"
    />
  )
  // Navigate to step 2 (click next from step 1)
  await userEvent.click(screen.getByRole('button', { name: /下一步|继续/i }))
  // Should see genre options
  expect(screen.getByText('武侠')).toBeInTheDocument()
  expect(screen.getByText('仙侠')).toBeInTheDocument()
  expect(screen.getByText('都市')).toBeInTheDocument()
  // Should NOT see the old hardcoded "师父" card before genre selection
  expect(screen.queryByText('师父')).not.toBeInTheDocument()
})

it('selecting 武侠 genre shows 3 character templates', async () => {
  render(
    <OnboardingTourDialog open onOpenChange={() => {}} projectId="p1" />
  )
  await userEvent.click(screen.getByRole('button', { name: /下一步|继续/i }))
  await userEvent.click(screen.getByText('武侠'))
  expect(screen.getByText('主角（江湖侠客）')).toBeInTheDocument()
  expect(screen.getByText('反派（魔教高手）')).toBeInTheDocument()
  expect(screen.getByText('师父（武林前辈）')).toBeInTheDocument()
})

it('selecting 都市 genre shows 2 character templates', async () => {
  render(
    <OnboardingTourDialog open onOpenChange={() => {}} projectId="p1" />
  )
  await userEvent.click(screen.getByRole('button', { name: /下一步|继续/i }))
  await userEvent.click(screen.getByText('都市'))
  expect(screen.getByText('主角（普通人）')).toBeInTheDocument()
  expect(screen.getByText('反派（商业对手）')).toBeInTheDocument()
  expect(screen.queryByText(/师父/)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/workspace/onboarding-tour-dialog.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Rewrite step 2 in onboarding-tour-dialog.tsx**

In `src/components/workspace/onboarding-tour-dialog.tsx`, replace the entire step 2 section (the part that renders 3 fixed cards for 主角/反派/师父).

First, add the genre template map before the component:

```tsx
type Genre = '武侠' | '仙侠' | '都市' | '悬疑' | '科幻' | '其他'

const GENRE_TEMPLATES: Record<Genre, Array<{ name: string }>> = {
  武侠: [
    { name: '主角（江湖侠客）' },
    { name: '反派（魔教高手）' },
    { name: '师父（武林前辈）' },
  ],
  仙侠: [
    { name: '主角（修士）' },
    { name: '反派（魔道修士）' },
    { name: '师父（老仙人）' },
  ],
  都市: [
    { name: '主角（普通人）' },
    { name: '反派（商业对手）' },
  ],
  悬疑: [
    { name: '主角（侦探/记者）' },
    { name: '反派（真凶）' },
  ],
  科幻: [
    { name: '主角（船长/研究员）' },
    { name: '反派（外星势力）' },
  ],
  其他: [],
}

const GENRES: Genre[] = ['武侠', '仙侠', '都市', '悬疑', '科幻', '其他']
```

Then replace the step 2 render with:

```tsx
// In the component, add state:
const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
const [createdNames, setCreatedNames] = useState<Set<string>>(new Set())

// Step 2 JSX:
{step === 2 && (
  <div className="space-y-4">
    {!selectedGenre ? (
      <>
        <p className="text-[13px] text-muted-foreground">选择您的创作题材，我们帮您建立初始角色</p>
        <div className="grid grid-cols-3 gap-2">
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className="rounded-lg border border-[hsl(var(--line))] py-3 text-[13px] font-medium hover:border-[hsl(var(--accent))]/60 hover:bg-[hsl(var(--accent))]/5 transition-colors"
            >
              {genre}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60">选"其他"或直接下一步可跳过角色模板</p>
      </>
    ) : (
      <>
        <p className="text-[13px] text-muted-foreground">
          点击添加 <span className="text-foreground/80">{selectedGenre}</span> 初始角色
          <button
            onClick={() => { setSelectedGenre(null); setCreatedNames(new Set()) }}
            className="ml-2 text-[11px] text-muted-foreground/60 underline"
          >
            重新选择
          </button>
        </p>
        <div className="space-y-2">
          {GENRE_TEMPLATES[selectedGenre].map(template => {
            const created = createdNames.has(template.name)
            return (
              <button
                key={template.name}
                onClick={async () => {
                  if (created) return
                  await addEntry('character', template.name)
                  setCreatedNames(prev => new Set([...prev, template.name]))
                }}
                disabled={created}
                className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-[13px] transition-colors ${
                  created
                    ? 'border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]/70'
                    : 'border-[hsl(var(--line))] hover:border-[hsl(var(--accent))]/50'
                }`}
              >
                <span>{template.name}</span>
                {created && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
          {GENRE_TEMPLATES[selectedGenre].length === 0 && (
            <p className="text-[13px] text-muted-foreground/60 py-2">无预设模板，可直接进入下一步</p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/60">创建后可在左侧世界观 tab 补充细节</p>
      </>
    )}
  </div>
)}
```

The `addEntry` function should already be available from the `useWorldEntries` hook. It creates a world entry with the given type and name.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/workspace/onboarding-tour-dialog.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

```bash
npm test 2>&1 | tail -20
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/workspace/onboarding-tour-dialog.tsx
git commit -m "feat: onboarding step 2 — genre selection drives character templates"
```

---

## Final — Verification

### Task 11: Full Validation

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all PASS. Fix any failures before proceeding.

- [ ] **Step 2: Production build**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no TypeScript or webpack errors.

- [ ] **Step 3: Lint check**

```bash
npm run lint 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 4: Verification checklist**

Confirm each item from the spec:

- [ ] DevStatsDrawer related code and Ctrl+Alt+S shortcut completely removed
- [ ] `src/lib/rag/` directory deleted, embeddings migration v14 in project-db.ts
- [ ] `useAIChat` uses pure keyword matching (topK=6, 2000 tokens)
- [ ] Sync queue has no retry logic; failures marked as `failed`
- [ ] `conflict-resolver.ts` deleted
- [ ] Onboarding step 2 shows genre selection before character templates
- [ ] CitationChip only renders when `useCitations={true}` is passed
- [ ] History drawer shows no type badges (手动/AI/自动 pill spans gone)
- [ ] Multi-session downgraded: no new-conversation / rename UI
- [ ] `use-conversations.ts` has no `create()` or `rename()` exports
- [ ] Draft rejection dialog shows exactly 2 options (不符合设定 / 其他)
- [ ] All tests pass (`npm test`)
- [ ] Production build succeeds (`npm run build`)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: v1.0 feature audit — all simplifications complete"
```
