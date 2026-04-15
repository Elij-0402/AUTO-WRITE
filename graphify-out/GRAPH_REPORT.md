# Graph Report - .  (2026-04-15)

## Corpus Check
- Corpus is ~42,545 words - fits in a single context window. You may not need a graph.

## Summary
- 322 nodes ¡¤ 322 edges ¡¤ 78 communities detected
- Extraction: 77% EXTRACTED ¡¤ 23% INFERRED ¡¤ 0% AMBIGUOUS ¡¤ INFERRED: 74 edges (avg confidence: 0.8)
- Token cost: 0 input ¡¤ 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & Session Management|Auth & Session Management]]
- [[_COMMUNITY_Chapter Data Operations|Chapter Data Operations]]
- [[_COMMUNITY_World Bible Relations|World Bible Relations]]
- [[_COMMUNITY_Project Vision & Design|Project Vision & Design]]
- [[_COMMUNITY_AI Hooks & Generation|AI Hooks & Generation]]
- [[_COMMUNITY_AI Chat Panel Actions|AI Chat Panel Actions]]
- [[_COMMUNITY_Editor & Autosave|Editor & Autosave]]
- [[_COMMUNITY_Suggestion Parser|Suggestion Parser]]
- [[_COMMUNITY_World Entry Queries|World Entry Queries]]
- [[_COMMUNITY_Agent Architecture|Agent Architecture]]
- [[_COMMUNITY_Context Injection|Context Injection]]
- [[_COMMUNITY_Project & Word Count|Project & Word Count]]
- [[_COMMUNITY_Workspace Layout|Workspace Layout]]
- [[_COMMUNITY_Project Card UI|Project Card UI]]
- [[_COMMUNITY_Auth Status & Sync|Auth Status & Sync]]
- [[_COMMUNITY_New Entry Dialog|New Entry Dialog]]
- [[_COMMUNITY_Tag Input Component|Tag Input Component]]
- [[_COMMUNITY_Theme Provider|Theme Provider]]
- [[_COMMUNITY_Outline Edit Form|Outline Edit Form]]
- [[_COMMUNITY_Project Dashboard|Project Dashboard]]
- [[_COMMUNITY_Suggestion Cards|Suggestion Cards]]
- [[_COMMUNITY_Middleware Stack|Middleware Stack]]
- [[_COMMUNITY_Conflict Resolver|Conflict Resolver]]
- [[_COMMUNITY_Generation Panel|Generation Panel]]
- [[_COMMUNITY_Outline Tab|Outline Tab]]
- [[_COMMUNITY_AI Config Dialog|AI Config Dialog]]
- [[_COMMUNITY_Duplicate Entry Dialog|Duplicate Entry Dialog]]
- [[_COMMUNITY_Meta Database|Meta Database]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Authenticated Layout|Authenticated Layout]]
- [[_COMMUNITY_Auth Page|Auth Page]]
- [[_COMMUNITY_Chapter Row|Chapter Row]]
- [[_COMMUNITY_Create Chapter|Create Chapter]]
- [[_COMMUNITY_Delete Chapter Dialog|Delete Chapter Dialog]]
- [[_COMMUNITY_Editor Toolbar|Editor Toolbar]]
- [[_COMMUNITY_Floating Toolbar|Floating Toolbar]]
- [[_COMMUNITY_Create Project Modal|Create Project Modal]]
- [[_COMMUNITY_Empty Dashboard|Empty Dashboard]]
- [[_COMMUNITY_Project Settings Dialog|Project Settings Dialog]]
- [[_COMMUNITY_Project Settings Form|Project Settings Form]]
- [[_COMMUNITY_Draft Card|Draft Card]]
- [[_COMMUNITY_Resizable Panel|Resizable Panel]]
- [[_COMMUNITY_Create Entry Input|Create Entry Input]]
- [[_COMMUNITY_Delete Entry Dialog|Delete Entry Dialog]]
- [[_COMMUNITY_EPUB Type Defs|EPUB Type Defs]]
- [[_COMMUNITY_Dismissed Suggestions|Dismissed Suggestions]]
- [[_COMMUNITY_Layout Hook|Layout Hook]]
- [[_COMMUNITY_Relations Hook|Relations Hook]]
- [[_COMMUNITY_Supabase Client|Supabase Client]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
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
1. `GET()` - 14 edges
2. `createClient()` - 11 edges
3. `flushSyncQueue()` - 10 edges
4. `getQueueDB()` - 8 edges
5. `parseAISuggestions()` - 6 edges
6. `InkForge - AI Novel Writing Workbench` - 6 edges
7. `WorldEntryEditForm()` - 5 edges
8. `extractTextFromContent()` - 5 edges
9. `createProjectDB()` - 5 edges
10. `exportToDocx()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Globe/World Icon (SVG)` --semantically_similar_to--> `Worldview Encyclopedia Context Injection`  [INFERRED] [semantically similar]
  public/globe.svg ¡ú AGENTS.md
- `File/Document Icon (SVG)` --semantically_similar_to--> `.planning/ State Machine (STATE.md, ROADMAP.md, config.json)`  [INFERRED] [semantically similar]
  public/file.svg ¡ú AGENTS.md
- `duplicateChapter()` --calls--> `GET()`  [INFERRED]
  src\lib\db\chapter-queries.ts ¡ú src\app\auth\callback\route.ts
- `getWorldEntryById()` --calls--> `GET()`  [INFERRED]
  src\lib\db\world-entry-queries.ts ¡ú src\app\auth\callback\route.ts
- `updateTodayWordCount()` --calls--> `GET()`  [INFERRED]
  src\lib\hooks\use-word-count.ts ¡ú src\app\auth\callback\route.ts

## Hyperedges (group relationships)
- **GSD Agent Orchestration Stack** ¡ª agents_gsd_framework, agents_cli_tool, agents_agent_definitions, agents_hook_system, agents_planning_state [EXTRACTED 0.95]
- **InkForge AI Differentiation Features** ¡ª agents_worldview_context, agents_contradiction_checking, agents_byok_model, agents_rationale_core_value [EXTRACTED 0.90]
- **Next.js Deployment and Branding Assets** ¡ª readme_nextjs_project, next_svg_logo, vercel_svg_logo, readme_vercel_deploy, readme_geist_font [INFERRED 0.80]

## Communities

### Community 0 - "Auth & Session Management"
Cohesion: 0.1
Nodes (24): resetPassword(), signIn(), signOut(), signUp(), handleSignOut(), AuthenticatedLayout(), GET(), createClient() (+16 more)

### Community 1 - "Chapter Data Operations"
Cohesion: 0.1
Nodes (15): addChapter(), computeWordCount(), duplicateChapter(), extractTextFromContent(), getChapterNumber(), getChapters(), softDeleteChapter(), updateChapterContent() (+7 more)

### Community 2 - "World Bible Relations"
Cohesion: 0.12
Nodes (8): addRelation(), deleteRelation(), getRelationCount(), handleAddRelation(), handleDeleteRelation(), getTypeIcon(), handleDeleteClick(), WorldEntryRow()

### Community 3 - "Project Vision & Design"
Cohesion: 0.14
Nodes (15): BYOK (Bring Your Own Key) AI Model, Cross-entity Contradiction Checking, InkForge - AI Novel Writing Workbench, Next.js + React Tech Stack, Rationale: BYOK Eliminates Product Model Cost, Rationale: AI Context Injection Solves Consistency Pain Point, Worldview Encyclopedia Context Injection, Decision: Use getChapters sorted query for test reliability (+7 more)

### Community 4 - "AI Hooks & Generation"
Cohesion: 0.17
Nodes (6): handleCheckDuplicate(), useAIChat(), useAIConfig(), useChapterGeneration(), useChapters(), useWorldEntries()

### Community 5 - "AI Chat Panel Actions"
Cohesion: 0.24
Nodes (7): findEntryIdByName(), handleAdoptRelationship(), handleKeyDown(), handleLinkExisting(), handleSaveNewEntry(), handleSend(), showToast()

### Community 6 - "Editor & Autosave"
Cohesion: 0.22
Nodes (5): useAutoSave(), useChapterEditor(), getTypeBadgeColor(), getTypeIcon(), WorldEntryEditForm()

### Community 7 - "Suggestion Parser"
Cohesion: 0.38
Nodes (9): createNewEntrySuggestion(), createRelationshipSuggestion(), deduplicateSuggestions(), filterByConfidence(), inferEntryTypes(), limitSuggestions(), parseAISuggestions(), parseNewEntrySuggestions() (+1 more)

### Community 8 - "World Entry Queries"
Cohesion: 0.2
Nodes (1): getWorldEntryById()

### Community 9 - "Agent Architecture"
Cohesion: 0.24
Nodes (10): Markdown-defined Agent Personas (24 agents), gsd-tools.cjs CLI Entry Point, Context Window Monitoring, Dual Runtime Support (Claude Code + OpenCode), GSD (Get Shit Done) Framework v1.34.2, Runtime Hook System (PreToolUse/PostToolUse), Model Profile System (quality/balanced/budget/adaptive), .planning/ State Machine (STATE.md, ROADMAP.md, config.json) (+2 more)

### Community 10 - "Context Injection"
Cohesion: 0.31
Nodes (6): buildContextPrompt(), findRelevantEntries(), formatEntryForContext(), injectContext(), matchKeyword(), trimToTokenBudget()

### Community 11 - "Project & Word Count"
Cohesion: 0.29
Nodes (5): ProjectLayout(), useProjects(), updateTodayWordCount(), useTodayWordCount(), useTotalWordCount()

### Community 12 - "Workspace Layout"
Cohesion: 0.29
Nodes (0): 

### Community 13 - "Project Card UI"
Cohesion: 0.33
Nodes (2): handleTitleKeyDown(), handleTitleSave()

### Community 14 - "Auth Status & Sync"
Cohesion: 0.33
Nodes (3): AuthStatus(), SyncProgress(), useAuth()

### Community 15 - "New Entry Dialog"
Cohesion: 0.5
Nodes (2): buildEntry(), handleSave()

### Community 16 - "Tag Input Component"
Cohesion: 0.6
Nodes (3): addTag(), handleKeyDown(), removeTag()

### Community 17 - "Theme Provider"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Outline Edit Form"
Cohesion: 0.5
Nodes (0): 

### Community 19 - "Project Dashboard"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "Suggestion Cards"
Cohesion: 0.5
Nodes (0): 

### Community 21 - "Middleware Stack"
Cohesion: 0.5
Nodes (2): middleware(), updateSession()

### Community 22 - "Conflict Resolver"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "Generation Panel"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Outline Tab"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "AI Config Dialog"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Duplicate Entry Dialog"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Meta Database"
Cohesion: 0.67
Nodes (1): InkForgeMetaDB

### Community 28 - "Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Authenticated Layout"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Auth Page"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Chapter Row"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Create Chapter"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Delete Chapter Dialog"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Editor Toolbar"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Floating Toolbar"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Create Project Modal"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Empty Dashboard"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Project Settings Dialog"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Project Settings Form"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Draft Card"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Resizable Panel"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Create Entry Input"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Delete Entry Dialog"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "EPUB Type Defs"
Cohesion: 1.0
Nodes (1): EPub

### Community 46 - "Dismissed Suggestions"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Layout Hook"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Relations Hook"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Supabase Client"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Utility Functions"
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
Nodes (0): 

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (1): Browser Window Icon (SVG)

## Knowledge Gaps
- **14 isolated node(s):** `EPub`, `Dual Runtime Support (Claude Code + OpenCode)`, `Security Layer (Path Traversal, Prompt Injection)`, `Context Window Monitoring`, `Model Profile System (quality/balanced/budget/adaptive)` (+9 more)
  These have ¡Ü1 connection - possible missing edges or undocumented components.
- **Thin community `Root Layout`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page`** (2 nodes): `Home()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Authenticated Layout`** (2 nodes): `AuthenticatedLayoutClient()`, `AuthenticatedLayoutClient.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Page`** (2 nodes): `AuthPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chapter Row`** (2 nodes): `ChapterRow()`, `chapter-row.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Chapter`** (2 nodes): `CreateChapterInput()`, `create-chapter-input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Delete Chapter Dialog`** (2 nodes): `DeleteChapterDialog()`, `delete-chapter-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Editor Toolbar`** (2 nodes): `EditorToolbar()`, `editor-toolbar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Floating Toolbar`** (2 nodes): `FloatingToolbar()`, `floating-toolbar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Project Modal`** (2 nodes): `CreateProjectModal()`, `create-project-modal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Empty Dashboard`** (2 nodes): `EmptyDashboard()`, `empty-dashboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Settings Dialog`** (2 nodes): `getStepText()`, `project-settings-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Settings Form`** (2 nodes): `handleFormSubmit()`, `project-settings-form.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Draft Card`** (2 nodes): `DraftCard()`, `draft-card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Resizable Panel`** (2 nodes): `ResizablePanelGroup()`, `resizable-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Entry Input`** (2 nodes): `CreateEntryInput()`, `create-entry-input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Delete Entry Dialog`** (2 nodes): `DeleteEntryDialog()`, `delete-entry-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `EPUB Type Defs`** (2 nodes): `EPub`, `epub-gen.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dismissed Suggestions`** (2 nodes): `use-dismissed-suggestions.ts`, `useDismissedSuggestions()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Layout Hook`** (2 nodes): `use-layout.ts`, `useLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Relations Hook`** (2 nodes): `use-relations.ts`, `useRelations()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Client`** (2 nodes): `createClient()`, `client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility Functions`** (2 nodes): `cn()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `chapter-context-menu.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `editor-types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `editor.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `select.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `message-bubble.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `chapter-queries.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `meta-db.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `project-db.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `relation-queries.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `world-entry-queries.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `use-autosave.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `use-projects.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `chapter.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `project.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `relation.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `world-entry.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `Browser Window Icon (SVG)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Auth & Session Management` to `Chapter Data Operations`, `World Entry Queries`, `Context Injection`, `Project & Word Count`, `Middleware Stack`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Auth & Session Management` to `Auth Status & Sync`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `duplicateChapter()` connect `Chapter Data Operations` to `Auth & Session Management`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `GET()` (e.g. with `middleware()` and `signUp()`) actually correct?**
  _`GET()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `createClient()` (e.g. with `AuthenticatedLayout()` and `signUp()`) actually correct?**
  _`createClient()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `flushSyncQueue()` (e.g. with `triggerImmediateSync()` and `createClient()`) actually correct?**
  _`flushSyncQueue()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `EPub`, `Dual Runtime Support (Claude Code + OpenCode)`, `Security Layer (Path Traversal, Prompt Injection)` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._