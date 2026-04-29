## 1. Planning data and mutations

- [x] 1.1 Extend `usePlanning` to expose scene-card create, update, delete, and reorder operations
- [x] 1.2 Add scene-card delete and reorder helpers in `src/lib/db/planning-queries.ts`
- [x] 1.3 Add or update unit tests for scene-card CRUD and ordering behavior

## 2. Planning workbench UI

- [x] 2.1 Add a scene-card section to the selected chapter-plan view with scene coverage summary
- [x] 2.2 Implement create/edit interactions for scene-card fields and status updates
- [x] 2.3 Implement scene-card ordering controls and empty-state handling
- [x] 2.4 Add component tests for scene-card rendering and editing in `planning-workbench.test.tsx`

## 3. Planning AI integration

- [x] 3.1 Extend planning prompt types and parsing to support a `generate_scene_cards` action
- [x] 3.2 Add a scene-card generation action and preview rendering in `planning-ai-panel.tsx`
- [x] 3.3 Persist accepted AI-generated scene cards into the selected chapter plan
- [x] 3.4 Add tests covering button visibility, prompt invocation, preview rendering, and apply behavior

## 4. Drafting readiness and regression coverage

- [x] 4.1 Update chapter-plan and draft-context UI copy to reflect scene coverage consistently
- [x] 4.2 Verify chapter draft prefill still uses ordered scene cards from linked chapter plans
- [x] 4.3 Run targeted Vitest coverage for planning, draft-context, and planning AI regressions
