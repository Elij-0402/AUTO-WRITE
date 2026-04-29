## Why

Scene-card planning is already implemented, but the handoff into chapter drafting is still fragile. After users adjust scene-card content or ordering, the draft prefill can stay stale, and the browser-level workflow does not yet prove that planning edits, scene breakdown, and drafting remain connected end to end.

## What Changes

- Keep chapter-draft prefill synchronized with the latest linked chapter-plan and scene-card state, including scene-card edits and reordering.
- Add a guarded refresh path so users can pull newer planning context into the draft panel without silently overwriting draft outlines they already edited by hand.
- Tighten the scene-card AI apply flow so newly created scene beats are immediately visible after acceptance.
- Add end-to-end regression coverage for the planning-to-drafting loop, including scene-card-aware draft prefill.

## Capabilities

### New Capabilities
- `chapter-draft-prefill`: Keep linked drafting prefill aligned with the latest planning breakdown while respecting local draft edits.

### Modified Capabilities
- `scene-card-planning`: Strengthen post-apply visibility after AI scene-card generation so the new scene breakdown is immediately reachable.

## Impact

- Affected UI: `src/components/workspace/chapter-draft-panel.tsx`, `src/components/planning/planning-workbench.tsx`, `src/components/planning/planning-ai-panel.tsx`
- Affected helpers/tests: `src/components/workspace/chapter-draft-context.ts`, related component tests, `tests/e2e/project-workflow.spec.ts`
- No schema change or new dependency is required; this is a workflow and coverage hardening change on top of the current planning model
