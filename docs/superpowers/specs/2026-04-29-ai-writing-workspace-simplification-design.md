# AI Writing Workspace Simplification Design

Date: 2026-04-29
Project: InkForge
Status: Approved for spec drafting

## Summary

This design defines an aggressive simplification pass for InkForge. The target product after this pass is not a general-purpose writing platform with many parallel systems. It is an AI-assisted novel writing workspace centered on four things:

1. Chapter writing
2. AI collaboration around the current chapter
3. World bible support for context and continuity
4. Light planning for long-form progress

The simplification keeps future-friendly foundations where they are still strategically useful, especially auth and sync infrastructure, but removes or demotes features that currently add more complexity than product value. The product should feel like one clear workflow instead of several partially overlapping ones.

## Goals

- Re-center the product on chapter writing and AI collaboration
- Preserve the parts of planning that materially help long-form fiction work
- Remove duplicate systems for teaching AI the author's direction and preferences
- Reduce UI and state complexity in the workspace
- Keep sync and auth available as background infrastructure without letting them dominate the user experience
- Lower maintenance cost by removing weakly integrated or over-modeled feature surfaces

## Non-Goals

- Rebuilding the editor, world bible, or AI chat from scratch
- Removing auth or sync infrastructure entirely
- Rewriting IndexedDB schema history for the sake of cleanliness alone
- Large visual redesigns unrelated to simplification
- Retrofitting every old data shape into a new model through heavy migrations
- Expanding planning, onboarding, or analysis capabilities

## Product Positioning After Simplification

InkForge should explicitly behave like an AI writing collaboration workspace for long-form fiction authors.

Primary identity:

- The author writes in chapters
- The AI collaborates on the active chapter
- The world bible supplies durable context
- Planning exists to keep long-form work on track, not to become a separate authoring discipline

This means the workspace should guide the user into a single obvious path:

`open project -> choose chapter -> write -> collaborate with AI -> consult world bible when needed -> use light planning to continue the book`

## Core Experience To Preserve

These surfaces remain first-class:

### 1. Chapters

- Chapter list and chapter switching
- Main editor workflow
- Version history
- Save-state confidence and writing continuity

### 2. AI Collaboration

- Right-side chapter assistant
- AI chat around the active chapter
- AI draft generation
- World-aware context injection

### 3. World Bible

- Structured world entries
- World entry editing
- Relationship support
- Long-form continuity support that directly helps writing

### 4. Light Planning

- High-level story or arc structure
- Chapter-level planning
- Minimal AI help for continuing the structure forward

### 5. Basic Export

- Markdown
- DOCX
- EPUB

## Simplification Strategy

The pass uses three different treatments:

1. Remove features that are weakly integrated, redundant, or not meaningfully active
2. Demote infrastructure from product-facing workflow to background support
3. Collapse multi-layered systems into lighter models that still serve the main job

The simplification is successful only if both the code and the product experience become simpler. Hiding complexity in the UI while preserving the same branching product model is not enough.

## Scope

This pass covers the following product surfaces.

### 1. Workspace Entry And Primary Flow

Included:

- Project workspace route
- Initial workspace rendering
- Default panel arrangement
- Primary writing path

Target outcome:

- The workspace opens into a direct writing-first experience
- Users are not diverted into setup tours, secondary forms, or modal flows before writing

### 2. AI Workspace Layer

Included:

- AI chat panel
- Chapter drafting mode
- Direction and understanding surfaces
- Preference feedback surfaces

Target outcome:

- AI collaboration stays strong
- Redundant mechanisms for steering AI are reduced to one lightweight path

### 3. Planning Layer

Included:

- Planning workbench
- Planning AI panel
- Planning data model exposed in the workspace

Target outcome:

- Planning supports long-form momentum
- Planning does not become a parallel production system with excessive nesting

### 4. World Bible Support Layer

Included:

- World bible tab
- Relationship support
- Story tracker placement and scope

Target outcome:

- World bible stays as a practical support system for writing and consistency
- Auxiliary structures do not compete with chapter writing for product identity

### 5. Auth And Sync User Experience

Included:

- Sync progress UI
- Sync status presence in the workspace
- Auth-related user-facing gating that affects the writing flow

Target outcome:

- Sync remains available
- Sync no longer acts like a primary experience layer

