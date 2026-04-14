# Roadmap: InkForge

## Overview

InkForge 是一款面向中文网文作者的 AI 小说写作专业工作台。从项目与编辑器基础开始，逐步构建多面板工作区、世界观百科、AI 集成、智能上下文注入，最后加入云同步和 AI 一致性守护。核心路径：先让作者能写（本地），再让 AI 理解故事世界，最后让 AI 主动检查矛盾——每个阶段都交付完整可用的功能。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project & Chapter Foundation** — 项目与章节管理基础，中文优先 UI
- [ ] **Phase 2: Writing Editor** — 富文本编辑器，中文 IME 支持，字数统计
- [ ] **Phase 3: Workspace & Chapter Outline** — 多面板工作区框架，章节大纲
- [ ] **Phase 4: World Bible** — 世界观百科条目 CRUD 与关联
- [ ] **Phase 5: BYOK & AI Chat** — AI 供应商配置，聊天面板，完整四面板工作区
- [ ] **Phase 6: Context Assembly & Smart AI** — 上下文自动注入，选文讨论，AI 建议关联与条目
- [ ] **Phase 7: Chapter Generation & Export** — 大纲生章，多格式导出
- [ ] **Phase 8: Authentication & Cloud Sync** — 用户账号，全项目云同步
- [ ] **Phase 9: AI Consistency Guardian** — AI 主动矛盾检测与提示

## Phase Details

### Phase 1: Project & Chapter Foundation
**Goal**: Authors can create and organize novel projects in a Chinese-first environment
**Depends on**: Nothing (first phase)
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, L10N-01
**Success Criteria** (what must be TRUE):
  1. Author can create a novel project and manage a list of projects
  2. Author can create, edit, and delete chapters within a project
  3. Author can drag-reorder chapters in the chapter list
  4. All UI labels, buttons, and menus display in Simplified Chinese
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold, Dexie.js data layer, and project dashboard
- [x] 01-02-PLAN.md — Chapter sidebar with drag-reorder and context menu

### Phase 2: Writing Editor
**Goal**: Authors can write chapters with a rich editor that handles Chinese text correctly and tracks their writing progress
**Depends on**: Phase 1
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, PROJ-05
**Success Criteria** (what must be TRUE):
  1. Author can format text with bold, italic, headings, and other basic styles in the editor
  2. Editor content autosaves automatically without requiring manual save
  3. Author can switch between dark and light themes
  4. Chinese IME composition works correctly without spurious actions during input
  5. Author can see total word count (字数), per-chapter word count, and today's writing word count
**Plans**: 4 plans
- [x] 02-01-PLAN.md — Tiptap editor core with autosave
- [x] 02-02-PLAN.md — Format toolbar and theme switching
- [x] 02-03-PLAN.md — Word count display and focus mode
- [x] 02-04-PLAN.md — Fix today's word count update gap
**UI hint**: yes

### Phase 3: Workspace & Chapter Outline
**Goal**: Authors can customize their workspace with resizable panels and plan their story with structured outlines
**Depends on**: Phase 2
**Requirements**: WORK-02, WORK-03, OTLN-01
**Success Criteria** (what must be TRUE):
  1. Author can drag panel borders to resize panels in the workspace
  2. Workspace panel layout persists between sessions
  3. Author can create and manage chapter/plot outlines in an outline panel visible alongside the editor
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — ResizablePanel, Chapter outline data model, and layout persistence
- [x] 03-02-PLAN.md — Sidebar tabs, outline tab list, and outline editing form

### Phase 4: World Bible
**Goal**: Authors can define their story world with structured entries for characters, locations, rules, and timelines, and manually link them together
**Depends on**: Phase 3
**Requirements**: WRLD-01, WRLD-02, WRLD-03, WRLD-04, WRLD-05, WRLD-08
**Success Criteria** (what must be TRUE):
  1. Author can create character entries with name, appearance, personality, background, and relationship fields
  2. Author can create location entries and rule/setting entries
  3. Author can create timeline entries for story events
  4. Author can manually establish relationships between entries (e.g., character ↔ location, character ↔ character)
  5. Author can search and browse world bible entries by category and keyword
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Data layer: types, Dexie v3 schema, queries, hooks
- [ ] 04-02-PLAN.md — World bible sidebar tab: type-grouped entries, search, creation, deletion
- [ ] 04-03-PLAN.md — Entry edit form with relationships: type-specific fields, auto-save, bidirectional linking

