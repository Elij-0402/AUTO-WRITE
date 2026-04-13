# Project Research Summary

**Project:** InkForge (AI小说专业工作台)
**Domain:** AI-powered novel writing workstation (Chinese-first, BYOK, multi-panel)
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

InkForge is a Chinese-first AI novel writing workstation that combines a multi-panel workspace (editor, world bible, outline, AI chat) with BYOK LLM integration and automatic context injection. The closest competitor is Sudowrite, but no existing tool — Western or Chinese — offers dedicated world-building lore management with AI consistency checking for novels. This represents a clear market gap. The product's kill feature is **proactive inconsistency detection** (AI flags contradictions against established lore), which no competitor implements well.

The recommended architecture is local-first with cloud sync (SQLite as source of truth, Supabase for cross-device sync), built on Next.js 16 + Tiptap for the editor, Zustand for global state across panels, and Vercel AI SDK for BYOK provider abstraction. The single most critical architectural decision — which must be made before any editor code is written — is the **chapter-per-editor-instance** model: never load an entire novel into a single ProseMirror document, or performance collapses at 30k+ characters. The **Draft-then-Accept** pattern (AI generates in chat panel, user manually adopts to editor) is the core interaction model and must never be compromised with inline auto-insertion.

The key risks are: (1) context window overflow from world bible injection (mitigated by a token budget system designed from day one), (2) BYOK multi-provider fragmentation (mitigated by building a provider abstraction layer first), and (3) cloud sync destroying novel content via bad conflict resolution (mitigated by chapter-level sync boundaries and never auto-merging text). Chinese-first development is not an afterthought — IME composition handling, character-based word counting, and CJK tokenization must be implemented from the start, not retrofitted.

## Key Findings

### Recommended Stack

The stack is Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 for the presentation layer; Tiptap 3 (ProseMirror-based) for the rich text editor; Supabase for PostgreSQL + Auth + Storage + Real-time; Vercel AI SDK for streaming BYOK LLM calls; Zustand for client state and React Query for server state; shadcn/ui + react-resizable-panels for multi-panel UI; next-intl for Chinese-first i18n; docx + epub-gen-memory for export; and Tauri 2 for desktop packaging (post-MVP). The BYOK model means users provide their own API keys — the platform never pays for inference.

**Core technologies:**
- **Tiptap (ProseMirror):** Rich text editor — best React integration, extensible, built-in character count and collaboration support. Must use chapter-per-editor-instance model.
- **Vercel AI SDK 6:** BYOK LLM streaming — `createOpenAICompatible()` for custom endpoints, `useChat` hook for chat UI, `streamText` for generation. Handles OpenAI, Anthropic, DeepSeek, and any OpenAI-compatible provider.
- **Supabase:** Backend — PostgreSQL with row-level security, auth with WeChat/oauth, storage. Eliminates months of custom backend work for BYOK model.
- **Zustand:** Global state — store-per-slice model maps cleanly to domain (editorStore, projectStore, chatStore, aiSettingsStore, uiStore). Required for multi-panel state synchronization.
- **react-resizable-panels:** Multi-panel layout — battle-tested by VS Code, accessible, persistent layouts. The workspace IS the product.
- **next-intl:** Chinese-first i18n — zh-CN as default locale, proper CJK date/number formatting.

### Expected Features

**Must have (table stakes — v1 launch):**
- BYOK Model Support — no AI features work without it; architectural foundation
- Project/Novel Management — container for everything
- Chapter Management (flat list, drag-reorder) — core writing organization
- Rich Text Editor with autosave — the writing surface
- World-Building Entries (characters, locations, rules) — structured lore that feeds AI
- AI Chat Interaction — chat interface where AI generates drafts based on context
- Draft-in-Chat → Manual Adopt to Editor — core interaction pattern; AI NEVER auto-inserts
- AI Auto-Context Injection — automatically select relevant lore entries for AI prompts
- Multi-Panel Workspace — simultaneous view of world bible, outline, editor, AI chat
- User Auth + Cloud Sync — cross-device access is survival for Chinese authors
- Word Count Statistics — daily/total/per-chapter (字数, not word count)
- Chinese-First UI — all labels in Simplified Chinese
- Export (Markdown, DOCX, EPUB) — author trust requires no lock-in
- Dark Mode — minimum theming expectation

