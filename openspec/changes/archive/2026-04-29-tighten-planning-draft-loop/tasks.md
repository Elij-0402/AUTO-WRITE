## 1. Draft prefill freshness

- [x] 1.1 Replace the current draft-panel planning prefill key with a scene-aware fingerprint that reacts to scene-card edits and reordering
- [x] 1.2 Track whether the draft outline has been locally edited and only auto-apply newer planning context before the outline becomes dirty
- [x] 1.3 Add an explicit refresh action for pulling newer linked planning context into the draft panel after local edits
- [x] 1.4 Add component tests covering auto-refresh, dirty-state protection, and scene-order-aware prefill updates

## 2. Scene-card apply visibility

- [x] 2.1 Update planning AI apply flow so accepting generated scene cards reveals the first newly created scene in the workbench
- [x] 2.2 Add component tests for applying scene-card previews when a chapter already contains existing scene cards

## 3. Workflow regression coverage

- [x] 3.1 Extend chapter drafting tests to assert scene-card count, scene ordering, and refreshed prefill content in the draft outline
- [x] 3.2 Add or update Playwright coverage for the planning-to-drafting handoff with linked chapter plans and seeded scene cards
- [x] 3.3 Run targeted `pnpm test` and `pnpm exec playwright test` coverage for the tightened workflow
