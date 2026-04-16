# Graph Report - .  (2026-04-16)

## Corpus Check
- 117 files ， ~55,793 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 367 nodes ， 386 edges ， 78 communities detected
- Extraction: 81% EXTRACTED ， 19% INFERRED ， 0% AMBIGUOUS ， INFERRED: 75 edges (avg confidence: 0.8)
- Token cost: 0 input ， 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & Session Management|Auth & Session Management]]
- [[_COMMUNITY_UI Interaction Handlers|UI Interaction Handlers]]
- [[_COMMUNITY_Chapter Management|Chapter Management]]
- [[_COMMUNITY_World Entry Editing|World Entry Editing]]
- [[_COMMUNITY_AI Chat Panel|AI Chat Panel]]
- [[_COMMUNITY_UI Redesign Spec|UI Redesign Spec]]
- [[_COMMUNITY_InkForge Core Architecture|InkForge Core Architecture]]
- [[_COMMUNITY_Suggestion Parser|Suggestion Parser]]
- [[_COMMUNITY_World Entry Queries|World Entry Queries]]
- [[_COMMUNITY_GSD Framework|GSD Framework]]
- [[_COMMUNITY_Outline Editing|Outline Editing]]
- [[_COMMUNITY_Sync Management|Sync Management]]
- [[_COMMUNITY_Project Dashboard|Project Dashboard]]
- [[_COMMUNITY_Editor Core|Editor Core]]
- [[_COMMUNITY_Tiptap Extensions|Tiptap Extensions]]
- [[_COMMUNITY_Generation Panel|Generation Panel]]
- [[_COMMUNITY_Context Injection|Context Injection]]
- [[_COMMUNITY_Outline Queries|Outline Queries]]
- [[_COMMUNITY_Theme Provider|Theme Provider]]
- [[_COMMUNITY_Project Card|Project Card]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 15 edges
2. `UI Redesign Implementation Plan` - 14 edges
3. `createClient()` - 11 edges
4. `flushSyncQueue()` - 10 edges
5. `AIChatPanel Component` - 9 edges
6. `getQueueDB()` - 8 edges
7. `parseAISuggestions()` - 6 edges
8. `createProjectDB()` - 6 edges
9. `useWorldEntries Hook` - 6 edges
10. `showToast()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Globe/World Icon (SVG)` --semantically_similar_to--> `Worldview Encyclopedia Context Injection`  [INFERRED] [semantically similar]
  public/globe.svg ★ AGENTS.md
- `File/Document Icon (SVG)` --semantically_similar_to--> `.planning/ State Machine (STATE.md, ROADMAP.md, config.json)`  [INFERRED] [semantically similar]
  public/file.svg ★ AGENTS.md
- `duplicateChapter()` --calls--> `GET()`  [INFERRED]
  src\lib\db\chapter-queries.ts ★ src\app\auth\callback\route.ts
- `getWorldEntryById()` --calls--> `GET()`  [INFERRED]
  src\lib\db\world-entry-queries.ts ★ src\app\auth\callback\route.ts
- `updateTodayWordCount()` --calls--> `GET()`  [INFERRED]
  src\lib\hooks\use-word-count.ts ★ src\app\auth\callback\route.ts

## Hyperedges (group relationships)
- **GSD Agent Orchestration Stack** ！ agents_gsd_framework, agents_cli_tool, agents_agent_definitions, agents_hook_system, agents_planning_state [EXTRACTED 0.95]
- **InkForge AI Differentiation Features** ！ agents_worldview_context, agents_contradiction_checking, agents_byok_model, agents_rationale_core_value [EXTRACTED 0.90]
- **Next.js Deployment and Branding Assets** ！ readme_nextjs_project, next_svg_logo, vercel_svg_logo, readme_vercel_deploy, readme_geist_font [INFERRED 0.80]
- **Four-Panel Workspace Layout Architecture** ！ four_panel_workspace, chapter_sidebar, editor, ai_chat_panel, resizable_panels [EXTRACTED 1.00]
- **MCP-Driven E2E Fix Workflow** ！ mcp_infrastructure, next_devtools_mcp, playwright_mcp, mcp_error_detection, react_hooks_violation, e2e_verification_flows [EXTRACTED 0.95]
- **UI Redesign Component Migration** ！ ui_redesign_plan, stone_palette, blue_accent, button_component, dialog_component, input_component, textarea_component, auth_page, project_dashboard, project_card, chapter_sidebar, chapter_row, editor, editor_toolbar, editor_css, ai_chat_panel, message_bubble [EXTRACTED 0.95]
- **Risk Check Workflow** ！ mcp_error_detection, risk_tiptap_react19, risk_epub_chinese, risk_supabase_ssr, risk_indexeddb [EXTRACTED 0.85]
- **Two-Tier DB Architecture** ！ two_tier_indexeddb_pattern, inkforge_meta_db, inkforge_project_db, create_project_db [EXTRACTED 1.00]
- **Workspace Layout Redesign Specification** ！ workspace_layout_spec, split_panel_layout, dashboard_sidebar_nav, chapter_sidebar, editor, ai_chat_panel, ai_chat_bubbles [EXTRACTED 0.90]
- **Auth Flow Verification** ！ e2e_verification_flows, auth_page, mcp_infrastructure [EXTRACTED 0.90]
- **World Bible Context Injection System** ！ world_bible_context_injection, use_context_injection, use_world_entries, ai_chat_panel, world_entry [EXTRACTED 0.90]

## Communities

### Community 0 - "Auth & Session Management"
Cohesion: 0.1
Nodes (25): resetPassword(), signIn(), signOut(), signUp(), handleSignOut(), AuthenticatedLayout(), handleSubmit(), GET() (+17 more)

### Community 1 - "UI Interaction Handlers"
Cohesion: 0.09
Nodes (23): AIChatPanel Component, Auth Page (Split Panel Layout), BYOK (Bring Your Own Key) AI Model, Chapter Type, ChapterSidebar Component, createProjectDB(), 7 E2E Verification Flows, Tiptap Editor (+15 more)

### Community 2 - "Chapter Management"
Cohesion: 0.09
Nodes (16): handleCheckDuplicate(), addChapter(), computeWordCount(), duplicateChapter(), extractTextFromContent(), getChapterNumber(), getChapters(), softDeleteChapter() (+8 more)

### Community 3 - "World Entry Editing"
Cohesion: 0.09
Nodes (11): useAIChat(), useAIConfig(), useAutoSave(), useChapterEditor(), useChapterGeneration(), useChapters(), useConsistencyExemptions(), useWorldEntries() (+3 more)

### Community 4 - "AI Chat Panel"
Cohesion: 0.11
Nodes (12): findEntryIdByName(), handleAdoptRelationship(), handleIntentionalContradiction(), handleKeyDown(), handleLinkExisting(), handleSaveNewEntry(), handleSend(), showToast() (+4 more)

### Community 5 - "UI Redesign Spec"
Cohesion: 0.12
Nodes (15): AI Chat Custom Bubble Shapes, Blue Accent Color System, Button Component, Chapter Row Component, Dashboard Sidebar Navigation Layout, Dialog Component, Editor CSS Styles, Editor Toolbar (+7 more)

### Community 6 - "InkForge Core Architecture"
Cohesion: 0.17
Nodes (13): BYOK (Bring Your Own Key) AI Model, Cross-entity Contradiction Checking, InkForge - AI Novel Writing Workbench, Next.js + React Tech Stack, Rationale: BYOK Eliminates Product Model Cost, Rationale: AI Context Injection Solves Consistency Pain Point, Worldview Encyclopedia Context Injection, Globe/World Icon (SVG) (+5 more)

### Community 7 - "Suggestion Parser"
Cohesion: 0.38
Nodes (9): createNewEntrySuggestion(), createRelationshipSuggestion(), deduplicateSuggestions(), filterByConfidence(), inferEntryTypes(), limitSuggestions(), parseAISuggestions(), parseNewEntrySuggestions() (+1 more)

### Community 8 - "World Entry Queries"
Cohesion: 0.2
Nodes (1): getWorldEntryById()

### Community 9 - "GSD Framework"
Cohesion: 0.24
Nodes (10): Markdown-defined Agent Personas (24 agents), gsd-tools.cjs CLI Entry Point, Context Window Monitoring, Dual Runtime Support (Claude Code + OpenCode), GSD (Get Shit Done) Framework v1.34.2, Runtime Hook System (PreToolUse/PostToolUse), Model Profile System (quality/balanced/budget/adaptive), .planning/ State Machine (STATE.md, ROADMAP.md, config.json) (+2 more)

### Community 10 - "Outline Editing"
Cohesion: 0.31
Nodes (6): buildContextPrompt(), findRelevantEntries(), formatEntryForContext(), injectContext(), matchKeyword(), trimToTokenBudget()

### Community 11 - "Sync Management"
Cohesion: 0.29
Nodes (5): ProjectLayout(), useProjects(), updateTodayWordCount(), useTodayWordCount(), useTotalWordCount()

### Community 12 - "Project Dashboard"
Cohesion: 0.25
Nodes (8): MCP Error Detection Workflow, MCP Infrastructure Setup, next-devtools MCP Server, Playwright MCP Server, epub-gen Chinese Export Risk, IndexedDB Transaction Error Handling Risk, Supabase SSR Middleware Risk, Tiptap + React 19 Hydration Risk

### Community 13 - "Editor Core"
Cohesion: 0.33
Nodes (2): handleTitleKeyDown(), handleTitleSave()

### Community 14 - "Tiptap Extensions"
Cohesion: 0.33
Nodes (3): AuthStatus(), SyncProgress(), useAuth()

### Community 15 - "Generation Panel"
Cohesion: 0.4
Nodes (0): 

### Community 16 - "Context Injection"
Cohesion: 0.5
Nodes (2): buildEntry(), handleSave()

### Community 17 - "Outline Queries"
Cohesion: 0.6
Nodes (3): addTag(), handleKeyDown(), removeTag()

### Community 18 - "Theme Provider"
Cohesion: 0.67
Nodes (2): AuthenticatedLayoutClient(), useMounted()

### Community 19 - "Project Card"
Cohesion: 0.67
Nodes (2): handleKeyDown(), handleSaveTitle()

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (2): middleware(), updateSession()

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (1): InkForgeMetaDB

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): EPub

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (1): Browser Window Icon (SVG)

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (1): ProjectMeta Type

