# Phase 1: Project & Chapter Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 01-project-chapter-foundation
**Areas discussed:** Project list & navigation, Chapter management UI, Data storage strategy, Project data model

---

## Project list & navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Card grid | Cover image + title + metadata in responsive grid — visual, good for novels with covers | ✓ |
| Table/list | Compact rows with columns — sorts well, shows more projects per screen | |
| Sidebar + detail | Project list in sidebar, detail on right — always visible when working | |

**User's choice:** Card grid
**Notes:** Visual presentation for novels, aligns with "bookshelf" metaphor

| Option | Description | Selected |
|--------|-------------|----------|
| Key metadata | Title, last edited, word count, genre — enough to identify and prioritize | ✓ |
| Minimal | Title and last edited only — fast to scan | |
| Rich preview | Title, cover, genre, word count, dates, synopsis excerpt — everything at a glance | |

**User's choice:** Key metadata
**Notes:** Balanced density for Phase 1

| Option | Description | Selected |
|--------|-------------|----------|
| Modal | Quick dialog from dashboard — stays in context | ✓ |
| Dedicated page | Separate form page — more room but breaks flow | |
| Inline expand | Expand card to form — minimal disruption, limited space | |

**User's choice:** Modal

| Option | Description | Selected |
|--------|-------------|----------|
| Project workspace | One project at a time, full-screen workspace after opening | ✓ |
| Sidebar navigation | Always-visible sidebar listing all projects | |
| Tab-based switcher | Browser-like tabs for multiple open projects | |

**User's choice:** Project workspace
**Notes:** Consistent with chapter-per-editor-instance model

| Option | Description | Selected |
|--------|-------------|----------|
| Recent first | Show recent projects first, with "View All" | ✓ |
| Manual ordering | User sets order via drag or pinning | |
| Alphabetical + filters | Alphabetical by title, filter by genre/status | |

**User's choice:** Recent first

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete + confirmation | Data preserved for grace period before permanent removal | ✓ |
| Hard delete after confirm | Immediate permanent removal | |
| Archive then delete | Two-step: archive first, delete from archive separately | |

**User's choice:** Soft delete + confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Project settings page | Dedicated page within the workspace | |
| Quick edit on card | Inline editing on the card or dropdown | |
| Both | Quick edit for title/genre on card, full settings for metadata | ✓ |

**User's choice:** Both quick edit and full settings page

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly empty state | Illustration + "创建你的第一本小说" button | ✓ |
| Minimal empty state | Simple text + button | |
| Demo project included | Pre-loaded sample project | |

**User's choice:** Friendly empty state
**Notes:** Chinese-first copy from the start

---

## Chapter management UI

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar list | Left sidebar with chapters, editor on right | ✓ |
| Tab bar | Tabs across top of editor | |
| Separate page | Chapter list page, then navigate to editor | |

**User's choice:** Sidebar list

| Option | Description | Selected |
|--------|-------------|----------|
| Title + number | Simple, readable | |
| Rich info per row | Chapter number, title, word count, status | ✓ |
| Minimal | Title only, nuance on hover | |

**User's choice:** Rich info per row

| Option | Description | Selected |
|--------|-------------|----------|
| Inline add | Bottom of sidebar list — stays in context | ✓ |
| Modal | Dialog for title + position | |
| Instant untitled | Auto-create "Untitled Chapter", edit later | |

**User's choice:** Inline add

| Option | Description | Selected |
|--------|-------------|----------|
| Drag-and-drop | Visual reordering in sidebar | ✓ |
| Up/down buttons | Keyboard-friendly, less error-prone | |
| Both methods | Drag-drop and keyboard buttons | |

**User's choice:** Drag-and-drop
**Notes:** Satisfies PROJ-04 requirement

| Option | Description | Selected |
|--------|-------------|----------|
| Inline/context menu | Click to edit, right-click actions | |
| Three-dot menu | ⋯ menu with rename, delete, duplicate, move | ✓ |
| Toolbar actions | Buttons above chapter list for selected chapter | |

**User's choice:** Three-dot menu

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-save | Save every few seconds automatically | |
| Auto-save + manual shortcut | Auto-save with Ctrl+S for peace of mind | |
| Auto-save (event-driven) | Event-driven: on content change debounce, chapter switch, window blur | ✓ |

