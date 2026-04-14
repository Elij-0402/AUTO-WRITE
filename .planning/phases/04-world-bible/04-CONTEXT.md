# Phase 4: World Bible - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Authors can define their story world with structured entries for characters, locations, rules/settings, and timelines, and manually link them together. This phase delivers: (1) world bible entry CRUD for four entity types, (2) manual relationship linking between entries, (3) search and category browsing. AI-suggested relationships and AI context injection are Phase 6 scope.
</domain>

<decisions>
## Implementation Decisions

### Entry Data Model & Fields
- **D-01:** Unified base + type-specific fields — four entity types share base fields (id, name, description, tags) but each has dedicated fields. Characters: name, alias, appearance, personality, background. Locations: name, description, features. Rules: name, content, scope. Timelines: name, timePoint, eventDescription
- **D-02:** Character core fields: 姓名 (name), 别名 (alias), 外貌 (appearance), 性格 (personality), 背景 (background). No gender field — can be mentioned in background free text if needed
- **D-03:** Location fields: 名称 (name), 描述 (description), 特征 (features) — simple and concise
- **D-04:** Rule/setting fields: 名称 (name), 内容 (content), 适用范围 (scope) — simple and concise
- **D-05:** Timeline fields: 名称 (name), 时间点 (timePoint, free text), 事件描述 (eventDescription). TimePoint is free text (e.g., "第三年春", "百年前") — no structured date format
- **D-06:** Free tag system for categorization — each entry can have multiple tags with autocomplete from existing tags and instant creation of new ones. Tags are global across all entity types
- **D-07:** Entry names do NOT need to be unique — same name can exist as both a character and a location (e.g., "沧海" as character name and location name)

### Entry Browsing & Navigation
- **D-08:** World bible is the third sidebar tab — "世界观" tab alongside "章节" and "大纲", using lucide-react book-open icon
- **D-09:** Entries displayed in sidebar grouped by type — four collapsible sections (角色/地点/规则/时间线), each with a type-specific lucide icon (user/map/book-open/clock) and entry count in the section header
- **D-10:** Each entry in the sidebar shows: type icon (prefix) + name + first 1-2 tags preview. Entries sorted alphabetically by name (pinyin for Chinese) within each type group
- **D-11:** Simple real-time search at the top of the world bible sidebar — searches by name and tags, filters across all types or within current view
- **D-12:** Timeline entries sorted same as other types — alphabetically by name within their group (since timePoint is free text, automatic chronological sort is not possible)

### Entry Editing & Creation
- **D-13:** Editing a world bible entry shows an edit form in the editor area (same pattern as outline editing) — replaces editor content while sidebar stays visible
- **D-14:** Direct edit mode on selection — clicking an entry immediately enters edit mode, no separate view/edit toggle. Consistent with outline editing pattern
- **D-15:** New entries created via "+" button next to each type group header in the sidebar. Default names are type-specific: 未命名角色/未命名地点/未命名规则/未命名时间线. Created entry is auto-selected and enters edit mode
- **D-16:** Edit form layout: type indicator at top + structured form fields for the entity type. All fields use text input (single-line for names and short fields, auto-growing textarea for long-form fields like personality, background, description)
- **D-17:** Soft delete with deletedAt timestamp — consistent with chapter deletion pattern. Delete confirmation dialog warns about relationship count ("此条目有 N 个关联关系，删除后关联将一并移除。确定删除？")
- **D-18:** Auto-save with debounce — same pattern as chapter editor and outline editing. Save status shown at bottom of edit area ("已保存"/"保存中...")
- **D-19:** Previous/Next navigation buttons at bottom of edit form for browsing entries within the same type group. Consistent with outline prev/next navigation pattern
- **D-20:** Empty state for each type group shows friendly prompt + add button — e.g., "还没有角色，点击添加第一个角色"

