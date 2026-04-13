# Phase 3: Workspace & Chapter Outline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 03-workspace-chapter-outline
**Areas discussed:** Panel resize approach, Outline data model, Outline panel behavior, Layout persistence, Splitter interaction, Outline editing, Empty state, Tab persistence, Summary format, Sidebar visibility, Status sync, Responsive behavior, Layout scope, Outline input UX, Drag timing, Default word count, Sidebar display, Form fields, Default content, Sequential editing, Splitter reusability, Autosave, List filtering, Order sync, Status visuals, Tab animation, Word count comparison, Data storage, Post-creation tab, Cursor style, Default fallback, Outline sorting, Multi-tab sync

---

## Panel Resize Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Drag splitter | Splitter between panels, drag to resize width | ✓ |
| Preset layout switch | Click preset buttons for layout sizes | |
| Drag + presets | Drag splitter with quick preset buttons | |
| You decide | Let agent choose | |

**User's choice:** Drag splitter
**Notes:** Two-panel layout in Phase 3 (sidebar + editor). Phase 5 adds more panels reusing the same component.

---

## Panel Count

| Option | Description | Selected |
|--------|-------------|----------|
| Two panels (sidebar + editor) | Simple layout, outline as tab in sidebar | |
| Three panels (sidebar + outline + editor) | Outline as separate panel | |
| You decide | Agent decides | ✓ |

**User's choice:** Agent decided — Two-panel layout. Outline as sidebar tab. Phase 5 extends to four-panel.

---

## Outline Data Model

| Option | Description | Selected |
|--------|-------------|----------|
| Simple (title + summary) | Lightweight, like note cards | |
| Structured (title + summary + target word count + status) | More planning-oriented | |
| You decide | Agent decides | ✓ |

**User's choice:** Agent decided — Structured outline entries

---

## Outline Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Flat list | 1:1 with chapters, simple | ✓ |
| Tree/nested | Multi-level hierarchy | |
| You decide | Agent decides | |

**User's choice:** Flat list — aligned with Phase 1 flat chapter structure

---

## Outline-Chapter Binding

| Option | Description | Selected |
|--------|-------------|----------|
| 1:1 binding | Auto-create outline with chapter | |
| Independent | Outline can exist without chapter | |
| You decide | Agent decides | ✓ |

**User's choice:** Agent decided — 1:1 binding. Creating a chapter auto-creates its outline entry.

---

## Outline Operations

| Option | Description | Selected |
|--------|-------------|----------|
| View + edit | Basic CRUD | |
| View + edit + drag reorder | Full interaction with @dnd-kit | |
| You decide | Agent decides | ✓ |

**User's choice:** Agent decided — Full interaction including drag reorder (reusing @dnd-kit)

---

## Outline Display

| Option | Description | Selected |
|--------|-------------|----------|
| Tab switching | Sidebar tabs: chapters | outline | ✓ |
| Inline below chapter | Expand chapters to see outline | |

**User's choice:** Tab switching in sidebar

---

## Outline Editing

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in sidebar | Compact but limited space | |
| Click to open in editor area | Full editing space, replaces editor | ✓ |
| Summary in sidebar + modal edit | Hybrid approach | |

**User's choice:** Click to open in editor area (replace mode)

---

## Outline-Chapter Status Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Independent status | Outline and chapter have separate status tracking | ✓ |
| Auto-sync | Outline status follows chapter status | |

**User's choice:** Independent status — outline tracks planning progress, chapter tracks writing progress

---

## Layout Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage | Simple, browser-level only | |
| IndexedDB (Dexie) | Per-project, syncable in Phase 8 | ✓ |
| You decide | Agent decides | |

**User's choice:** IndexedDB — per-project layout data, aligns with Phase 1 per-project DB pattern

---

## Order Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Shared order field | Same data, different views | ✓ |
| Separate order + sync events | More complex, risk of sync lag | |

**User's choice:** Shared order field — simpler and consistent

---

## Summary Format

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text | Simple, lightweight | ✓ |
| Rich text | More expressive, complex | |

**User's choice:** Plain text — sufficient for novel outline summaries

---

## Sidebar Visibility During Editing

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | List stays visible, form in editor area | ✓ |
| Sidebar switches to edit view | Replaces list with form | |

**User's choice:** Sidebar list always visible — editing form in main area

---

## Sidebar Responsive Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Truncate + tooltip | Text truncation with hover tooltip | ✓ |
| Progressive hiding | Hide secondary info when narrow | |

**User's choice:** Truncate + tooltip — simpler and stable

---

## Splitter Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Min width only | Prevent below 200px | |
| Min + max + double-click reset | Constrain both sides, reset to 280px | |
| You decide | Agent decides | ✓ |

**User's choice:** Agent decided — Min 200px, no max, double-click reset to 280px

---

## Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt + edit button | "还没有大纲" + click to edit | ✓ |
| Auto-enter edit mode | Jump straight into editing | |

