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
- **State**: Zustand for global state, React hooks for local/per-feature state
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

Create per-project DB instances via `createProjectDB(projectId)`. The project DB is currently at schema version 4.

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