**Should have (competitive differentiators — v1.x):**
- AI Proactive Inconsistency Detection — the kill feature, but VERY HIGH complexity; validate core flow first
- Outline-to-Chapter Generation — Sudowrite's Story Engine equivalent; requires solid outline + chapter structure
- AI Chat with Selected Text — cross-panel selection-to-chat; requires stable multi-panel workspace
- AI-Suggested World-Building Entries — AI reads draft and suggests new lore entries
- Chinese Web Novel Workflow (daily targets, streaks) — optimization for 网文 serialization culture

**Defer (v2+):**
- Lore Relationship Graph Visualization — eye-catching but expensive; start with simple link lists
- Timeline/Chronological Tracking — very complex, most authors manage this externally
- Mobile-First Experience — desktop web first; mobile is a separate product
- Real-time Collaborative Writing — single-author tool for v1; CRDT complexity is unjustified
- Inline AI Autocomplete — fundamentally conflicts with Draft-then-Accept philosophy

### Architecture Approach

Multi-panel workspace with local-first data model and BYOK AI integration. The presentation layer uses react-resizable-panels for an IDE-like layout where world bible, outline, editor, and AI chat are visible simultaneously. State flows through domain-scoped Zustand stores (not scattered React state). The critical data flow is: user writes → Context Assembler queries World Bible Store → scores entries by relevance → assembles prompt within token budget → AI Service streams response → Chat Panel shows draft → user reviews → manual "Accept" inserts into editor at cursor position.

**Major components:**
1. **Workspace Layout Manager** — composes resizable panels; persists layout per user; the core UX differentiator
2. **Context Assembly Pipeline** — scores world bible entries by relevance, selects top-k within token budget, formats structured context blocks. This is the product's intelligence — AI that understands the story world
3. **BYOK Provider Router** — abstraction over Vercel AI SDK that creates dynamic provider instances from user-configured keys; handles provider-specific streaming, errors, and rate limits
4. **Chapter Editor (Tiptap)** — one editor instance per chapter, never the whole novel; vanilla DOM NodeViews for performance
5. **Sync Engine** — local SQLite first, chapter-level sync boundaries, conflict detection with user resolution (never auto-merge)

### Critical Pitfalls

1. **ProseMirror performance collapse on long novels** — Never store an entire novel in one document. Use chapter-per-editor-instance. Load one chapter at a time. This decision must be made in Phase 1 before any editor code.
2. **Context window overflow from world bible auto-injection** — Implement token budget system with provider-specific tokenizers before any AI generation feature. Chinese text averages 2-3 tokens per character in GPT-4, not 0.25. Always leave 15% headroom.
3. **BYOK multi-provider API fragmentation** — Build provider abstraction layer first, before any AI UI. Each provider has different streaming, error formats, rate limits. Use Vercel AI SDK's provider-agnostic interface; never let provider API formats leak into UI code.
4. **Multi-panel state goes stale** — Use a single global Zustand store, not local React state per panel. Stamp AI requests with context version hash; reject responses if context changed. Debounce UI rendering, not state updates.
5. **Cloud sync destroys content via bad conflict resolution** — Chapters are atomic sync units. Never auto-merge text. Always surface conflicts for user resolution. Use ProseMirror Step-based operations for conflict detection, not whole-doc diffing.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Editor & Project Foundation
**Rationale:** Multiple critical architectural decisions must be locked before anything else: chapter-per-editor model, global Zustand store architecture, multi-panel layout system, and Chinese-first text processing. Building the wrong foundation requires a full rewrite.
**Delivers:** Working project/chapter management, rich text editor with chapter-per-editor model, resizable multi-panel workspace, Chinese IME support, word count (字数), dark mode
**Addresses:** Project/Novel management, Chapter management, Rich text editor, Multi-panel workspace, Chinese-first UI, Word count, Dark mode
**Avoids:** ProseMirror performance collapse (chapter-per-editor), multi-panel stale state (global store from day one), Chinese IME bugs (built in from start)