## Features To Remove

These features should be removed, not merely hidden.

### 1. Onboarding And Tour Flow

Remove:

- `AIOnboardingDialog`
- `OnboardingTourDialog`
- Related onboarding dialog hooks and dead state plumbing

Rationale:

- The current workspace should not depend on a setup sequence before the user can write
- The current onboarding system is weakly connected and creates extra workflow branches
- A writing tool benefits more from immediate usefulness than from a scripted tour path

### 2. Preference Memory Feedback Flow

Remove:

- Assistant message action for recording preference deviation
- `PreferenceFeedbackDialog`
- Active preference-memory flow in the AI chat experience

Rationale:

- This is a heavy system for author-preference training without a strong present-day product loop
- It competes with simpler, more legible ways to steer the AI
- It adds UX complexity and data-model weight without being central to the writing path

### 3. Automatic Direction Confirmation Flow

Remove:

- `DirectionConfirmationCard`
- Auto-generation and auto-prompting logic that creates it from conversation history

Rationale:

- It duplicates the job of other direction-setting surfaces
- It interrupts the chat flow
- It increases the number of mental models for "how the AI remembers what I want"

### 4. Independent Charter Page Workflow

Remove:

- `/projects/[id]/charter` as a standalone workflow
- The product expectation that the user should go to a separate page to define creative direction

Rationale:

- The main writing experience should not have a second planning-and-alignment path living outside the workspace
- Long-form alignment is valuable, but it should live next to AI collaboration, not in a detached page

### 5. Scene Card As A First-Class Planning Layer

Remove:

- Scene-card-first planning flows
- Scene card creation as a main planning objective
- Scene-card-targeted AI planning actions

Rationale:

- Four planning levels are too much for the current product stage
- Scene cards are the least essential layer in the current chain
- Their removal meaningfully reduces model, UI, and AI-prompt complexity

## Features To Demote Or Collapse

These features remain in some form, but with reduced visibility or a narrower model.

### 1. Project Charter -> Lightweight Creative Direction

Keep:

- Underlying charter storage if useful for compatibility and AI context

Collapse to:

- One lightweight workspace-adjacent direction editor inside the AI panel

Retained fields:

- One-line premise
- Story promise
- Themes

Drop from first-class UI:

- Large standalone form structure
- Extended authoring-boundary sections as a primary workflow
- Separate page identity for charter authoring

Rationale:

- AI direction should live where AI collaboration happens
- The user needs a compact steering surface, not a second workspace

### 2. Sync System -> Background Infrastructure

Keep:

- Auth
- Sync queue
- Sync engine
- Data mapping needed for future cloud continuity

Demote:

- First-sync full-screen overlay
- Sync as a visually dominant or blocking experience

Retain only:

- Low-interruption sync status presence
- Failure handling that does not block local-first authoring

Rationale:

- Sync may matter later, but it is not the current product centerpiece
- The writing experience should feel local-first even if sync exists under the hood

### 3. Planning Model -> Light Planning

Change:

- From `idea -> arc -> chapterPlan -> sceneCard`
- To `arc -> chapterPlan`

Retain:

- High-level structural progression
- Chapter-level planning
- AI suggestions that help continue planning forward

Remove:

- Scene-card decomposition
- Planning as a multi-stage production pipeline

Rationale:

- This keeps long-form support while cutting the most expensive layer
- Users get guidance without being pushed into over-structuring

### 4. Story Tracker -> Auxiliary World Support

Keep:

- Story tracker as a support feature inside the world bible

Demote:

- Any temptation to treat it as a primary analysis system

Rationale:

- Long-running promises and consequences are real long-form problems
- Story tracker is still closer to actual author pain than more elaborate planning sublayers

## Information Architecture After Simplification

The workspace should have three clear first-order areas:

### 1. Chapters

- Default and primary workspace destination
- The main site of writing

### 2. World Bible

- Context support for the book and the AI
- Supporting layer, not a competing main destination

### 3. Planning

- Light planning only
- Structural support for long-form continuity

The right panel should be the AI collaboration surface, with:

- Chat
- Drafting
- Lightweight creative direction

The top bar should remain focused and quiet:

- Project identity
- Word counts
- Low-visibility sync state
- AI settings

## Data And Migration Strategy

