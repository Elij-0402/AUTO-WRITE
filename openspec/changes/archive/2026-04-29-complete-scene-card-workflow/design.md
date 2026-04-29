## Context

The repository already treats planning as a structured pipeline: idea notes feed story arcs, story arcs feed chapter plans, and chapter plans can prefill chapter draft generation. `SceneCard` is present in the domain model, IndexedDB schema, planning snapshot, and draft-context helpers, but it is not yet a first-class planning surface in the UI or AI workflow.

That gap creates two problems. First, chapter plans stay too coarse, so authors jump from a single summary into full drafting without a stable beat sheet. Second, the system already knows how to consume scene cards downstream, but users have no ergonomic way to create or refine them upstream.

## Goals / Non-Goals

**Goals:**
- Make scene cards editable from the planning workbench when a chapter plan is selected.
- Let AI generate scene-card drafts from a chapter plan in the same preview-and-apply pattern used for arcs and chapter plans.
- Expose scene-card coverage as a planning readiness signal for linked chapter drafting.
- Reuse existing planning data structures and keep changes local to the current planning architecture.

**Non-Goals:**
- Redesign the overall workspace layout or add a new top-level tab.
- Replace chapter draft generation prompts with a new drafting engine.
- Introduce graph-style scene visualization or cross-chapter drag-and-drop boards in this change.

## Decisions

### 1. Treat scene cards as a child collection of chapter plans in the existing planning workbench

Scene cards will appear only when a chapter plan is selected, as an inline lower section inside the current planning form. This keeps the interaction model consistent with the existing hierarchy and avoids adding a new selection kind or route.

Alternative considered: make scene cards selectable from the planning sidebar as peer objects. Rejected because the current sidebar is already organized around idea, arc, and chapter abstraction levels, and scene cards are only meaningful inside a chapter context.

### 2. Extend existing planning hooks and queries instead of creating a separate scene-card hook

`usePlanning` already owns the planning snapshot and mutations for ideas, arcs, and chapter plans. Adding `createSceneCard`, `updateSceneCard`, `deleteSceneCard`, and `reorderSceneCards` there keeps call sites simple and preserves a single source of truth.

Alternative considered: create `useSceneCards(projectId, chapterPlanId)`. Rejected because it would split planning state across hooks and complicate components that already depend on the full snapshot.

### 3. Add a new planning AI action for scene-card generation using the existing preview/apply contract

The current planning AI panel uses discrete actions with a structured JSON contract. Scene-card generation should follow the same shape: generate preview data, let the user inspect it, then apply it into Dexie. This minimizes new mental models and reuses test patterns.

Alternative considered: write generated scene cards directly on AI completion. Rejected because current planning AI deliberately separates generation from persistence, and scene-level beats are high-friction content that users should review before committing.

### 4. Keep scene-card fields focused on drafting utility, not world-building completeness

The existing `SceneCard` shape already captures viewpoint, location, objective, obstacle, outcome, continuity notes, and linked world entries. The UI should expose these directly and avoid new speculative fields. This is enough to support draft prefill and continuity tracking without expanding the schema.

Alternative considered: add pacing, emotional beat, and reveal severity fields now. Rejected because they add modeling weight before the baseline workflow is proven.

## Risks / Trade-offs

- [Risk] More fields in the chapter-plan view may make the planning workbench feel dense. -> Mitigation: keep scene-card rows collapsible and use summary-first cards with inline expand/edit behavior.
- [Risk] AI-generated scene cards may create repetitive or low-value beats. -> Mitigation: preserve preview-before-apply and keep manual add/edit controls equally accessible.
- [Risk] Reordering scene cards requires new persistence logic that can drift from current chapter-plan ordering behavior. -> Mitigation: mirror the existing order-based mutation pattern already used for chapters and planning entities.
- [Risk] Draft readiness can be misread as quality, not completeness. -> Mitigation: label readiness around coverage and concreteness rather than "good" or "done."

## Migration Plan

No schema migration is required because `sceneCards` already exists in the project database. Rollout is application-only:

1. Extend planning mutations for scene-card CRUD and ordering.
2. Add planning workbench UI for scene-card creation and editing.
3. Add AI generation and preview/apply support.
4. Update readiness copy and targeted tests.

Rollback is low risk: UI and hook changes can be reverted without data loss because scene-card rows already conform to the stored schema.

## Open Questions

- Should deleting a scene card be a soft delete immediately, or should the first iteration only allow manual clearing plus reorder? Soft delete is more consistent with the rest of the data model, but the current planning query helpers do not yet expose delete helpers.
- Should linked world entries be editable in the first UI pass, or displayed as read-only placeholders until a dedicated picker is added? The safer first pass is to keep them read-only or omit them from editing if the picker would meaningfully expand scope.