### Relationship Linking
- **D-21:** Relationships created via "关联" section at the bottom of the entry edit form — click "添加关联" button, then select target entry and relationship type
- **D-22:** Relationships are bidirectional and auto-visible — if A links to B, B's page automatically shows the relationship with A. Relationship type can differ per direction (e.g., A "是师父" B, B "是徒弟" A — "角色关系" category, "师徒" description)
- **D-23:** Two relationship categories: 角色关系 (character relationships like 师徒/朋友/敌人) and 通用关联 (generic associations like 居住/属于/相关). User enters free-text description within the chosen category
- **D-24:** Relationships displayed as card list in the edit area — each card shows direction, relationship type/category, and target entry name (clickable to navigate to that entry)
- **D-25:** Background field (free text) is for narrative/historical information. Structured relationship links are for entity-to-entity connections. Clear boundary: background is prose, relationships are structured data
- **D-26:** Clicking a target entry name in a relationship card navigates to that entry's edit form — same as clicking in sidebar

### Data Storage
- **D-27:** Two new tables in InkForgeProjectDB: worldEntries (for all four entity types) and relations (for relationship links). Consistent with existing per-project IndexedDB pattern
- **D-28:** worldEntries table fields: id (NanoID), projectId, type ('character'|'location'|'rule'|'timeline'), name, alias (character only), appearance (character only), personality (character only), background (character only), description (location/rule), features (location only), content (rule only), scope (rule only), timePoint (timeline only), eventDescription (timeline only), tags (string array), createdAt, updatedAt, deletedAt
- **D-29:** relations table fields: id (NanoID), projectId, sourceEntryId, targetEntryId, category ('character_relation'|'general'), description (free text), sourceToTargetLabel (directional label from source to target), createdAt, deletedAt

### Visual & Interaction Details
- **D-30:** No image/avatar support in Phase 4 — character appearance is free text description only. Images can be added in a future iteration
- **D-31:** Entry list interaction: click to select + three-dot context menu (编辑/删除). No drag-to-reorder since entries sort alphabetically
- **D-32:** Type icons in list: lucide-react icons — User for characters, Map for locations, BookOpen for rules, Clock for timelines
- **D-33:** No batch operations in Phase 4 — entries are created, edited, and deleted one at a time. No batch import/export/delete
- **D-34:** No entry count limit — IndexedDB handles hundreds of entries without performance issues

### the agent's Discretion
- Exact styling of relationship cards (colors, spacing, hover effects)
- Exact auto-grow behavior for textareas
- Search debounce timing
- Empty state illustration design
- Confirmation dialog wording details
- Tag input component interaction details (dropdown position, tag display format)
- Relationship source/target arrow or direction indicator design

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### World Bible Requirements
- `.planning/REQUIREMENTS.md` — WRLD-01 through WRLD-08 requirements for this phase
- `.planning/PROJECT.md` — Key Decisions table (one novel = one project, BYOK, Chinese-first, manual + AI-suggested relationships)
- `.planning/ROADMAP.md` §Phase 4 — Success criteria and dependency information

### Prior Phase Decisions
- `.planning/phases/01-project-chapter-foundation/01-CONTEXT.md` — Per-project IndexedDB pattern (D-17 to D-21), NanoID for IDs (D-26), soft delete pattern (D-06, D-15, D-27)
- `.planning/phases/03-workspace-chapter-outline/03-CONTEXT.md` — Sidebar tab pattern (D-13, D-14), ResizablePanel reuse (D-27), layout persistence pattern (D-24 to D-26), outline edit form in editor area pattern (D-17, D-22)