The simplification should avoid high-risk cleanup migrations.

### Principle 1. Prefer Compatibility Reads Over Destructive Schema Churn

- Existing data can remain in storage if it no longer appears in the main product surface
- Old scene-card data does not need an immediate destructive cleanup path

### Principle 2. Narrow New Writes Before Removing Old Reads

- Continue reading broader charter data if needed for compatibility
- Restrict new UI writes to the lightweight creative-direction subset

### Principle 3. Do Not Introduce A Heavy Migration Just To Delete Product Complexity

- This work is a product simplification pass
- It should not become a schema-rewrite project

## Implementation Sequencing

The work should land in two stages.

### Stage 1. Product And UI Simplification

Objective:

- Make the user experience simpler first

Included:

- Remove onboarding and tour mounting
- Remove preference-memory feedback UI
- Remove automatic direction confirmation UI and logic
- Remove independent charter page workflow
- Remove first-sync blocking overlay
- Hide or remove scene-card planning entry points
- Replace charter UI exposure with lightweight AI-side direction editing

Expected result:

- The product immediately feels narrower, clearer, and more writing-centered

### Stage 2. Structural Cleanup

Objective:

- Remove the code and model complexity that no longer supports the simplified product

Included:

- Remove scene-card UI, hooks, AI actions, and tests
- Remove preference-memory usage paths and tests
- Remove dead onboarding state and dialog logic
- Remove direction-confirmation generation paths
- Reduce charter usage to the retained lightweight subset

Expected result:

- The repository reflects the simplified product instead of merely disguising old complexity

## Testing Strategy

Testing is centered on the strengthened primary workflow.

### Core Regression Priorities

Required verification areas:

- Workspace opens cleanly into the main authoring experience
- Chapter writing still works
- AI chat still works
- AI draft generation still works
- World bible entry creation and editing still work
- Relationship support still works
- Light planning still works after scene-card removal
- Export still works
- Sync and auth do not block local-first use

### Removal Validation

Also verify:

- No dead routes or broken links to removed charter flow
- No mounted components or state paths referring to removed onboarding
- No orphaned UI affordances for removed preference feedback
- No residual automatic direction-confirmation prompts
- No broken planning actions after the planning model is simplified

## Success Criteria

This simplification is successful when all of the following are true:

- The product presents one clear writing-first workflow
- AI steering is understandable through one lightweight mechanism instead of several overlapping systems
- Planning still supports long-form work without overwhelming the workspace
- Sync is present but no longer intrusive
- Removed features leave no broken routes, dead entry points, or hanging state flows
- The codebase meaningfully shrinks in active product complexity

## Risks And Controls

### Risk 1. AI Chat Panel Is Already Too Dense

Risk:

- Simplification work inside the AI panel could leave partial state paths or fragile conditionals

Control:

- Remove complete feature slices instead of branching them behind flags
- Re-test all remaining panel modes after each removal group

### Risk 2. Planning Has Cross-Layer Coupling

Risk:

- Scene-card removal affects workbench logic, AI planning actions, persistence, and tests

Control:

- Simplify the user-facing planning model first
- Then delete dependent code paths in a second cleanup stage

### Risk 3. Infrastructure UX Can Leave Half-Removed Product Paths

Risk:

- Sync and auth may still assume earlier blocking or onboarding-heavy flows

Control:

- Keep the infrastructure, but explicitly remove blocking presentation logic
- Verify local-first authoring still proceeds whether cloud capabilities are configured or not

## Deliverables

This simplification pass produces:

1. A narrower workspace centered on chapter writing, AI collaboration, world bible support, and light planning
2. Removal of redundant or weakly integrated feature systems
3. Reduced active complexity in workspace state, AI steering flows, and planning depth
4. A codebase that better matches the intended product identity

## Design Constraints

- Follow existing repository patterns where they still fit the simplified product
- Keep UI copy in Chinese
- Prefer deletion over abstraction when removing complexity
- Avoid writing migrations whose main purpose is cleanup theater
- Preserve future sync optionality without allowing sync to define the main UX
- Keep the planning layer intentionally smaller than the writing layer

## Implementation Handoff

The next step after this approved design is a concrete implementation plan that sequences:

- UI simplification first
- Structural cleanup second
- Targeted regression verification around the core writing loop
