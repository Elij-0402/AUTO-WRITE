# Phase 3: Workspace & Chapter Outline - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Authors can customize their workspace with resizable panels and plan their story with structured outlines. This phase delivers: (1) resizable panel borders with session persistence, (2) chapter/plot outline CRUD integrated into the sidebar, (3) outline editing in the editor area. AI chat and world bible panels are Phase 5 scope.
</domain>

<decisions>
## Implementation Decisions

### Panel Resize Approach
- **D-01:** Drag splitter between panels — resizable border between sidebar and editor
- **D-02:** Two-panel layout in Phase 3 (sidebar + editor). Phase 5 adds world bible and AI chat panels, reusing the same ResizablePanel component
- **D-03:** Minimum sidebar width 200px, no maximum width constraint. Double-click splitter resets to default 280px
- **D-04:** Real-time resize — sidebar width follows mouse during drag (no ghost/deferred update)
- **D-05:** Default sidebar width 280px (matches current fixed layout). Falls back to 280px if no saved layout data
- **D-06:** Cursor: col-resize on splitter hover — standard resizable panel UX. the agent decides exact splitter visual design

### Outline Data Model
- **D-07:** Structured outline entries with: title, summary (plain text), target word count, status (not_started / in_progress / completed), timestamps (createdAt, updatedAt — read-only)
- **D-08:** Flat list structure — outline entries map 1:1 to chapters, no nesting. Aligned with Phase 1 flat chapter structure decision
- **D-09:** 1:1 binding with chapters — creating a chapter auto-creates an outline entry (default title = chapter title, empty summary, empty target word count, status = not_started)
- **D-10:** Outline status is INDEPENDENT from chapter status. Chapter has draft/completed, outline has its own not_started/in_progress/completed. Separate tracking for planning vs writing progress
- **D-11:** Outline data stored as extension fields on the Chapter record in the project's IndexedDB — no separate outline table. Fields: outlineSummary, outlineTargetWordCount, outlineStatus
- **D-12:** Outline and chapter share the same order field (bi-directional sync). Dragging in either view reorders both. No separate order tracking

### Outline Panel & Behavior
- **D-13:** Sidebar has two tabs: "章节" (chapters) | "大纲" (outline). Instant tab switching, no animation
- **D-14:** Tab state persists across sessions (stored in layout data). Next session opens on the last-used tab
- **D-15:** When creating a new chapter, stay on the current (chapters) tab. User can switch to outline tab at any time
- **D-16:** Outline entries in sidebar show: title + status color dot (gray/blue/green for not_started/in_progress/completed). No word count progress bar in sidebar
- **D-17:** Clicking an outline entry switches the editor area to show an outline editing form (replace mode). Switching back to chapters tab returns to the editor
- **D-18:** Sidebar list stays visible when editing outline — the editing form appears in the editor area, not replacing the sidebar content
- **D-19:** Empty outline entry shows a prompt + "编辑" button ("还没有大纲，点击编辑")
- **D-20:** Previous/Next chapter navigation buttons on the outline editing form for sequential planning flow
- **D-21:** Summary input is an auto-growing textarea. No fixed height with scrollbar
- **D-22:** Outline editing form displays: title, summary (auto-growing textarea), target word count, status dropdown, read-only timestamps
- **D-23:** Outline form shows target word count vs actual chapter word count comparison ("目标: 2000字 / 当前: 0字")

### Layout Persistence
- **D-24:** Layout data (sidebar width, active tab) stored per-project in the project's IndexedDB database via Dexie. Not localStorage. Per-project because different novels may have different layout preferences
- **D-25:** Auto-save layout changes — sidebar width is saved on drag end. No explicit save button
- **D-26:** V1 does NOT handle multi-tab sync. If the same project is open in two browser tabs, the last tab's layout wins

### Splitter Component Reusability
- **D-27:** ResizablePanel component designed for reusability — Phase 5 will reuse it for the 4-panel workspace. Build as a general-purpose resizable panel system, not a one-off solution

### the agent's Discretion
- Splitter visual design (thickness, color, hover effect)
- Summary word count display (show count in the editing form or not)
- Batch operations on outline entries (V1 doesn't need them)
- Delete behavior: deleting a chapter deletes its paired outline entry (follows chapter delete pattern)
- Exact outline editing form layout and field ordering
- Status dropdown design details
- Error states for outline editing

### Folded Todos
None — no pending todos matched this phase's scope.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above.

### Existing Code References
- `src/app/projects/[id]/page.tsx` — Current two-panel layout (fixed 280px sidebar + flex editor)
- `src/app/projects/[id]/layout.tsx` — Project workspace layout with header bar
- `src/components/chapter/chapter-sidebar.tsx` — Existing sidebar with DnD chapter list
- `src/lib/hooks/use-chapters.ts` — Chapter data hook (will need extension for outline fields)
- `src/lib/db/chapter-queries.ts` — Chapter DB queries (will need outline field support)
- `src/lib/types/chapter.ts` — Chapter type definition (will need outline fields added)
- `src/lib/db/project-db.ts` — Per-project IndexedDB schema (Dexie)
- `src/lib/hooks/use-autosave.ts` — Autosave hook pattern (reusable for outline saving)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` — Already installed and used for chapter drag-reorder. Reusable for outline drag-reorder
- `use-autosave.ts` — Autosave hook pattern. Can be adapted for outline field autosaving
- `use-chapters.ts` — Chapter data management hook. Will need extension to include outline fields
- `chapter-queries.ts` — Dexie DB queries for chapters. Will need to add outline field update methods
- Radix UI components (`@radix-ui/react-dialog`, `@radix-ui/react-select`) — Already in project for dialogs and dropdowns
- `zustand` — State management library available for layout state if needed

### Established Patterns
- Per-project IndexedDB databases via Dexie — outline/layout data should follow this pattern
- Chinese-first UI — all labels in Simplified Chinese
- Component structure: `src/components/{feature}/{component}.tsx`
- Hook structure: `src/lib/hooks/use-{feature}.ts`
- Tailwind CSS with dark mode support — `dark:` variants throughout

### Integration Points
- `page.tsx` — Currently renders `<ChapterSidebar>` and `<Editor>`. Will need tab switching and ResizablePanel wrapper
- `chapter.ts` type definition — Needs outline fields (outlineSummary, outlineTargetWordCount, outlineStatus)
- `project-db.ts` — IndexedDB schema needs version bump for new fields on Chapter table
- Layout persistence — New layout settings table or settings object in project DB

</code_context>

<specifics>
## Specific Ideas

- Sidebar tab pattern follows common IDE conventions (file explorer vs outline view tabs)
- Outline status uses color dots: gray (not started), blue (in progress), green (completed) — familiar progress indicators
- Auto-growing textarea for outline summary follows natural writing flow
- Double-click splitter to reset mirrors VS Code panel behavior
- Target vs actual word count comparison gives authors clear progress tracking during planning phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-workspace-chapter-outline*
*Context gathered: 2026-04-14*