## Knowledge Gaps
- **33 isolated node(s):** `EPub`, `Dual Runtime Support (Claude Code + OpenCode)`, `Security Layer (Path Traversal, Prompt Injection)`, `Context Window Monitoring`, `Model Profile System (quality/balanced/budget/adaptive)` (+28 more)
  These have ＋1 connection - possible missing edges or undocumented components.
- **Thin community `Community 28`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `CreateChapterInput()`, `create-chapter-input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `DeleteChapterDialog()`, `delete-chapter-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `EditorToolbar()`, `editor-toolbar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `FloatingToolbar()`, `floating-toolbar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `if()`, `outline-edit-form.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `getStatusDotColor()`, `outline-tab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `CreateProjectModal()`, `create-project-modal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `EmptyDashboard()`, `empty-dashboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `getStepText()`, `project-settings-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `handleFormSubmit()`, `project-settings-form.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `ConsistencyWarningCard()`, `consistency-warning-card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `DraftCard()`, `draft-card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `ResizablePanelGroup()`, `resizable-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `CreateEntryInput()`, `create-entry-input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `DeleteEntryDialog()`, `delete-entry-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `EPub`, `epub-gen.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `use-dismissed-suggestions.ts`, `useDismissedSuggestions()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `use-layout.ts`, `useLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `use-relations.ts`, `useRelations()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `createClient()`, `client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `cn()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `chapter-context-menu.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `editor-types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `editor.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `select.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `message-bubble.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `chapter-queries.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `meta-db.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `project-db.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `relation-queries.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `world-entry-queries.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `use-autosave.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `use-projects.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `chapter.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `project.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `relation.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `world-entry.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `Browser Window Icon (SVG)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `ProjectMeta Type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Auth & Session Management` to `Chapter Management`, `World Entry Queries`, `Outline Editing`, `Sync Management`, `Community 22`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `useWorldEntries Hook` connect `UI Interaction Handlers` to `World Entry Editing`, `AI Chat Panel`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `handleCheckDuplicate()` connect `Chapter Management` to `Auth & Session Management`, `AI Chat Panel`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `GET()` (e.g. with `middleware()` and `signUp()`) actually correct?**
  _`GET()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `createClient()` (e.g. with `AuthenticatedLayout()` and `signUp()`) actually correct?**
  _`createClient()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `flushSyncQueue()` (e.g. with `triggerImmediateSync()` and `createClient()`) actually correct?**
  _`flushSyncQueue()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `EPub`, `Dual Runtime Support (Claude Code + OpenCode)`, `Security Layer (Path Traversal, Prompt Injection)` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._