**User's choice:** Auto-save (event-driven)
**Notes:** Captured as event-driven auto-save in final decisions

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete + trash | Chapter moves to trash, restorable | ✓ |
| Hard delete after confirm | Permanent removal after confirmation | |
| Archive then purge | Strike-through state, separate purge action | |

**User's choice:** Soft delete + trash

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-numbered "第N章" | Auto prefix, user provides title only | ✓ |
| Manual numbering | User provides number and title | |
| Auto-number + optional title | Can be titled or untitled, numbered anyway | |

**User's choice:** Auto-numbered "第N章"
**Notes:** Chinese web novel convention

---

## Data storage strategy

| Option | Description | Selected |
|--------|-------------|----------|
| IndexedDB | Browser-native structured DB, indexes, transactions, best sync foundation | ✓ |
| localStorage | Simple key-value, easy start but poor sync, size limits | |
| Filesystem-based | In-memory + periodic file persist, desktop-only | |

**User's choice:** IndexedDB

| Option | Description | Selected |
|--------|-------------|----------|
| Dexie.js wrapper | Clean API, migrations, queries, widely used | ✓ |
| Raw IndexedDB | No dependency, but verbose and hard to maintain | |
| State manager abstraction | Zustand persist middleware to IndexedDB | |

**User's choice:** Dexie.js wrapper

| Option | Description | Selected |
|--------|-------------|----------|
| Per-project database | Clean isolation, sync per project, easy delete | ✓ |
| Single shared database | Cross-project queries, harder sync isolation | |
| Per-project + global index | One DB per project + global metadata DB | |

**User's choice:** Per-project database

| Option | Description | Selected |
|--------|-------------|----------|
| Dexie migrations | Built-in version system, upgrade paths in code | ✓ |
| Custom migration scripts | More control, more code | |
| Schema-per-session | Auto-create at runtime, no formal upgrade path | |

**User's choice:** Dexie migrations

| Option | Description | Selected |
|--------|-------------|----------|
| Timed auto-save | Every ~3 seconds | |
| Event-driven save | On content change debounce, chapter switch, window blur | ✓ |
| Per-keystroke debounce | Save after every keystroke with 500ms debounce | |

**User's choice:** Event-driven save

---

## Project data model

| Option | Description | Selected |
|--------|-------------|----------|
| Core metadata | Title, genre, synopsis, cover, word count, timestamps | ✓ |
| Core + writing tracking | Core + status, target word count, tags | |
| Core + extensible | Core + custom fields (pen name, publication target) | |

**User's choice:** Core metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Rich-text blob | Raw HTML/rich-text, preserves all formatting | |
| Structured JSON doc | ProseMirror/Tiptap format — queryable, diffable, sync-friendly | ✓ |
| Markdown string | Human-readable, portable, loses rich formatting | |

**User's choice:** Structured JSON doc (ProseMirror/Tiptap format)

| Option | Description | Selected |
|--------|-------------|----------|
| Flat chapter list | Array of chapters under project — simple reorder | ✓ |
| Normalized with FK | Independent chapter records with projectId | |

**User's choice:** Flat chapter list
**Notes:** Consistent with "flat chapter structure, no volumes" prior decision

| Option | Description | Selected |
|--------|-------------|----------|
| Stored counter, update on change | Precompute, O(1) reads, always accurate | ✓ |
| Calculated on read | Simpler but slower for large projects | |
| Recalculate on save | Stored counter refreshed after each chapter save | |

**User's choice:** Stored counter, update on change

| Option | Description | Selected |
|--------|-------------|----------|
| UUID v4 | Standard, no ordering guarantees | |
| NanoID | Short, URL-safe, compact for IndexedDB keys | ✓ |
| Auto-increment integer | Simple, human-readable, harder for sync | |

**User's choice:** NanoID

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete flag + grace period | deletedAt timestamp, filter from queries, purge after grace | ✓ |
| Separate trash table | Move to deletedItems table, purge after 30 days | |
| Simple boolean flag | isDeleted boolean, no auto-purge | |

**User's choice:** Soft delete flag + grace period

---

## Agent's Discretion

- Card grid layout details (columns, spacing, responsive)
- Color scheme and typography for Chinese-first UI
- Chapter sidebar width and collapse behavior
- Three-dot menu item order and icons
- Empty state illustration design
- Grace period duration for soft-deleted items

## Deferred Ideas

None — discussion stayed within phase scope.