### Phase 2: World Bible & AI Integration
**Rationale:** World-building entries are a prerequisite for AI context injection (dependency chain), and BYOK provider abstraction is a prerequisite for all AI features. Both must be built before the core AI experience works.
**Delivers:** World bible CRUD (characters, locations, rules), BYOK provider configuration, AI chat with streaming, Context Assembly Pipeline with token budget, Draft-then-Accept flow
**Addresses:** World-building entries, BYOK model support, AI chat interaction, AI auto-context injection, Draft-in-chat → manual adopt
**Avoids:** Context window overflow (token budget system built from start), BYOK fragmentation (provider abstraction first), AI auto-insertion (Draft-then-Accept enforced architecturally)

### Phase 3: Core Polish & Export
**Rationale:** With the core writing + AI loop working, add the features that make the product feel complete: exports, outline panel, and the cross-panel selection-to-chat pattern.
**Delivers:** Outline panel with drag-reorder, AI chat with selected text, Export (Markdown, DOCX, EPUB), context visibility (show which entries AI received), Chinese web novel workflow basics
**Addresses:** Export, Outline-to-chapter generation (basic), AI chat with selected text, context transparency
**Avoids:** Consistency checking false positives (limited to on-demand in this phase, not real-time)

### Phase 4: Cloud Sync & Authentication
**Rationale:** The architecture is local-first, so cloud sync is additive. Building the local foundation first means sync is a layer on top, not a constraint on the data model. Chapter-level sync boundaries from Phase 1 directly enable clean conflict resolution.
**Delivers:** Supabase Auth (email, WeChat, OAuth), cloud sync with chapter-level boundaries, conflict detection and user resolution, offline-first with sync resumption, API key encryption
**Addresses:** User auth + cloud sync, offline capability
**Avoids:** Sync destroying content (chapter boundaries, never auto-merge), API key theft (encryption, not localStorage plaintext)

### Phase 5: Differentiators
**Rationale:** The kill feature (inconsistency detection) requires a stable foundation: world bible entries, context injection, AI chat, multi-panel workspace all must work first. Building it earlier means building on sand.
**Delivers:** AI proactive inconsistency detection (the key differentiator), AI-suggested world-building entries, lore entry relationships (manual), web novel workflow optimizations (daily targets, streaks)
**Addresses:** AI inconsistency detection, AI-suggested lore entries, lore relationships, web novel workflow
**Avoids:** False positive fatigue (scoped checks only, confidence thresholds, user dismissal memory)

### Phase Ordering Rationale

