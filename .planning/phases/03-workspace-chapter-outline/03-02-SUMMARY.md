---
phase: 03-workspace-chapter-outline
plan: 02
subsystem: outline-ui
tags: [sidebar-tabs, outline-tab, outline-form, autosave, navigation]

requires:
  - phase: 03-workspace-chapter-outline
    provides: ResizablePanel, Chapter type with outline fields, useLayout hook, useChapters hook, updateOutlineFields

provides:
  - Sidebar with chapter/outline tab switching per D-13
  - OutlineTab component showing outline entries with status color dots
  - OutlineEditForm with title, auto-growing summary, target word count, status dropdown, timestamps
  - Previous/Next sequential navigation between outline entries per D-20
  - Auto-save for outline fields with 500ms debounce per D-25
  - Escape key to close outline editing form

affects: [03-workspace-chapter-outline]

tech-stack:
  added: []
  patterns: [sidebar-tab-navigation, auto-growing-textarea, outline-autosave-debounce]

key-files:
  created:
    - src/components/outline/outline-tab.tsx
    - src/components/outline/outline-edit-form.tsx
  modified:
    - src/components/chapter/chapter-sidebar.tsx
    - src/app/projects/[id]/page.tsx

key-decisions:
  - "Used native HTML select for status dropdown (simpler than Radix UI Select for 3-option dropdown)"
  - "Auto-grow textarea uses scrollHeight technique with minHeight of 5rem (3 rows)"
  - "Dynamic import avoided — OutlineEditForm imported normally since it's needed immediately on tab switch"
  - "Escape key handler added for closing outline editing form"

patterns-established:
  - "Sidebar tab pattern: header with tab buttons controlling conditional rendering"
  - "Auto-growing textarea: ref-based scrollHeight technique with useEffect on value change"
  - "Outline form auto-save: useAutoSave hook with 500ms debounce for summary, word count, and status fields separately from title renameChapter"

requirements-completed: [WORK-02, WORK-03, OTLN-01]

duration: 7min
completed: 2026-04-14
---

# Phase 3 Plan 2: Outline UI Layer Summary

**Sidebar tabs with chapter/outline switching, outline entry list with status dots, and auto-saving outline editing form in the editor area**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-14T05:04:08Z
- **Completed:** 2026-04-14T05:11:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Sidebar now has "章节" (chapters) and "大纲" (outline) tabs with instant switching per D-13
- Active tab persists across browser sessions via useLayout/IndexedDB per D-14
- Creating a chapter stays on current tab per D-15
- Outline tab shows entries with colored status dots (gray/blue/green) per D-16
- Empty outline entries show "还没有大纲" with clickable "编辑" button per D-19
- Clicking an outline entry switches editor area to outline editing form per D-17
- OutlineEditForm displays title, auto-growing summary, target word count, status dropdown per D-22
- Word count comparison shows "目标: X字 / 当前: Y字" format per D-23
- Previous/Next navigation moves between chapters sequentially per D-20
- Auto-save with 500ms debounce for outline fields and title per D-25
- Escape key closes outline editing form
- Status dropdown shows Chinese labels (未开始/进行中/已完成) per D-07

## Task Commits

Each task was committed atomically:

1. **Task 1: Sidebar tabs and outline tab list** - `fd8f623` (feat)
2. **Task 2: Outline editing form** - `0b4eea0` (feat)

## Files Created/Modified
- `src/components/outline/outline-tab.tsx` - Outline entry list with status dots, drag-reorder, and click-to-edit
- `src/components/outline/outline-edit-form.tsx` - Outline editing form with auto-grow textarea, status dropdown, word count, prev/next navigation
- `src/components/chapter/chapter-sidebar.tsx` - Refactored: added tab bar (章节/大纲), tab content switching, passes tab/outline state props
- `src/app/projects/[id]/page.tsx` - Added activeTab, activeOutlineId state, outline navigation, Escape key handler, tab-aware placeholder

## Decisions Made
- Used native HTML `<select>` for status dropdown (3 options: 未开始/进行中/已完成) — simpler than Radix UI Select for this use case
- Auto-grow textarea uses scrollHeight technique with `minHeight: 5rem` (≈3 rows) as minimum
- OutlineEditForm imported normally (not dynamic) since it's needed immediately on tab switch
- Escape key handler added to page-level component for closing outline editing form

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Outline UI layer complete with tab switching, entry list, and editing form
- Ready for Phase 4 features to build on sidebar and outline patterns
- All existing features (chapter DnD, editor, autosave, resizable panels) still work correctly
- 30 tests pass, TypeScript compilation clean

---
*Phase: 03-workspace-chapter-outline*
*Completed: 2026-04-14*

## Self-Check: PASSED

- All 4 key files confirmed on disk (outline-tab.tsx, outline-edit-form.tsx, chapter-sidebar.tsx, page.tsx)
- Both task commits found in git history: fd8f623, 0b4eea0
- All 30 tests passing
- TypeScript compilation clean (no new errors in changed files)