# Phase 1: Project & Chapter Foundation — Research

**Date:** 2026-04-13
**Status:** Complete

## Standard Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | Next.js (App Router) | 15.x | React framework per PROJECT.md constraint; App Router for modern patterns |
| UI Language | React 19 | 19.x | Latest stable, concurrent features, better Suspense |
| Type System | TypeScript | 5.x | Type safety for data models, catch errors at compile time |
| Styling | Tailwind CSS | 4.x | Utility-first, rapid prototyping, Chinese-first design tokens easy |
| Local Storage | Dexie.js | 4.x | IndexedDB wrapper per D-18: clean API, schema migrations, transactions |
| ID Generation | nanoid | 5.x | Short, URL-safe IDs per D-26 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | 6.x | Modern React DnD, accessible, performant, chapter reorder (D-12) |
| State Management | Zustand | 5.x | Lightweight, no boilerplate, works with IndexedDB subscriptions |
| Component Library | Radix UI + custom | latest | Unstyled, accessible primitives — build Chinese-first design on top |
| Forms/Validation | React Hook Form + Zod | latest | Type-safe validation for project creation modal (D-03) |
| Icons | Lucide React | latest | Clean icon set, tree-shakeable |

## Architecture Patterns

### Next.js App Router Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (Chinese fonts, providers)
│   ├── page.tsx            # Dashboard (project list)
│   └── projects/
│       └── [id]/
│           ├── layout.tsx  # Project workspace layout
│           └── page.tsx    # Chapter view (sidebar + editor placeholder)
├── components/             # Shared components
│   ├── ui/                 # Base UI primitives (Radix + Tailwind)
│   ├── project/            # Project-specific components
│   └── chapter/            # Chapter-specific components
├── lib/                    # Business logic & utilities
│   ├── db/                 # Dexie.js database layer
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
└── styles/                 # Global styles, Tailwind config
```

### IndexedDB/Dexie.js Data Model
Per D-19: per-project database. Per D-24: chapters as flat array under project. Per D-27: soft deletion with `deletedAt`.

```typescript
// Database schema
class InkForgeDB extends Dexie {
  projects!: Table<Project>
  chapters!: Table<Chapter>

  constructor(projectId: string) {
    super(`inkforge-${projectId}`)
    this.version(1).stores({
      projects: 'id, title, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt'
    })
  }
}

// Shared metadata database (project list, settings)
class InkForgeMetaDB extends Dexie {
  projectIndex!: Table<ProjectMeta>

