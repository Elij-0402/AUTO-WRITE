---
phase: 01-project-chapter-foundation
plan: 01
subsystem: ui
tags: [next.js, dexie, indexeddb, nanoid, radix-ui, react-hook-form, zod, tailwind, vitest, chinese-first]

# Dependency graph
requires: []
provides:
  - "Next.js 16 application scaffold with TypeScript, Tailwind CSS, App Router"
  - "IndexedDB/Dexie.js data layer with shared meta DB and per-project DB"
  - "ProjectMeta and Chapter TypeScript types"
  - "useProjects hook with CRUD, soft-delete, reactive useLiveQuery"
  - "Project dashboard UI with card grid, creation modal, empty state"
  - "UI primitives: Button, Input, Textarea, Dialog, Select"
  - "Chinese-first root layout with zh-CN and Noto Sans SC font"
affects: [02-chapter-editor, 03-workspace-layout, 08-cloud-sync]

# Tech tracking
tech-stack:
  added: [next.js@16, dexie@4, nanoid@5, zustand@5, radix-ui/dialog, radix-ui/select, radix-ui/dropdown-menu, react-hook-form@7, zod@4, lucide-react, class-variance-authority, clsx, tailwind-merge, vitest@4, fake-indexeddb, @testing-library/react, @testing-library/jest-dom]
  patterns: [per-project-indexeddb-isolation, soft-delete-with-deletedAt, reactive-queries-with-useLiveQuery, chinese-first-ui, cva-button-variants, zod-form-validation]

key-files:
  created:
    - src/lib/db/meta-db.ts
    - src/lib/db/project-db.ts
    - src/lib/types/project.ts
    - src/lib/types/chapter.ts
    - src/lib/hooks/use-projects.ts
    - src/components/project/project-dashboard.tsx
    - src/components/project/project-card.tsx
    - src/components/project/create-project-modal.tsx
    - src/components/project/project-settings-form.tsx
    - src/components/project/empty-dashboard.tsx
    - src/components/ui/button.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/input.tsx
    - src/components/ui/textarea.tsx
    - src/components/ui/select.tsx
    - src/lib/utils/index.ts
    - vitest.config.ts
    - src/test/setup.ts
  modified:
    - package.json
    - tsconfig.json
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css

key-decisions:
  - "Per-project IndexedDB database (inkforge-project-{id}) for clean isolation, shared inkforge-meta for project index"
  - "Soft-delete pattern with deletedAt timestamp, filtered via useLiveQuery"
  - "NanoID for entity IDs — short, URL-safe, sync-friendly"
  - "Noto Sans SC as primary Chinese font with zh-CN lang attribute"
  - "Dexie useLiveQuery for reactive data binding without explicit provider"
  - "Zod v4 with zod/v4 import path for form validation"
  - "Class Variance Authority for Button variants instead of custom implementation"

patterns-established:
  - "Per-project DB isolation: createProjectDB(projectId) factory pattern"
  - "Soft-delete: deletedAt field + filter(p => p.deletedAt === null) in queries"
  - "Chinese-first UI: all labels/buttons/menus in Simplified Chinese, no i18n layer"
  - "Form validation: React Hook Form + Zod resolver pattern"
  - "Component organization: ui/ for primitives, project/ for domain components"
  - "CVA button variants: primary/secondary/danger/ghost × sm/md/lg/icon"

requirements-completed: [PROJ-01, PROJ-02, L10N-01]

# Metrics
duration: 24min
completed: 2026-04-13
---

# Phase 1 Plan 1: Project & Chapter Foundation Summary

**Next.js 16 scaffold with Dexie.js per-project IndexedDB, ProjectMeta/Chapter types, useProjects hook, and Chinese-first project dashboard with card grid, creation modal, and soft-delete**

## Performance

- **Duration:** 24 min
- **Started:** 2026-04-13T14:08:29Z
- **Completed:** 2026-04-13T14:32:59Z
- **Tasks:** 2
- **Files modified:** 40

## Accomplishments
- Scaffolded complete Next.js 16 app with TypeScript, Tailwind CSS, and App Router
- Implemented Dexie.js data layer with shared meta DB and per-project DB isolation pattern
- Created ProjectMeta and Chapter TypeScript types matching D-22 through D-27 decisions
- Built useProjects hook with useLiveQuery reactive queries, CRUD, soft-delete, and restore
- Built Chinese-first project dashboard with responsive card grid, empty state, creation modal, and inline title editing
- All 10 Vitest tests passing, Next.js production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js app + Dexie.js data layer + TypeScript types** - `8c38e63` (feat)
2. **Task 2: Project dashboard UI — card grid, creation modal, empty state** - `089558a` (feat)

