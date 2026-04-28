# Stability Audit And Performance Hardening Design

Date: 2026-04-28
Project: InkForge
Status: Approved for spec drafting

## Summary

This design defines the first phase of a repository-wide stability audit for InkForge. The phase covers the core creation workflow plus the data and sync layer, with priority ordered as:

1. Stability of the core writing workflow
2. Data correctness and recovery behavior
3. Performance issues that directly contribute to instability

The work is evidence-driven. The first step is to establish a baseline through linting, tests, builds, and targeted workflow checks. Fixes are only included in this phase when they are supported by concrete evidence, fit within current module boundaries, and can be verified without turning the effort into a large refactor.

## Goals

- Identify and rank real defects in the core authoring workflow
- Identify and rank data correctness risks in IndexedDB, migrations, queries, and sync behavior
- Fix bounded, verifiable issues that block stability or materially weaken recovery behavior
- Address low-risk performance hotspots when they directly amplify instability, repeated writes, or user-facing latency
- Produce a clear list of deferred issues that should not be forced into this phase

## Non-Goals

- Large UI redesigns
- Cross-cutting architectural rewrites
- Refactors done primarily for code style or file organization
- Pure performance tuning that has no direct stability or correctness impact
- Broad feature work outside the audited workflow

## Scope

This phase covers six review surfaces.

### 1. Project Entry And Workspace Initialization

Included:

- Project page loading
- Authenticated layout initialization
- Sidebar navigation switching
- Default chapter and panel state
- Empty-state and invalid-project handling

Failure criteria:

- White screens
- Render loops
- Null access in critical panels
- Broken navigation state

### 2. Chapter Editing Workflow

Included:

- Chapter switching
- Editor initialization
- Body editing
- Word count and draft state
- History drawer behavior
- Context injection adjacent to editing

Failure criteria:

- Content loss
- Cross-chapter state leakage
- Incorrect saved-state indicators
- Editor instability caused by state synchronization churn

### 3. Autosave And Local Persistence

Included:

- Autosave hooks
- Dexie write behavior
- Debounce or throttle behavior
- Recovery after navigation or refresh

Failure criteria:

- Silent save failures
- Repeated write storms
- Save races that overwrite newer content
- Recovery restoring stale content

### 4. AI Chat And Suggestions Workflow

Included:

- Provider configuration reads
- Pre-request validation
- Context assembly
- Message rendering
- Structured suggestion landing
- Error handling and recovery

Failure criteria:

- Missing or invalid provider state crashing the workspace
- Error handling that is invisible or non-recoverable
- Session state pollution after failed AI interactions

### 5. IndexedDB, Migrations, And Queries

Included:

- `src/lib/db/project-db.ts`
- Migration coverage and migration behavior
- Query modules for project, chapter, planning, world, relation, revisions, and related data access
- Version history and recovery-relevant persistence behavior

Failure criteria:

- Migration instability
- Query crashes on empty, old, or partial records
- Incorrect results that affect core writing or recovery behavior

### 6. Sync Queue And Sync Engine

Included:

- Queue state transitions
- Retry and failure handling
- Field mapping
- Behavior when Supabase is unconfigured or unavailable

Failure criteria:

- Sync failure blocking local-first usage
- Misreported sync state
- Degraded offline behavior when cloud sync is not enabled

## Performance Boundary

Performance work is deliberately narrow in this phase. Only these categories are in scope:

- Repeated renders or repeated queries that already affect interaction stability
- High-frequency no-op or duplicate writes that increase save or sync risk
- Low-cost hotspots that cause visible lag or brittle tests inside the audited workflow

The following are out of scope for this phase:

- Broad rendering strategy rewrites
- New caching layers
- Bundle-size optimization unrelated to audited failures
- Performance cleanup in modules outside the audited workflow

## Execution Model

The work proceeds in four bounded stages.

### Stage 1. Baseline Audit

Run and record baseline results for:

- `pnpm lint`
- `pnpm test`
- `pnpm build`

Then run targeted checks for the highest-risk workflow areas, using focused tests or e2e coverage where needed.

The purpose of this stage is not immediate cleanup. It is to establish what is currently failing, what is brittle, and what appears slow or unstable.

### Stage 2. Evidence Collection And Triage

Every issue must be attached to at least one concrete source of evidence:

- A failing or flaky test
- A build or lint error
- A deterministic workflow failure
- A measurable and explainable performance symptom tied to a code hotspot

Suspicions without evidence are recorded as observations and do not enter the fix queue for this phase.

### Stage 3. Bounded Remediation

An issue is eligible for direct repair in this phase only if all of the following are true:

- It has concrete evidence
- It can be resolved within the current module boundaries
- It can be verified with tests or explicit regression steps
- It does not require a broad refactor to land safely

Issues that require cross-system redesign are deferred into a later workstream, even if they are real.

### Stage 4. Regression Verification

After each repair group, rerun targeted verification for the affected area. At the end of the phase, rerun project-level verification to confirm no new regressions were introduced.

Final outcomes must distinguish between:

- Fixed and verified
- Confirmed but deferred
- Observed but not reproduced

## Severity Model

### P0

Core writing workflow blockers, including:

- White screens
- Crashes
- Data loss
- Core workflow interruption

### P1

Data correctness and recovery issues, including:

- Migration safety
- Persistence correctness
- Recovery behavior
- Sync-state truthfulness

### P2

Performance issues directly tied to stability, including:

- Duplicate saves
- Repeated renders that destabilize interaction
- Query hotspots causing visible lag in the audited workflow

### P3

Deferred improvements, including:

- Structural cleanup
- Nice-to-have experience polish
- Refactors without immediate stability return

## Testing Strategy

Testing is risk-based and aligned to the repaired surface.

### Baseline Verification

Required baseline commands:

- `pnpm lint`
- `pnpm test`
- `pnpm build`

Baseline failures are first classified, not flattened into a single bucket.

### Targeted Verification

Priority order:

1. Reuse or extend existing unit and component tests where the module already has coverage
2. Use targeted Vitest coverage for Dexie queries, migrations, autosave, and sync queue behavior
3. Use focused Playwright coverage only where page-level workflow behavior cannot be validated lower in the stack

### Completion Criteria

This phase is complete when:

- High-priority stability issues within scope have been handled in priority order
- Every applied fix has verification evidence
- Deferred issues are documented with explicit reasons for postponement
- No new lint, test, or build regressions were introduced by the repairs

## Deliverables

This phase produces three outputs:

1. A ranked audit summary describing current system risk by area
2. A bounded set of verified fixes with affected modules and validation evidence
3. A deferred-issues list explaining what should move to a later workstream and why

## Design Constraints

- Follow existing repository patterns for Next.js App Router, React hooks, Dexie query modules, and local-first behavior
- Keep UI copy in Chinese if UI-facing changes become necessary during remediation
- Prefer narrowly scoped fixes over abstraction work
- Add tests proportionally to risk and blast radius
- Do not use this phase as cover for unrelated refactoring

## Implementation Handoff

The next step after this approved design is a written implementation plan that turns the audit model above into a concrete execution checklist. The plan should sequence baseline commands, triage steps, remediation criteria, and verification order.