### Existing Code References
- `src/lib/db/project-db.ts` — InkForgeProjectDB class, Dexie schema, version migration pattern
- `src/lib/types/chapter.ts` — Chapter interface with outline fields (pattern for world entry types)
- `src/lib/types/project.ts` — ProjectMeta interface (pattern for type definitions)
- `src/lib/hooks/use-chapters.ts` — CRUD hook pattern for chapter data
- `src/lib/hooks/use-autosave.ts` — Auto-save hook with debounce
- `src/components/chapter/chapter-sidebar.tsx` — Existing sidebar with DnD and tabs
- `src/components/outline/outline-edit-form.tsx` — Edit form in editor area pattern
- `src/components/workspace/resizable-panel.tsx` — ResizablePanel component for reuse
- `src/app/projects/[id]/page.tsx` — Main workspace page with tab switching and content area routing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `InkForgeProjectDB` (`src/lib/db/project-db.ts`): Per-project IndexedDB via Dexie — add worldEntries and relations tables with version migration
- `useChapters` hook (`src/lib/hooks/use-chapters.ts`): CRUD hook pattern — replicate for world entries with type filtering
- `useAutoSave` hook (`src/lib/hooks/use-autosave.ts`): Auto-save with 500ms debounce — reuse for entry editing
- `ChapterSidebar` (`src/components/chapter/chapter-sidebar.tsx`): Tab-based sidebar component — add world bible as 3rd tab
- `OutlineEditForm` (`src/components/outline/outline-edit-form.tsx`): Edit form in editor area — pattern for world entry edit form
- `ResizablePanelGroup` (`src/components/workspace/resizable-panel.tsx`): Draggable panel system — world bible uses same sidebar space
- Radix UI components (`@radix-ui/react-dialog`, `@radix-ui/react-select`): Already installed for dialogs and dropdowns
- `react-hook-form` + `zod`: Form validation libraries available
- `lucide-react`: Icon library installed — use for type icons (User, Map, BookOpen, Clock)
- `@dnd-kit/core` + `sortable`: Drag-and-drop library installed (though not needed for world bible — entries sort alphabetically)

### Established Patterns
- Per-project IndexedDB databases via Dexie.js — world bible data follows this pattern
- Chinese-first UI — all labels, buttons, menus in Simplified Chinese
- Component structure: `src/components/{feature}/{component}.tsx`
- Hook structure: `src/lib/hooks/use-{feature}.ts`
- Type definitions: `src/lib/types/{feature}.ts`
- DB queries: `src/lib/db/{feature}-queries.ts` (separate from Dexie class for business logic)
- Soft delete with `deletedAt` timestamp — consistent across projects, chapters, and now world entries
- NanoID for entity IDs — use for world entries and relations
- Auto-save with debounce — consistent UX across editor, outline, and world bible
- Tab-based sidebar navigation — add world bible tab to existing tab system

### Integration Points
- `src/app/projects/[id]/page.tsx` — Main workspace page needs world bible tab state and edit form routing
- `src/lib/db/project-db.ts` — Add version 3 migration for worldEntries and relations tables
- `src/lib/types/` — New type files: `world-entry.ts`, `relation.ts`
- `src/lib/hooks/` — New hooks: `use-world-entries.ts`, `use-relations.ts`
- `src/lib/db/` — New query files: `world-entry-queries.ts`, `relation-queries.ts`
- `src/lib/hooks/use-layout.ts` — Add 'world' tab to ActiveTab type
- Sidebar component — Add world bible tab content with type-grouped entry list

</code_context>

<specifics>
## Specific Ideas

- Sidebar tab pattern follows existing convention — "章节" | "大纲" | "世界观" tabs
- Type icons use Lucide React — consistent with project icon library
- Entry creation follows chapter creation pattern — "+" button next to group header
- Edit form in editor area follows outline edit form pattern — prev/next navigation at bottom
- Auto-save follows chapter editor pattern — debounce + status display
- Soft delete follows chapter delete pattern — deletedAt + confirmation dialog
- Relationship cards inspired by Notion's linked database entries — clean, clickable, show context
- Tag autocomplete inspired by GitHub label system — type to search, create on-the-fly
- Previous/Next navigation in edit form mirrors outline editing — sequential browsing within type group

</specifics>

<deferred>
## Deferred Ideas

- AI-suggested relationships (WRLD-06) — Phase 6 scope
- AI-suggested new world bible entries from drafts (WRLD-07) — Phase 6 scope
- Image/avatar support for entries — future iteration, adds storage complexity
- Batch operations (import/export/delete) — future iteration, not critical for v1
- World bible visualization graph — Phase 6 scope (relationship visualization)
- Editor-world bible linkage (quick jump from editor text to entries, right-click create entry) — Phase 6 scope for AI context injection

</deferred>

---

*Phase: 04-world-bible*
*Context gathered: 2026-04-14*