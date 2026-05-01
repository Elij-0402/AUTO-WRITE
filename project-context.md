---
project_name: 'InkForge'
user_name: 'Elij'
date: '2026-04-29'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - code_quality_rules
  - workflow_rules
  - critical_rules
existing_patterns_found: 9
---

# Project Context for AI Agents

_This file captures the project-specific rules that AI agents are most likely to miss. Keep it lean, concrete, and architecture-aware._

---

## Technology Stack & Versions

- Next.js `16.2.3` with App Router in `src/app/`
- React `19.2.4`
- TypeScript `strict` with `@/* -> src/*` alias and `moduleResolution: bundler`
- Tailwind CSS `4` + `@tailwindcss/postcss`
- Tiptap `3.22.3`
- Dexie `4.4.2` + `dexie-react-hooks`
- Supabase SSR `0.10.2` for optional auth/sync
- Vitest `4.1.4` + React Testing Library + `jsdom`
- Playwright `1.59.1`

## Critical Implementation Rules

### Language-Specific Rules

- Preserve the existing code style: single quotes, no semicolons, 2-space indentation.
- Keep TypeScript strict-safe. Do not add `any`, broad casts, or nullable shortcuts when a typed local helper will do.
- Use the `@/` alias for app imports instead of deep relative traversals.
- Prefer existing domain types from `src/lib/types/` before introducing new local interfaces.
- Keep comments sparse and high-signal. Most files in this repo explain intent through naming and small functions.

### Framework-Specific Rules

- Treat Next.js as a route shell, not the primary business layer. Most behavior belongs in feature hooks under `src/lib/hooks/`.
- Keep feature ownership aligned with current structure:
  - route/layout entry in `src/app/`
  - UI in `src/components/<feature>/`
  - persistence/integration in `src/lib/**`
- For workspace behavior, respect the existing split between persisted layout state and URL state. `useWorkspaceLayout()` synchronizes `tab`, `chapter`, `entry`, and planning selection into the URL; changes here can easily regress refresh/deeplink behavior.
- For AI chat changes, start from `src/lib/hooks/use-ai-chat.ts`, not the provider files. It owns context injection, rolling summaries, suggestions, contradiction capture, and stream lifecycle.
- For editor changes, remember the persisted content is structured Tiptap JSON, not plain text.

### Data, DB, and Sync Rules

- The app is offline-first. Do not make core writing flows depend on Supabase availability.
- Preserve the dual-DB model:
  - `metaDb` stores cross-project index/global config
  - each project uses its own Dexie DB via `createProjectDB(projectId)`
- Any `project-db.ts` schema change must be paired with a migration strategy and targeted migration/query tests.
- Do not sync `aiConfig`; it is intentionally local-only BYOK state.
- Sync changes must respect existing field mapping and Last-Write-Wins assumptions in `src/lib/sync/`.
- Be careful with denormalized records such as contradictions and mirrored project metadata; they exist to support rendering and sync, not as accidental duplication to remove casually.

### Testing Rules

- Add or update tests for any behavior change in:
  - IndexedDB schema/queries/migrations
  - AI providers, prompts, or parsing
  - export flows
  - workspace layout or persisted UI state
  - sync queue and field mapping
- Co-locate unit/component tests beside source as `*.test.ts` or `*.test.tsx`.
- Use Playwright in `tests/` for cross-page workflows and persistence-sensitive behavior.
- Respect existing test setup in `src/test/setup.ts`: fake IndexedDB is already installed and Supabase client is mocked globally.
- Do not increase Playwright parallelism casually; local runs intentionally use `workers: 1` because IndexedDB-heavy flows become flaky otherwise.

### Code Quality & Style Rules

- Keep UI copy in Chinese.
- Read `DESIGN.md` before any visual change. It is the authority for typography, color, spacing, motion, and general product feel.
- Preserve the dark-first, monastic design language. Do not reintroduce decorative gradients, glows, pulse effects, oversized SaaS cards, or large-radius styling.
- Follow current naming conventions:
  - React components: PascalCase
  - hooks/utilities: camelCase
  - feature folders over generic buckets
- Reuse existing `components/ui/` primitives and established feature patterns before introducing new abstractions.

### Development Workflow Rules

- Use `pnpm` for all package and script operations.
- Standard validation before shipping meaningful changes:
  - `pnpm lint`
  - `pnpm test`
- Use targeted Vitest runs when touching a narrow persistence or hook surface.
- Follow Conventional Commit style: `<type>(<scope>): <subject>`.
- When a change affects IndexedDB schema, AI provider behavior, sync, or export format, call that out explicitly in PR/summary context.

### Critical Don't-Miss Rules

- Do not break offline-first behavior by moving reads/writes from IndexedDB into required network calls.
- Do not treat AI provider integration as stateless text streaming only; the current system also tracks usage, drafts, summaries, tool calls, contradictions, and aborted partial tool payloads.
- Do not simplify workspace state handling without checking URL restoration, persisted layout state, chapter brief state, and keyboard shortcuts together.
- Do not remove migration coverage when changing Dexie versions or stores; old local databases are part of the supported upgrade path.
- Do not replace structured export/editor/document handling with ad hoc string manipulation when existing typed helpers already define the wire format.
- Do not localize only part of a user-facing flow; mixed Chinese/English UI in core product surfaces is a regression here.