- **Phase 1 must come first** because the chapter-per-editor and global store decisions are architecturally foundational. Retrofitting these requires a full rewrite (recovery cost: HIGH for both).
- **Phase 2 depends on Phase 1** because world bible entries feed context injection, and the editor must exist before AI chat can accept drafts into it. BYOK provider abstraction is the foundation for all AI features.
- **Phase 3 depends on Phase 2** because export requires editor content, context transparency requires the assembly pipeline, and cross-panel selection-to-chat requires both editor and chat panels to be stable.
- **Phase 4 can be built in parallel with Phase 3** in terms of engineering effort, but logically it follows because the local-first priority means sync is additive on top of a working local app.
- **Phase 5 comes last** because inconsistency detection requires world bible + context injection + AI chat to all be working reliably. It's the highest-risk, highest-reward feature.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** TipTap + React 19 integration patterns (newer versions, check for breaking changes), react-resizable-panels accessibility and persistence patterns, Chinese IME composition handling with Tiptap
- **Phase 2:** Vercel AI SDK v6 provider-specific error handling and streaming quirks, token counting libraries for multiple providers (tiktoken for OpenAI, Anthropic's tokenizer), prompt engineering for Chinese novel writing context injection
- **Phase 3:** DOCX/EPUB export library quality with Chinese content (epub-gen-memory has limited maintenance — may need alternatives), cross-panel selection-to-chat UX patterns
- **Phase 4:** Supabase RLS policies for multi-device sync, ProseMirror Step-based sync architecture, Chinese text diffing algorithms
- **Phase 5:** LLM-based inconsistency detection prompt design, false positive reduction strategies, entity extraction from Chinese novel text

Phases with standard patterns (skip research-phase):
- **Phase 1 (partial):** Zustand store architecture, Next.js App Router project structure, shadcn/ui components — all well-documented
- **Phase 4 (partial):** Supabase Auth setup, OAuth flow — well-documented with Next.js integration guides

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies (Next.js 16, Tiptap, Vercel AI SDK, Supabase, Zustand) verified against official docs. Clear version compatibility matrix. Lower confidence on epub-gen-memory (limited maintenance) and Tauri (static export constraint). |
| Features | HIGH for table stakes, MEDIUM for differentiators | Competitor features well-documented (Sudowrite, NovelAI). Chinese AI writing tool landscape based on training data, not live access. Inconsistency detection is unproven at this scale — no competitor implements it well, which is both an opportunity and a validation risk. |
| Architecture | HIGH | Multi-panel + local-first + BYOK is a well-understood pattern. Key architectural decisions (chapter-per-editor, global Zustand store, Context Assembly Pipeline, Draft-then-Accept) are informed by ProseMirror issues and writing tool analysis. |
| Pitfalls | MEDIUM | ProseMirror performance issues and Chinese text handling are well-documented. BYOK provider fragmentation is based on known API differences. Consistency checking false positive rates are estimated, not empirically validated. Cloud sync conflict patterns are well-understood from prior art. |

**Overall confidence:** HIGH — The core architecture is sound, the pitfalls are identified with clear prevention strategies, and the stack is proven. The main uncertainty is in the AI quality domain (how well inconsistency detection works, how reliable context injection is for Chinese novel writing).

### Gaps to Address

- **Inconsistency detection effectiveness:** No empirical data on false positive/negative rates for Chinese novel consistency checking. Need to validate during Phase 5 with realistic world bibles (20+ entries).
- **epub-gen-memory maintenance status:** Low confidence in this library for production EPUB export with Chinese content. May need to find alternatives or write custom EPUB generation during Phase 3.
- **Tauri + Next.js static export:** Tauri 2 requires `output: 'export'` which disables SSR, server actions, and API routes. Need to validate that the BYOK streaming approach works through Tauri's webview (desktop mode may need server-side proxy for API keys).
- **Token counting accuracy across providers:** Each LLM provider has a different tokenizer. Need provider-specific token counting, which adds complexity. Fall back to conservative estimation + 15% headroom if per-provider tokenizers are too expensive to integrate.
- **Chinese text diffing for sync:** Standard diff algorithms fail on Chinese text (no word boundaries). Need character-level diff with paragraph grouping. Evaluate `diff-match-patch` or similar during Phase 4 planning.

## Sources

### Primary (HIGH confidence)
- Next.js 16.2 docs — App Router, Server Components, Turbopack
- Tiptap official docs (tiptap.dev) — React integration, extensions, Markdown support
- Vercel AI SDK v6 docs (sdk.vercel.ai) — BYOK via `createOpenAICompatible`, streaming, `useChat` hook
- Supabase docs — Auth, RLS, PostgreSQL, Real-time subscriptions
- react-resizable-panels — npm, battle-tested by VS Code
- ProseMirror reference docs — document model, transactions, steps
- Tauri v2 docs — Next.js integration, static export requirement

### Secondary (MEDIUM confidence)
- Sudowrite public website — Story Bible, Canvas, AI generation features (no architecture docs)
- NovelAI documentation — Lorebook system, editor behavior
- Chinese AI writing tool landscape — 墨语, 秘塔写作猫, 阅文妙笔 (based on training data, not live access)
- Tiptap GitHub issues — performance analysis (ReactNodeViewRenderer, isActive)
- ProseMirror architecture patterns — step-based sync, decoration management

### Tertiary (LOW confidence)
- epub-gen-memory — npm registry v1.1.2, browser-compatible but limited maintenance; may need alternatives for production Chinese EPUB export
- Inconsistency detection effectiveness — no proven implementation exists; false positive/negative rates are theoretical estimates
- Tauri webview streaming compatibility — BYOK streaming through Tauri's webview needs validation

---
*Research completed: 2026-04-13*
*Ready for roadmap: yes*