  constructor() {
    super('inkforge-meta')
    this.version(1).stores({
      projectIndex: 'id, title, updatedAt, deletedAt'
    })
  }
}
```

**Important design consideration:** Per D-19, each project gets its own IndexedDB database. However, the project list dashboard needs a metadata index. Use a shared `inkforge-meta` database for the project index (title, word count, timestamps, genre) and per-project databases (`inkforge-{projectId}`) for chapters and project details. This gives clean isolation while keeping the dashboard queryable.

### Key Architecture Decisions

1. **Client-side rendering** — Phase 1 is entirely client-side (IndexedDB, no auth). Use `'use client'` directives. Next.js pages serve as routing shell only.

2. **Optimistic updates** — All mutations are local IndexedDB writes. No server round-trips. UI updates immediately, Dexie handles persistence.

3. **Auto-save pattern** — Per D-21: event-driven save on content change debounce, chapter switch, and window blur. Use `useEffect` + `debounce` pattern.

4. **Chapter numbering** — Per D-16: auto-generated "第N章" prefix. Number derived from chapter's position in the ordered array, NOT stored as a field. When chapters are reordered, numbers update automatically.

### Component Architecture

**Dashboard (project list):**
- `ProjectDashboard` — grid container, empty state, "创建你的第一本小说" CTA (D-08)
- `ProjectCard` — cover image + title + metadata (D-01, D-02)
- `CreateProjectModal` — form with title, genre, synopsis fields (D-03)
- `ProjectSettings` — full edit form within workspace (D-07)

**Project workspace:**
- `ProjectWorkspace` — layout with sidebar + main content area
- `ChapterSidebar` — sortable chapter list (D-09)
- `ChapterRow` — chapter number + title + word count + status + ⋯ menu (D-10, D-13)
- `ChapterContextMenu` — rename, delete, duplicate, move (D-13)
- `CreateChapterInput` — inline creation at bottom (D-11)

**Drag & Drop:**
- Use `@dnd-kit/sortable` with `SortablContext` on the chapter list
- `onDragEnd` updates chapter order in IndexedDB

## Don't Hand-Roll

| What | Use Instead | Why |
|------|------------|-----|
| IndexedDB raw API | Dexie.js | Transactions, migrations, query syntax, error handling |
| UUID generation | nanoid | Shorter, URL-safe, sync (no crypto overhead) |
| Drag & drop logic | @dnd-kit | Accessibility built-in, React integration, collision detection |
| Form state | React Hook Form | Validation, dirty tracking, performance (less re-renders) |
| Schema validation | Zod | Runtime type safety, composable schemas |
| Modal/Dialog | Radix UI Dialog | Focus trap, accessibility, portal rendering |
| Dropdown menu | Radix UI DropdownMenu | Keyboard nav, click-outside, accessible |
| Confirmation dialogs | Custom on top of Radix Dialog | Soft delete confirmations (D-06, D-15) |

## Common Pitfalls

1. **IndexedDB storage limits** — Browsers may prompt users or clear data when storage is full. Implement storage quota checks and graceful degradation.

2. **Dexie.js per-project DB pattern** — Opening many databases simultaneously can leak connections. Implement a connection pool or cache that closes unused DBs after a timeout.

3. **@dnd-kit with virtualized lists** — Not an issue for Phase 1 (novel chapters rarely exceed 500), but be aware if chapters grow very long.

4. **Chinese IME in input fields** — React `onChange` can fire during IME composition. Use `compositionstart`/`compositionend` events to avoid processing partial input. This is critical for the chapter title inline creation (D-11) and project creation modal (D-03).

5. **Next.js App Router + client-only** — Since Phase 1 is entirely client-side, all interactive components need `'use client'`. Don't accidentally create server components that try to access IndexedDB.

6. **Soft delete queries** — Every query must filter `deletedAt === null` by default. Create Dexie hooks or query helpers that auto-exclude soft-deleted records.

7. **Word count (字数) for Chinese** — Chinese "word count" is actually character count (字数), not word count. Use `String.length` for CJK text, not word-boundary splitting. For mixed CJK/Latin text, count all characters minus whitespace.

8. **NanoID in IndexedDB** — NanoID generates URL-safe strings but IndexedDB keys can be any string. No issues, but ensure IDs are generated client-side before Dexie insert (don't rely on auto-increment).

## Validation Architecture

### Dimensions for Plan Checker

1. **Decision coverage** — Every D-01 through D-27 must be implemented in at least one task
2. **Requirement coverage** — PROJ-01, PROJ-02, PROJ-03, PROJ-04, L10N-01 must all be addressed
3. **Chinese-first** — All UI strings must be Simplified Chinese, not English with i18n layer
4. **Data model integrity** — Schema must support soft delete, chapter ordering, per-project DB isolation
5. **Auto-save reliability** — Content must persist on debounce, chapter switch, and window blur
6. **Drag-reorder correctness** — Chapter order must persist after reorder, numbers must update
7. **Empty states** — Dashboard and project workspace must handle zero-data states gracefully
8. **Cross-phase compatibility** — Data model must support Phase 2 (editor), Phase 3 (workspace), Phase 8 (cloud sync)

---

*Phase: 01-project-chapter-foundation*
*Research completed: 2026-04-13*
