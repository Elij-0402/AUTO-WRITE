---
phase: 02-writing-editor
plan: "04"
subsystem: editor
tags: [word-count, autosave, delta-tracking, hooks]

# Dependency graph
requires:
  - phase: 02-writing-editor
    provides: chapter-queries word count, use-word-count hook, autosave hook
provides:
  - Real-time today's word count updates on each autosave
  - Exported computeWordCount and extractTextFromContent functions
affects: [02-writing-editor, project-top-bar]

# Tech tracking
tech-stack:
  added: []
  patterns: [positive-delta-word-count, ref-based-delta-tracking]

key-files:
  created: []
  modified:
    - src/lib/db/chapter-queries.ts
    - src/lib/hooks/use-chapter-editor.ts

key-decisions:
  - "Only positive deltas tracked — deleting text never reduces today's word count"
  - "prevWordCountRef initialized from chapter.wordCount on chapter load, not recomputed from content"

patterns-established:
  - "Positive-delta-only word count tracking: only net increases contribute to daily progress"
  - "Ref-based delta computation: useRef tracks previous state to compute diff without re-renders"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-04-14
---

# Phase 02 Plan 04: Gap Closure — Today's Word Count Wiring Summary

**Wire updateTodayWordCount into autosave flow so daily writing progress increments in real-time**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-13T18:20:53Z
- **Completed:** 2026-04-13T18:24:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Exported computeWordCount and extractTextFromContent from chapter-queries.ts for reuse
- Wired updateTodayWordCount into useChapterEditor's autosave callback with positive-delta-only logic
- Authors now see daily writing progress increment as they type, with deletions not reducing the count

## Task Commits

Each task was committed atomically:

1. **Task 1: Export computeWordCount from chapter-queries.ts** - `715014e` (feat)
2. **Task 2: Wire updateTodayWordCount into useChapterEditor** - `6004d84` (feat)

## Files Created/Modified
- `src/lib/db/chapter-queries.ts` - Exported computeWordCount and extractTextFromContent (previously private functions)
- `src/lib/hooks/use-chapter-editor.ts` - Added prevWordCountRef, imported computeWordCount and updateTodayWordCount, wired delta tracking into autosave

## Decisions Made
- Only positive deltas tracked — deleting text does not reduce today's word count (matches real-world writing progress)
- prevWordCountRef initialized from chapter.wordCount (stored value) when a chapter loads, ensuring accurate baseline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Today's word count now tracks incremental writing progress in real-time
- The top bar component (from plan 02-03) can display the reactive todayWordCount value
- Deletions correctly do not reduce the daily count
- Ready for Phase 03 (world-building wiki) or additional editor features

## Self-Check: PASSED

- [x] `src/lib/db/chapter-queries.ts` — FOUND
- [x] `src/lib/hooks/use-chapter-editor.ts` — FOUND
- [x] `.planning/phases/02-writing-editor/02-04-SUMMARY.md` — FOUND
- [x] Commit `715014e` — FOUND (Task 1)
- [x] Commit `6004d84` — FOUND (Task 2)

---
*Phase: 02-writing-editor*
*Completed: 2026-04-14*