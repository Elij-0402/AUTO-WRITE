# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InkForge is an AI-powered novel writing workstation for Chinese web novel authors. It features a multi-panel workspace with world bible management, chapter editing (Tiptap), outline planning, and AI chat with automatic world-bible context injection. The UI is Chinese-first (`lang="zh-CN"`). Users bring their own API key (BYOK model) — no built-in AI costs.

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, core-web-vitals + typescript)
npm test             # Run all tests (vitest run)
npm run test:watch   # Watch mode (vitest)
```

Run a single test file:
```bash
npx vitest run src/lib/db/meta-db.test.ts
```

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`), stone palette with blue accents, dark/light theme
- **Editor**: Tiptap (ProseMirror-based rich text)
- **State**: React hooks per feature + Dexie `useLiveQuery` for live DB reads
- **Database**: Dexie.js (IndexedDB wrapper) — offline-first, two-tier DB pattern (see below)
- **Cloud sync**: Supabase (auth + optional data sync), `@supabase/ssr`
- **UI primitives**: Radix UI (Dialog, DropdownMenu, Select), Lucide icons, `react-resizable-panels`
- **Forms**: React Hook Form + Zod validation
- **DnD**: @dnd-kit (chapter reordering)
- **Export**: EPUB (`epub-gen`), DOCX (`docx`), Markdown
- **Testing**: Vitest + @testing-library/react + jsdom + `fake-indexeddb`
- **Font**: Noto Sans SC (Chinese-optimized)

## Architecture

### Two-Tier IndexedDB Pattern

Data is split across two Dexie databases for project isolation:

1. **`inkforge-meta`** (`src/lib/db/meta-db.ts`) — shared singleton, stores `projectIndex` (project listings for the dashboard)
2. **`inkforge-project-{id}`** (`src/lib/db/project-db.ts`) — one per project, stores `chapters`, `worldEntries`, `relations`, `layoutSettings`, `aiConfig`, `messages`

Create per-project DB instances via `createProjectDB(projectId)`. The project DB is currently at schema version 11 (adds `revisions`, `embeddings`, `analyses`, `conversations`, `aiUsage` tables on top of the original core tables).

### Domain Types

Defined in `src/lib/types/`:
- **ProjectMeta** — title, genre, synopsis, word counts (total + daily)
- **Chapter** — Tiptap content (ProseMirror JSON), order, status (draft/completed), outline fields
- **WorldEntry** — type-discriminated union: `character | location | rule | timeline`, each with type-specific fields
- **Relation** — bidirectional links between world entries with directional labels

### Key Layers

- **`src/lib/db/`** — Database classes and query functions (`chapter-queries.ts`, `world-entry-queries.ts`, `relation-queries.ts`)
- **`src/lib/hooks/`** — React hooks per feature: `use-chapters`, `use-world-entries`, `use-relations`, `use-ai-chat`, `use-autosave`, `use-layout`, `use-context-injection`
- **`src/lib/ai/`** — AI suggestion parsing from chat responses
- **`src/lib/sync/`** — Supabase sync engine: queue, conflict resolver, engine
- **`src/lib/export/`** — EPUB, DOCX, Markdown export utilities

### Workspace Layout

The project workspace (`src/app/projects/[id]/page.tsx`) is a four-panel layout:
- **Left sidebar** (280px default): 3 tabs — chapters, outline, world bible
- **Center editor**: Tiptap editor or outline/world-entry edit forms depending on active tab
- **Right panel** (320px default): AI chat with context injection

All panels are resizable via `react-resizable-panels` with per-project layout persistence in IndexedDB.

### AI Context Injection

`src/lib/hooks/use-context-injection.ts` implements keyword-based matching of user messages against world bible entries, with:
- Token budget of 4000 tokens (estimated at ~1.5 chars/token for Chinese)
- Priority trimming order: character > location > rule > timeline
- Injected into the system prompt as `【世界观百科】` section

### Phase B-D Experiment Flags

`src/lib/ai/experiment-flags.ts` defines opt-in 2026 Anthropic primitives, gated per-project via `AIConfig.experimentFlags` and resolved with provider-awareness (Anthropic-only):

- **`citations`** (Phase C): world-bible is sent as a Custom Content document (one block per WorldEntry) with `citations: { enabled: true }`, enforcing grounded responses. Each assistant message persists `citations[]` for UI 溯源 chips. Implemented in `src/lib/ai/citations.ts`, `src/lib/ai/providers/anthropic.ts`, `src/components/workspace/citation-chip.tsx`.
- **`extendedCacheTtl`** (Phase D): sends `anthropic-beta: extended-cache-ttl-2025-04-11` header for 1-hour cache TTL (default 5 min).
- **`thinking`** (Phase C stub / v1.1): toggle exposed in UI; behavioral implementation deferred to v1.1 based on A/B data from `abTestMetrics`.

Every AI chat turn writes both `aiUsage` (token/latency) and `abTestMetrics` (experiment group + citation count). See `src/lib/db/ab-metrics-queries.ts` for aggregation.

### Cloud Sync

Optional Supabase sync (`src/lib/sync/`):
- Offline-first: local IndexedDB is the source of truth
- Sync queue with retry logic (max 5 retries, exponential backoff)
- `aiConfig` is never synced (stays local only)
- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars

### Routing

Next.js App Router with:
- `/` — Dashboard (project listing), redirects to `/auth` if unauthenticated
- `/projects/[id]` — Project workspace (four-panel editor)
- `/auth` — Supabase authentication
- `(authenticated)` route group for protected pages

## Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **Soft deletes**: Entities use `deletedAt: Date | null` — filter with `!deletedAt` for active records
- **IDs**: Generated via `crypto.randomUUID()` or `nanoid`
- **All UI text is in Chinese** — labels, placeholders, error messages, AI prompts
- **Design references**: Code comments use `D-XX` notation (e.g., "per D-07") referencing internal design decision documents

## Testing

Tests live alongside source files as `*.test.ts` / `*.test.tsx`. The test setup (`src/test/setup.ts`):
- Provides `fake-indexeddb/auto` for Dexie.js tests
- Mocks `@/lib/supabase/client` globally
- Uses jsdom environment with `@testing-library/jest-dom` matchers
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
