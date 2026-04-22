# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# InkForge

AI novel writing workbench for Chinese web novel authors. Multi-panel layout integrates world-building encyclopedia, outline, chapter editor, AI chat, and creator analytics. Core differentiator: AI automatically injects context based on world-building entries and proactively checks for consistency contradictions.

Offline-first, BYOK (bring your own API key), data stored locally in browser.

## Tech Stack

- Next.js 16 (App Router) · React 19 · TypeScript strict mode
- Tailwind CSS 4 · Radix UI · Tiptap 3 (ProseMirror-based editor)
- Dexie.js (IndexedDB, project-level database isolation)
- Supabase (optional cloud sync)
- `@anthropic-ai/sdk` with OpenAI-compatible fallback
- Vitest + Playwright

## Commands

```bash
pnpm install
pnpm dev              # localhost:3000
pnpm build            # Turbopack production build
pnpm lint             # ESLint
pnpm test             # vitest run (unit tests)
pnpm test:watch       # vitest (watch mode)
pnpm test:e2e         # playwright test
```

Optional Supabase sync: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

## Architecture

### Data Layer (`src/lib/db/`)

Two-tier IndexedDB architecture via Dexie.js:
- `metaDb` — project list, global settings, user preferences
- `createProjectDB()` — per-project isolated DB (chapters, world entries, relations, chat messages, AI config)

Schema versioning via migration functions in `project-db.ts`.

### AI Layer (`src/lib/ai/`)

Provider-agnostic client in `client.ts`:
- `streamChat()` — unified async iterable of `AIEvent` objects
- `supportsToolUse()` — only Anthropic supports tool use
- Providers: `anthropic` (native), `openai-compatible` (DeepSeek, SiliconFlow, LiteLLM)

Key modules:
- `prompts.ts` — segmented system prompt construction with world-building context injection
- `suggestion-parser.ts` — parses structured suggestions from AI responses
- `tools/schemas.ts` — tool use schemas for structured suggestions (new entry, relationship, contradiction warning)

### Component Organization (`src/components/`)

- `ui/` — Radix-based primitive components (button, dialog, input, etc.)
- `workspace/` — main multi-panel workspace components
- `editor/` — Tiptap editor, floating toolbar, chapter metadata
- `chapter/` — chapter sidebar, context menu
- `world-bible/` — world entry forms, relationship section, tag input
- `analysis/` — relation-graph (force-directed), timeline-view, contradiction-dashboard
- `project/` — project dashboard, settings, creation modal
- `auth/` — authentication UI components
- `sync/` — Supabase sync progress and status

### App Routing (`src/app/`)

- `/` — marketing/landing page
- `/auth` — authentication pages
- `/(authenticated)/` — authenticated layout with workspace shell
- `/projects/[id]` — project workspace layout
- `/projects/[id]/analysis` — analytics view

### OpenSpec Workflow

Changes follow the OpenSpec spec-driven workflow. Use the `openspec-*` skills to create, implement, or archive changes:

- `Skill('openspec-propose')` — propose a new change with design, specs, and tasks
- `Skill('openspec-apply-change')` — implement tasks from an OpenSpec change
- `Skill('openspec-archive-change')` — archive a completed change

Active changes live in `openspec/changes/`, archived changes in `openspec/changes/archive/`.

## Key Conventions

- AI config (API key, base URL) stored per-project in IndexedDB — never sent to any server
- BYOK model: user provides their own API keys
- Prompt caching enabled by default (1 hour TTL) for Anthropic provider
- Structured suggestions via tool use, not regex parsing
- Two-level database isolation: meta-level (projects) and project-level (content)

## GStack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__playwright__*` or `mcp__claude-in-chrome__*` tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /plan-devex-review, /devex-review, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn
