# AI Writing Workspace Simplification Implementation Plan

> **For agentic workers:** The `writing-plans` skill was not available in this session, so this plan is written manually in the repository's existing implementation-plan format. Steps use checkbox (`- [ ]`) syntax for execution tracking.

**Goal:** Simplify InkForge into a clearer AI-assisted long-form writing workspace by removing weakly integrated feature systems, demoting sync and charter complexity, and shrinking planning from a four-layer pipeline into a lightweight arc-and-chapter support layer.

**Architecture:** Execute the simplification in two stages. Stage 1 changes the product surface first: remove onboarding, remove redundant AI-steering flows, remove the standalone charter workflow, demote sync UI, and hide scene-card planning entry points. Stage 2 then deletes or narrows the supporting code paths, tests, and data-model usage that no longer belong to the simplified product. The core writing loop must stay intact throughout: chapter writing, AI collaboration, world bible usage, and export continue working at every checkpoint.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie/IndexedDB, Vitest, Testing Library, Playwright, pnpm

---

## File Map

### Product-facing files to modify

- `src/app/projects/[id]/page.tsx` - Workspace shell, mounted dialogs, core view routing
- `src/components/workspace/ai-chat-panel/index.tsx` - AI panel behavior, removed steering flows, retained lightweight direction editor
- `src/components/workspace/ai-chat-panel/message-list.tsx` - Remove preference-memory affordances from assistant flow if still passed through list props
- `src/components/workspace/message-bubble.tsx` - Remove "记录偏差" entry point
- `src/components/workspace/workspace-topbar.tsx` - Keep sync low-visibility posture intact after sync UI reduction
- `src/components/planning/planning-workbench.tsx` - Remove scene-card-first planning flow and simplify planning surface
- `src/components/planning/planning-ai-panel.tsx` - Remove scene-card generation action; keep only retained light-planning actions
- `src/components/world-bible/world-bible-tab.tsx` - Keep story tracker auxiliary posture only
- `src/components/sync/SyncProgress.tsx` - Remove blocking first-sync overlay behavior from product flow
- `src/app/(authenticated)/AuthenticatedLayoutClient.tsx` - Remove first-sync blocking mount path

### Data and hook files to modify

- `src/lib/hooks/use-workspace-layout.ts` - Preserve chapters/world/planning flow after planning simplification
- `src/lib/hooks/use-ai-chat.ts` - Remove direction-confirmation flow dependencies if any are sourced here
- `src/lib/hooks/use-planning.ts` - Narrow planning operations if scene-card support is removed from the active product
- `src/lib/hooks/use-planning-ai.ts` - Remove scene-card-targeted action support
- `src/lib/hooks/use-project-charter.ts` - Retain lightweight charter usage only
- `src/lib/db/project-charter-queries.ts` - Narrow active charter usage expectations
- `src/lib/db/project-db.ts` - Keep compatibility where needed, but remove no-longer-used active types if safe in Stage 2

### Files expected to be removed

- `src/components/workspace/ai-onboarding-dialog.tsx`
- `src/components/workspace/onboarding-tour-dialog.tsx`
- `src/components/workspace/preference-feedback-dialog.tsx`
- `src/components/workspace/ai-chat-panel/direction-confirmation-card.tsx`
- `src/components/workspace/dialogs/use-ai-onboarding-dialog.ts`
- `src/components/workspace/dialogs/use-onboarding-tour-dialog.ts`
- `src/app/projects/[id]/charter/page.tsx`

### Tests likely to modify or remove

- `src/components/workspace/ai-onboarding-dialog.test.tsx`
- `src/components/workspace/onboarding-tour-dialog.test.tsx`
- `src/components/workspace/preference-feedback-dialog.test.tsx`
- `src/components/workspace/ai-chat-panel/index.test.tsx`
- `src/components/workspace/ai-chat-panel/ai-understanding-panel.test.tsx`
- `src/components/planning/planning-workbench.test.tsx`
- `src/components/planning/planning-ai-panel.test.tsx`
- `src/lib/hooks/use-project-charter.test.ts`
- `src/lib/hooks/use-planning.test.ts`
- `src/lib/hooks/use-planning-ai.ts` consumer tests
- `src/lib/db/project-db.migration-v19.test.ts`

---

## Stage 1 - Product Surface Simplification

### Task 1: Remove onboarding and tour from the workspace shell

**Files:**
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/components/workspace/dialogs/index.ts`
- Remove: `src/components/workspace/ai-onboarding-dialog.tsx`
- Remove: `src/components/workspace/onboarding-tour-dialog.tsx`
- Remove: `src/components/workspace/dialogs/use-ai-onboarding-dialog.ts`
- Remove: `src/components/workspace/dialogs/use-onboarding-tour-dialog.ts`
- Remove/Modify tests that cover those files

- [ ] **Step 1: Write or tighten the failing workspace-shell test**

Add a regression asserting the project page renders without onboarding dependencies:

```tsx
it('renders the workspace shell without onboarding or tour dialogs', () => {
  render(<ProjectPage />)

  expect(screen.queryByText('配置 AI')).not.toHaveAttribute('data-onboarding')
  expect(screen.queryByText('搭起三个主要角色')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted suite to confirm current wiring**

Run: `pnpm vitest run src/app/projects/[id]/page.tsx src/components/workspace/ai-chat-panel/index.test.tsx`

Expected: current tests or the new regression fail until onboarding references are removed cleanly

- [ ] **Step 3: Remove mounted onboarding and tour flows**

Implementation target:

- Stop importing onboarding/tour hooks in the project page
- Remove both dialog components from the project-page tree
- Remove dead exports from `src/components/workspace/dialogs/index.ts`
- Delete the onboarding and tour component files plus their hooks once no references remain

- [ ] **Step 4: Rerun targeted tests**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/workspace-topbar.test.tsx`

Expected: PASS with no onboarding or tour references left in the active shell

- [ ] **Step 5: Commit**

```bash
git add src/app/projects/[id]/page.tsx src/components/workspace/dialogs/index.ts src/components/workspace/ai-chat-panel/index.test.tsx
git rm src/components/workspace/ai-onboarding-dialog.tsx src/components/workspace/onboarding-tour-dialog.tsx src/components/workspace/dialogs/use-ai-onboarding-dialog.ts src/components/workspace/dialogs/use-onboarding-tour-dialog.ts
git commit -m "refactor(workspace): remove onboarding and tour flows"
```

---

### Task 2: Remove preference-memory feedback from the AI conversation

**Files:**
- Modify: `src/components/workspace/message-bubble.tsx`
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`
- Modify: `src/components/workspace/ai-chat-panel/message-list.tsx`
- Remove: `src/components/workspace/preference-feedback-dialog.tsx`
- Modify/remove related tests

- [ ] **Step 1: Add a failing message-bubble regression**

```tsx
it('does not render a preference-feedback entry point for assistant messages', () => {
  render(
    <MessageBubble
      message={assistantMessage}
      projectId="project-1"
    />
  )

  expect(screen.queryByRole('button', { name: '记录偏差' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted test subset**

Run: `pnpm vitest run src/components/workspace/message-bubble.test.tsx src/components/workspace/ai-chat-panel/index.test.tsx`

Expected: FAIL until feedback UI and handler paths are removed

- [ ] **Step 3: Remove the preference-feedback slice**

Implementation target:

- Remove `PreferenceFeedbackDialog` import and rendering from `message-bubble.tsx`
- Remove `handleRecordPreference` and its toast path from `AIChatPanel`
- Remove any `onRecordPreference` prop threading through `message-list.tsx`
- Delete the feedback dialog file after all references are gone

- [ ] **Step 4: Rerun tests**

Run: `pnpm vitest run src/components/workspace/message-bubble.test.tsx src/components/workspace/ai-chat-panel/index.test.tsx`

Expected: PASS with assistant messages reduced to core copy/insert behaviors

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/message-bubble.tsx src/components/workspace/ai-chat-panel/index.tsx src/components/workspace/ai-chat-panel/message-list.tsx
git rm src/components/workspace/preference-feedback-dialog.tsx
git commit -m "refactor(ai-chat): remove preference feedback flow"
```

---

### Task 3: Remove automatic direction confirmation and keep one lightweight direction surface

**Files:**
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`
- Modify: `src/components/workspace/ai-chat-panel/ai-understanding-panel.tsx`
- Remove: `src/components/workspace/ai-chat-panel/direction-confirmation-card.tsx`
- Modify: `src/lib/db/project-charter-queries.ts`
- Modify related tests

- [ ] **Step 1: Add a failing AI-panel regression**

```tsx
it('does not auto-open a direction-confirmation card after chat exchange', () => {
  render(<AIChatPanel projectId="project-1" />)

  expect(screen.queryByText('继续聊聊')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run targeted tests**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/ai-chat-panel/ai-understanding-panel.test.tsx`

Expected: FAIL until direction-confirmation logic is removed and the remaining charter UI is stable

- [ ] **Step 3: Simplify AI direction handling**

Implementation target:

- Remove `DirectionConfirmationCard` import, state, generation effect, and accept/continue handlers from `AIChatPanel`
- Keep one lightweight AI-side direction surface based on the retained charter fields:
  - `oneLinePremise`
  - `storyPromise`
  - `themes`
- If `AIUnderstandingPanel` currently exposes larger charter concepts than intended, trim it to this smaller subset
- Keep `project-charter-queries.ts` compatible, but ensure active UI writes remain limited to the retained fields

- [ ] **Step 4: Rerun tests**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/ai-chat-panel/ai-understanding-panel.test.tsx src/lib/hooks/use-project-charter.test.ts`

Expected: PASS with only one lightweight AI-direction path remaining

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/ai-chat-panel/index.tsx src/components/workspace/ai-chat-panel/ai-understanding-panel.tsx src/lib/db/project-charter-queries.ts src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/ai-chat-panel/ai-understanding-panel.test.tsx src/lib/hooks/use-project-charter.test.ts
git rm src/components/workspace/ai-chat-panel/direction-confirmation-card.tsx
git commit -m "refactor(ai-chat): collapse AI direction steering to one lightweight path"
```

---

### Task 4: Remove the standalone charter route from the product flow

**Files:**
- Remove: `src/app/projects/[id]/charter/page.tsx`
- Modify any tests or references that still assume the route exists

- [ ] **Step 1: Search for active charter-route references**

Run: `rg -n "/charter|charter/page|ProjectCharterForm" src`

Expected: only direct route and retained lightweight-charter references remain

- [ ] **Step 2: Add or tighten route-removal verification**

Prefer a routing or smoke test that confirms the main workspace no longer expects a charter page.

- [ ] **Step 3: Remove the route file**

Implementation target:

- Delete `src/app/projects/[id]/charter/page.tsx`
- Update any tests or route assumptions accordingly

- [ ] **Step 4: Run targeted checks**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/lib/hooks/use-project-charter.test.ts`

Expected: PASS with the retained charter storage still supporting lightweight AI-side usage

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/ai-chat-panel/index.test.tsx src/lib/hooks/use-project-charter.test.ts
git rm src/app/projects/[id]/charter/page.tsx
git commit -m "refactor(charter): remove standalone charter route"
```

---

### Task 5: Demote sync from blocking product flow to background infrastructure

**Files:**
- Modify: `src/app/(authenticated)/AuthenticatedLayoutClient.tsx`
- Modify: `src/components/sync/SyncProgress.tsx`
- Modify sync-related tests

- [ ] **Step 1: Add a failing layout regression**

```tsx
it('does not block the authenticated workspace with a first-sync overlay', () => {
  sessionStorage.removeItem('inkforge_initial_sync_done')

  render(<AuthenticatedLayoutClient><div>workspace</div></AuthenticatedLayoutClient>)

  expect(screen.getByText('workspace')).toBeInTheDocument()
  expect(screen.queryByText('首次同步')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run targeted tests**

Run: `pnpm vitest run src/components/sync/SyncManager.test.tsx src/components/workspace/workspace-topbar.test.tsx`

Expected: FAIL until blocking sync UI is no longer mounted into the main flow

- [ ] **Step 3: Remove blocking sync presentation**

Implementation target:

- Stop rendering `SyncProgress` from `AuthenticatedLayoutClient`
- Decide whether `SyncProgress` should be deleted entirely or reduced to an optional, non-blocking surface
- Keep `SyncManager` if background syncing is still desired

- [ ] **Step 4: Rerun targeted tests**

Run: `pnpm vitest run src/components/sync/SyncManager.test.tsx src/components/workspace/workspace-topbar.test.tsx`

Expected: PASS with sync remaining background-only

- [ ] **Step 5: Commit**

```bash
git add src/app/(authenticated)/AuthenticatedLayoutClient.tsx src/components/sync/SyncProgress.tsx src/components/sync/SyncManager.test.tsx src/components/workspace/workspace-topbar.test.tsx
git commit -m "refactor(sync): remove blocking first-sync workspace flow"
```

---

## Stage 2 - Structural Cleanup

### Task 6: Shrink planning from four layers to arc-and-chapter only

**Files:**
- Modify: `src/components/planning/planning-workbench.tsx`
- Modify: `src/components/planning/planning-ai-panel.tsx`
- Modify: `src/lib/hooks/use-planning.ts`
- Modify: planning-related tests

- [ ] **Step 1: Add a failing planning regression**

```tsx
it('does not render scene-card controls in the simplified planning workbench', () => {
  render(
    <PlanningWorkbench
      projectId="project-1"
      selection={{ kind: 'chapter', id: 'chapter-plan-1' }}
    />
  )

  expect(screen.queryByRole('button', { name: '新增场景卡' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the planning suite**

Run: `pnpm vitest run src/components/planning/planning-workbench.test.tsx src/components/planning/planning-ai-panel.test.tsx src/lib/hooks/use-planning.test.ts`

Expected: FAIL until scene-card UI and AI action paths are removed

- [ ] **Step 3: Simplify the planning workbench**

Implementation target:

- Remove scene-card creation controls from chapter-plan views
- Remove scene selection handling from the workbench
- Keep only arc and chapter-plan editing as active product layers
- Update empty-state and helper copy to reinforce planning as a support layer, not a full pipeline

- [ ] **Step 4: Simplify planning AI**

Implementation target:

- Remove the `generate_scene_cards` action and all scene-card previews
- Keep only retained actions such as:
  - generate arc, if still kept in final UX
  - generate chapter plan
  - suggest next step
- Ensure action-resolution logic no longer depends on scene targets

- [ ] **Step 5: Rerun the planning suite**

Run: `pnpm vitest run src/components/planning/planning-workbench.test.tsx src/components/planning/planning-ai-panel.test.tsx src/lib/hooks/use-planning.test.ts`

Expected: PASS with scene-card-first planning removed from active UX

- [ ] **Step 6: Commit**

```bash
git add src/components/planning/planning-workbench.tsx src/components/planning/planning-ai-panel.tsx src/lib/hooks/use-planning.ts src/components/planning/planning-workbench.test.tsx src/components/planning/planning-ai-panel.test.tsx src/lib/hooks/use-planning.test.ts
git commit -m "refactor(planning): simplify planning to arcs and chapter plans"
```

---

### Task 7: Remove scene-card model usage from active code paths

**Files:**
- Modify: `src/lib/hooks/use-planning.ts`
- Modify: `src/lib/hooks/use-planning-ai.ts`
- Modify: `src/lib/db/project-db.ts`
- Modify migration or DB tests as needed

- [ ] **Step 1: Search for scene-card ownership**

Run: `rg -n "sceneCard|sceneCards|generate_scene_cards|kind: 'scene'" src`

Expected: a concrete list of code paths to remove or narrow

- [ ] **Step 2: Decide compatibility boundary before editing**

Implementation rule:

- Do not rush into destructive schema cleanup
- It is acceptable to keep stored `sceneCards` compatibility in Dexie if removing the table would create risky migrations
- Remove active product logic and new writes first

- [ ] **Step 3: Narrow the active model**

Implementation target:

- Remove scene-card creation/update APIs from active hooks where no longer needed
- Remove scene-card result parsing from planning AI
- If the DB table remains for compatibility, document it as legacy storage rather than active product surface

- [ ] **Step 4: Rerun targeted lower-level tests**

Run: `pnpm vitest run src/lib/hooks/use-planning.test.ts src/lib/db/project-db.migration-v19.test.ts`

Expected: PASS with planning compatibility preserved and scene-card-first behavior removed

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/use-planning.ts src/lib/hooks/use-planning-ai.ts src/lib/db/project-db.ts src/lib/db/project-db.migration-v19.test.ts src/lib/hooks/use-planning.test.ts
git commit -m "refactor(planning): remove active scene-card model usage"
```

---

### Task 8: Remove dead onboarding, feedback, and direction-confirmation tests and references

**Files:**
- Remove outdated tests
- Modify any shared mocks or test utils that still reference deleted features

- [ ] **Step 1: Search for residual references**

Run: `rg -n "onboarding|PreferenceFeedback|DirectionConfirmation|记录偏差|搭起三个主要角色" src tests`

Expected: only intentionally retained references remain

- [ ] **Step 2: Delete obsolete tests and clean shared mocks**

Implementation target:

- Remove tests for deleted onboarding/tour components
- Remove tests for deleted preference-feedback component
- Remove direction-confirmation-specific assertions from AI-chat suites
- Update any broad chat-panel mocks to match the simplified prop and state shape

- [ ] **Step 3: Run the affected test groups**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/message-bubble.test.tsx src/components/planning/planning-workbench.test.tsx`

Expected: PASS with simplified feature expectations

- [ ] **Step 4: Commit**

```bash
git add src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/message-bubble.test.tsx src/components/planning/planning-workbench.test.tsx
git commit -m "test(workspace): remove obsolete expectations for deleted feature flows"
```

---

### Task 9: Run focused regression on the simplified core writing loop

**Files:**
- No new product files by default
- Update tests only if regressions are found during validation

- [ ] **Step 1: Run lint**

Run: `pnpm lint`

Expected: PASS

- [ ] **Step 2: Run targeted unit/component verification**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/components/world-bible/world-bible-tab.test.tsx src/components/planning/planning-workbench.test.tsx src/components/project/create-project-modal.test.tsx`

Expected: PASS

- [ ] **Step 3: Run core workflow tests**

Run: `pnpm test`

Expected: PASS, or a small deterministic set of simplification-related failures that can be fixed before finalization

- [ ] **Step 4: Run build**

Run: `pnpm build`

Expected: PASS

- [ ] **Step 5: If needed, run workflow e2e**

Run: `pnpm test:e2e -- tests/e2e/project-workflow.spec.ts`

Expected: PASS for the simplified writing-first workflow

- [ ] **Step 6: Commit any final regression fixes**

```bash
git add -A
git commit -m "fix(workspace): finalize simplified AI writing workspace regression fixes"
```

---

## Self-Review

### Spec coverage

- Onboarding and tour removal: covered by Task 1
- Preference-memory removal: covered by Task 2
- One lightweight AI-direction path: covered by Task 3
- Standalone charter workflow removal: covered by Task 4
- Sync demotion: covered by Task 5
- Planning shrink from four layers to two: covered by Tasks 6 and 7
- Cleanup of dead references and tests: covered by Task 8
- Final core-loop validation: covered by Task 9

### Placeholder scan

- No `TODO` or `TBD` placeholders remain
- Each task maps to concrete repository files
- Validation commands are explicit

### Scope check

- This plan keeps the work focused on the product simplification approved in the design doc
- It does not broaden into unrelated redesign, export changes, or auth/sync architecture rewrites

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-29-ai-writing-workspace-simplification-implementation.md`.