**User's choice:** Prompt + edit button

---

## Tab Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Remember last tab | Restore across sessions | ✓ |
| Always chapters | Predictable default | |

**User's choice:** Remember last tab

---

## Layout Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per-project | Different novels can have different layouts | ✓ |
| Browser-global | All projects share same layout | |

**User's choice:** Per-project — stored in project's IndexedDB

---

## Summary Input

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-growing textarea | Grows with content | ✓ |
| Fixed height + scrollbar | Predictable size | |

**User's choice:** Auto-growing textarea

---

## Drag Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time follow | Width updates during drag | ✓ |
| Jump on release | Ghost line during drag, snap on release | |

**User's choice:** Real-time follow

---

## Target Word Count Default

| Option | Description | Selected |
|--------|-------------|----------|
| Manual only | Author fills in target word count | ✓ |
| Genre-based suggestion | Auto-suggest based on genre | |

**User's choice:** Manual only — authors know their own pace

---

## Sidebar Outline Entry Display

| Option | Description | Selected |
|--------|-------------|----------|
| Title + status dot | Clean and informative | ✓ |
| Title only | Minimal | |
| Title + status + progress bar | Dense | |

**User's choice:** Title + colored status dot (gray/blue/green)

---

## Outline Edit Form Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Four fields + read-only timestamps | title, summary, target, status + createdAt/updatedAt | ✓ |
| Pure four fields | Minimal | |

**User's choice:** Four fields + read-only timestamps

---

## Default Outline Content

| Option | Description | Selected |
|--------|-------------|----------|
| Title = chapter name | Auto-match, rest empty | ✓ |
| Title = chapter name + prompt text | Pre-fill with placeholder | |

**User's choice:** Title matches chapter name, other fields empty

---

## Sequential Editing

| Option | Description | Selected |
|--------|-------------|----------|
| Previous/Next navigation | Buttons to navigate between outline entries | ✓ |
| Click in sidebar each time | Manual navigation | |

**User's choice:** Previous/Next navigation buttons on editing form

---

## Splitter Component Reusability

| Option | Description | Selected |
|--------|-------------|----------|
| Reusable component | Design for Phase 5 four-panel | ✓ |
| Quick one-off, refactor later | Build fast, rebuild in Phase 5 | |

**User's choice:** Reusable component

---

## Autosave

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time autosave | Like editor, show saving status | ✓ |
| Manual save button | Explicit save | |

**User's choice:** Real-time autosave — consistent with editor experience

---

## List Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| No filtering in V1 | Pure scroll list | ✓ |
| Search filter | Add title search | |

**User's choice:** No filtering in V1 — scrollable list only

---

## Status Visual Distinction

| Option | Description | Selected |
|--------|-------------|----------|
| Colored status dots | Gray/blue/green dots for status | ✓ |
| Text labels | Written status labels | |

**User's choice:** Colored status dots

---

## Tab Switch Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Instant switch | No animation, immediate | ✓ |
| Fade in/out | 0.15s animation | |

**User's choice:** Instant switch

---

## Word Count Comparison

| Option | Description | Selected |
|--------|-------------|----------|
| Show target vs actual | "目标: 2000字 / 当前: 0字" | ✓ |
| Show target only | Simple display | |

**User's choice:** Show target vs actual word count

---

## Data Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Chapter record extension fields | Add outline fields to existing Chapter type | ✓ |
| Separate outline table | New table with 1:1 relation | |

**User's choice:** Extension fields on Chapter record — natural for 1:1 binding

---

## Post-Creation Default Tab

| Option | Description | Selected |
|--------|-------------|----------|
| Stay on chapters tab | Consistent with current behavior | ✓ |
| Auto-switch to outline | Jump to planning | |

**User's choice:** Stay on chapters tab — user switches when ready

---

## Cursor Style

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Agent decides implementation details | ✓ |
| Must be col-resize | Explicit requirement | |

**User's choice:** Agent's discretion

---

## Default Width Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| 280px | Matches current fixed layout | ✓ |

**User's choice:** 280px

---

## Outline Drag Reorder

| Option | Description | Selected |
|--------|-------------|----------|
| Drag reorder (shared order field) | Same interaction as chapters | ✓ |
| You decide | Agent decides | |

**User's choice:** Drag reorder — consistent with chapter sidebar

---

## Multi-Tab Sync

| Option | Description | Selected |
|--------|-------------|----------|
| V1 no sync | Last tab wins, uncommon scenario | ✓ |
| You decide | Agent decides | |

**User's choice:** Agent decided — V1 doesn't handle multi-tab sync for layout data

---

## the agent's Discretion

- Splitter visual design (thickness, color, hover state)
- Summary word count display in editing form
- Batch outline operations (not needed in V1)
- Delete behavior (follows chapter delete — cascade)
- Exact form layout and field ordering
- Status dropdown design
- Error states for outline editing

## Deferred Ideas

None — discussion stayed within phase scope.