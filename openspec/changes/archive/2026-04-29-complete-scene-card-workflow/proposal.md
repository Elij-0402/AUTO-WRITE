## Why

InkForge already models `SceneCard` in types, persistence, tests, and chapter draft context, but the planning workflow still stops at idea, arc, and chapter-plan level. This leaves the most actionable planning layer half-finished: authors can define what a chapter should do, but not break it into scene-by-scene execution before drafting.

## What Changes

- Add a complete scene-card editing workflow inside the planning workbench for selected chapter plans.
- Add an AI planning action that expands a chapter plan into a previewable set of scene cards before the user writes them into storage.
- Surface scene coverage and drafting readiness in planning so users can see whether a chapter is still abstract or ready to draft from a concrete beat sheet.
- Extend planning hooks and queries to support creating, updating, deleting, and reordering scene cards as first-class planning objects.

## Capabilities

### New Capabilities
- `scene-card-planning`: Manage scene cards as the executable layer between chapter planning and chapter drafting.

### Modified Capabilities

None.

## Impact

- Affected UI: `src/components/planning/*`, `src/components/workspace/chapter-draft-panel.tsx`
- Affected hooks and persistence: `src/lib/hooks/use-planning.ts`, `src/lib/db/planning-queries.ts`
- Affected AI planning flow: `src/lib/ai/planning-prompts.ts`, `src/lib/hooks/use-planning-ai.ts`, related tests
- No new external dependency is required; changes build on the existing Dexie schema and planning AI architecture