## Files Created/Modified
- `src/lib/db/meta-db.ts` - InkForgeMetaDB with projectIndex table for shared metadata
- `src/lib/db/project-db.ts` - InkForgeProjectDB factory for per-project databases
- `src/lib/types/project.ts` - ProjectMeta and CreateProjectInput interfaces
- `src/lib/types/chapter.ts` - Chapter and ChapterStatus types
- `src/lib/hooks/use-projects.ts` - useProjects hook with useLiveQuery, CRUD operations
- `src/components/project/project-dashboard.tsx` - Dashboard grid with empty state, create modal, delete confirmation
- `src/components/project/project-card.tsx` - Card with gradient cover, inline title edit, genre badge, 字数, relative time
- `src/components/project/create-project-modal.tsx` - Zod-validated form with 标题/类型/简介 fields
- `src/components/project/project-settings-form.tsx` - Full metadata editing form for project workspace
- `src/components/project/empty-dashboard.tsx` - Empty state with 创建你的第一本小说 CTA
- `src/components/ui/button.tsx` - CVA-powered button with primary/secondary/danger/ghost variants
- `src/components/ui/dialog.tsx` - Radix Dialog wrapper with Chinese close label
- `src/components/ui/input.tsx` - Styled input with IME support
- `src/components/ui/textarea.tsx` - Styled textarea for synopsis
- `src/components/ui/select.tsx` - Radix Select wrapper for genre dropdown
- `src/lib/utils/index.ts` - cn() utility with clsx + tailwind-merge
- `src/app/layout.tsx` - Root layout with zh-CN lang, Noto Sans SC font
- `src/app/page.tsx` - Root page rendering ProjectDashboard
- `src/app/globals.css` - Chinese-first base styles with CJK line-height
- `vitest.config.ts` - Vitest config with jsdom, React plugin, path aliases
- `src/test/setup.ts` - Test setup with jest-dom matchers and fake-indexeddb

## Decisions Made
- Used Dexie useLiveQuery instead of DexieProvider — simpler API, no wrapper needed
- Used Zod v4 with `zod/v4` import path — required by @hookform/resolvers compatibility
- Used CVA for Button variants — cleaner than manual className conditionals
- Skipped Dexie reading hooks for soft-delete filtering — useLiveQuery + filter() is simpler and more explicit
- Used gradient-based cover placeholder instead of image — no cover upload feature in v1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Zod v4 import path change**
- **Found during:** Task 2 (CreateProjectModal with @hookform/resolvers)
- **Issue:** @hookform/resolvers requires Zod v4 with `zod/v4` import path, not `zod` directly
- **Fix:** Changed `import { z } from 'zod'` to `import { z } from 'zod/v4'` in form components
- **Files modified:** src/components/project/create-project-modal.tsx, src/components/project/project-settings-form.tsx
- **Verification:** Build succeeds, no TypeScript errors
- **Committed in:** 089558a (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added IME composition handling to inline title edit**
- **Found during:** Task 2 (ProjectCard inline title editing)
- **Issue:** Chinese IME composition can trigger premature save on Enter key during composition
- **Fix:** Added `onCompositionEnd` handler and `isComposing` check in `handleTitleKeyDown`
- **Files modified:** src/components/project/project-card.tsx
- **Verification:** Inline edit works with Chinese input
- **Committed in:** 089558a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both auto-fixes essential for Chinese-first functionality. No scope creep.

## Issues Encountered
None

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| Cover image upload | src/components/project/project-settings-form.tsx | 131 | "封面功能即将推出" — Cover upload feature deferred to future plan |
| Cover image placeholder | src/components/project/project-card.tsx | 121 | Uses ID-based gradient instead of image — no cover upload in v1 |

These stubs are intentional and do not block the plan's goal. Cover image upload is a nice-to-have feature not in v1 scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Next.js app scaffolded and building successfully
- Data layer (IndexedDB/Dexie.js) ready for Phase 2 chapter editor integration
- UI primitives and component patterns established for reuse
- useProjects hook can be extended for chapter operations in Plan 02
- Ready for Plan 02: Chapter management with drag-reorder sidebar

## Self-Check: PASSED

- All 5 key files verified present on disk
- Both task commits (8c38e63, 089558a) found in git log
- 10/10 Vitest tests passing
- Next.js production build succeeds

---
*Phase: 01-project-chapter-foundation*
*Completed: 2026-04-13*