**UI hint**: yes

### Phase 5: BYOK & AI Chat
**Goal**: Authors can configure their AI provider and interact with AI in a dedicated chat panel, completing the full four-panel workspace
**Depends on**: Phase 4
**Requirements**: AI-01, AI-02, AI-03, L10N-02, WORK-01
**Success Criteria** (what must be TRUE):
  1. Author can input API Key and Base URL to configure their AI provider
  2. Author can chat with AI in a dedicated chat panel within the workspace
  3. AI generates drafts in the chat panel that the author can accept into the editor
  4. All four workspace panels (world bible, outline, editor, AI chat) are visible simultaneously
  5. AI prompts are optimized for Chinese novel writing contexts
**Plans**: TBD
**UI hint**: yes

### Phase 6: Context Assembly & Smart AI
**Goal**: AI automatically understands the author's story world and can discuss selected text passages with the author
**Depends on**: Phase 5
**Requirements**: AI-04, AI-05, WRLD-06, WRLD-07
**Success Criteria** (what must be TRUE):
  1. AI automatically injects relevant world bible context (characters, locations, rules, timelines) into generation requests
  2. Author can select text in the editor and open a discussion about it in the AI chat panel
  3. AI suggests relationships between world bible entries based on content analysis
  4. AI suggests new world bible entries based on draft content
**Plans**: TBD
**UI hint**: yes

### Phase 7: Chapter Generation & Export
**Goal**: Authors can generate complete chapters from outlines and export their work in standard formats
**Depends on**: Phase 6
**Requirements**: OTLN-02, EXPT-01, EXPT-02, EXPT-03
**Success Criteria** (what must be TRUE):
  1. Author can generate a complete chapter from an outline with world bible context automatically injected
  2. Author can export the entire novel as Markdown
  3. Author can export the entire novel as DOCX
  4. Author can export the entire novel as EPUB
**Plans**: TBD
**UI hint**: yes

### Phase 8: Authentication & Cloud Sync
**Goal**: Authors can securely access their accounts and have their work automatically synchronized across devices
**Depends on**: Phase 7
**Requirements**: AUTH-01, AUTH-02, AUTH-03, SYNC-01, SYNC-02
**Success Criteria** (what must be TRUE):
  1. Author can register an account using email and password
  2. Author can log in and maintain their session across browser refreshes
  3. Author can log out from any page
  4. Project data (chapters, world bible, settings) automatically syncs to the cloud
  5. Author can access the same project data from a different device
**Plans**: TBD
**UI hint**: yes

### Phase 9: AI Consistency Guardian
**Goal**: AI proactively detects contradictions between generated content and the author's established world settings
**Depends on**: Phase 6
**Requirements**: AI-06
**Success Criteria** (what must be TRUE):
  1. AI flags content that contradicts established world bible entries (characters, locations, rules, timelines)
  2. Author receives clear, actionable notification when inconsistencies are detected
  3. Author can dismiss or acknowledge inconsistency warnings
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
(Phase 9 depends on Phase 6 and can theoretically parallel with Phases 7–8, but is placed last for stability)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project & Chapter Foundation | 0/2 | Planning complete | - |
| 2. Writing Editor | 0/3 | Planning complete | - |
| 3. Workspace & Chapter Outline | 0/? | Not started | - |
| 4. World Bible | 0/3 | Planning complete | - |
| 5. BYOK & AI Chat | 0/? | Not started | - |
| 6. Context Assembly & Smart AI | 0/? | Not started | - |
| 7. Chapter Generation & Export | 0/? | Not started | - |
| 8. Authentication & Cloud Sync | 0/? | Not started | - |
| 9. AI Consistency Guardian | 0/? | Not started | - |