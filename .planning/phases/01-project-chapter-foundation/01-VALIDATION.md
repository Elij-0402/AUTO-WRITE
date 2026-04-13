---
phase: 01
slug: project-chapter-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (with jsdom) |
| **Config file** | vitest.config.ts (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PROJ-01, PROJ-02 | — | N/A | unit | `npx vitest run src/lib/db/__tests__/` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | PROJ-01, PROJ-02, L10N-01 | — | N/A | unit | `npx vitest run src/components/project/__tests__/` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | PROJ-03, PROJ-04 | — | N/A | unit | `npx vitest run src/lib/db/__tests__/` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | PROJ-03, PROJ-04, L10N-01 | — | N/A | unit | `npx vitest run src/components/chapter/__tests__/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with jsdom environment
- [ ] `src/lib/db/__tests__/database.test.ts` — stubs for database operations
- [ ] `src/components/project/__tests__/` — stubs for project component tests
- [ ] `src/components/chapter/__tests__/` — stubs for chapter component tests
- [ ] `vitest` + `@testing-library/react` + `@testing-library/jest-dom` installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-reorder chapters feels smooth | PROJ-04 | Interaction quality is subjective | Drag 5+ chapters in different directions, verify order persists |
| Chinese text displays correctly in all UI | L10N-01 | Font rendering and CJK layout | Check dashboard, project workspace, all modals for correct Chinese display |
| Auto-save triggers on window blur | D-21 | Browser event simulation unreliable | Type in editor, switch tabs, return and verify content persisted |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
