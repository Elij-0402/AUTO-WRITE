# Phase 1: Project & Chapter Foundation - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Authors can create and organize novel projects in a Chinese-first environment. This phase delivers project CRUD, chapter management with drag-reorder, and all UI in Simplified Chinese. The writing editor, workspace panels, and AI features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Project list & navigation
- **D-01:** Card grid layout for the project dashboard — cover image + title + key metadata per card
- **D-02:** Each card shows: title, last edited time, word count (字数), genre — enough to identify and prioritize work
- **D-03:** New project creation via modal dialog from the dashboard — stays in context, quick flow
- **D-04:** Opening a project navigates to a full project workspace (single project at a time), replacing the dashboard view
- **D-05:** Projects ordered by most recently edited, with a "View All" option for the full list
- **D-06:** Project deletion uses soft delete with confirmation dialog — data preserved for a grace period before permanent removal
- **D-07:** Project metadata editable both ways: quick edit (title, genre) on the card, and a full project settings page within the workspace
- **D-08:** Empty dashboard state shows a friendly illustration with "创建你的第一本小说" (Create your first novel) button in Chinese

### Chapter management UI
- **D-09:** Chapter list displayed as a sidebar within the project workspace — always visible alongside the editor
- **D-10:** Each chapter row shows: chapter number, title, word count (字数), and status (e.g., draft/completed) — information-dense at a glance
- **D-11:** New chapters created inline at the bottom of the sidebar list — stays in context, no disruption
- **D-12:** Chapter reordering via drag-and-drop in the sidebar — visual, intuitive, satisfies PROJ-04
- **D-13:** Chapter actions (rename, delete, duplicate, move) via a three-dot (⋯) context menu on each chapter row
- **D-14:** Chapter content auto-saved to IndexedDB — no manual save needed, data is always safe
- **D-15:** Chapter deletion uses soft delete with a trash area — chapters can be restored within a grace period
- **D-16:** Chapter numbering auto-generated with "第N章" prefix — user provides the title portion only, familiar convention for Chinese web novels

### Data storage strategy
- **D-17:** IndexedDB as the local storage engine — supports indexes, transactions, large data, and is the right foundation for future cloud sync (Phase 8)
- **D-18:** Dexie.js wraps IndexedDB — provides clean API, schema migrations, and query support
- **D-19:** Per-project IndexedDB database — clean isolation, each project syncable independently in Phase 8, easy to delete a project's data
- **D-20:** Schema migrations handled via Dexie.js built-in version system — track schema versions in code with upgrade paths
- **D-21:** Auto-save timing is event-driven: save on content change debounce, chapter switch, and window blur — fewer writes than timed, still safe

### Project data model
- **D-22:** Project core metadata: title, genre (类型), synopsis (简介), cover image ID, total word count (字数), created/updated timestamps
- **D-23:** Chapter content stored as structured JSON (ProseMirror/Tiptap document format) — queryable, diffable, sync-friendly, extensible for future editor features
- **D-24:** Chapters stored as a flat array under the project — consistent with "flat chapter structure, no volumes" decision, easy to reorder
- **D-25:** Word count (字数) precomputed and stored on project/chapter, updated on content change — O(1) reads, always accurate
- **D-26:** Entity IDs use NanoID — short, URL-safe, compact for IndexedDB keys, sync-friendly (no collision risk across devices)
- **D-27:** Soft deletion uses `deletedAt` timestamp field + grace period before permanent purge — consistent pattern for both projects and chapters

### Agent's Discretion
- Exact card grid layout (columns, spacing, responsive breakpoints)
- Color scheme and typography for the Chinese-first UI
- Chapter sidebar width and collapse behavior
- Three-dot menu item order and icons
- Empty state illustration design
- Grace period duration for soft-deleted items

</decisions>

<specifics>
## Specific Ideas

- Chinese-first from the start: all UI labels, buttons, menus in Simplified Chinese (L10N-01)
- Chapter numbering follows Chinese web novel convention: "第N章" auto-prefix
- Word count displayed as 字数 (character count), aligned with Chinese writing norms
- Project card should feel like a bookshelf — visual, easy to identify novels at a glance
- Chapter sidebar shows status badges (草稿 = draft, 已完成 = completed) in Chinese

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Chapter requirements
- `.planning/REQUIREMENTS.md` — PROJ-01 through PROJ-05, L10N-01 requirements for this phase
- `.planning/PROJECT.md` — Key Decisions table (one novel = one project, flat chapter structure, Chinese-first, BYOK)
- `.planning/ROADMAP.md` §Phase 1 — Success criteria and dependency information

### Prior decisions
- `.planning/STATE.md` — Accumulated context: chapter-per-editor-instance, local-first architecture

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project — no existing components, hooks, or utilities to reuse

### Established Patterns
- React + Next.js (from PROJECT.md constraints)
- No established patterns yet — Phase 1 establishes the patterns for all subsequent phases

### Integration Points
- Phase 2 (Writing Editor) will integrate with the chapter data model and sidebar
- Phase 3 (Workspace) will reuse the project workspace layout for multi-panel
- Phase 8 (Cloud Sync) will build on top of the IndexedDB/Dexie.js storage layer

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-project-chapter-foundation*
*Context gathered: 2026-04-13*