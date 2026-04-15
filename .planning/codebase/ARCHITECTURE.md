# Application Architecture (InkForge)

## Overview
InkForge is an AI-powered novel writing workbench. It is structurally centered around a robust local-first strategy using Dexie (IndexedDB), ensuring authors can write offline with seamless sync to Supabase when online.

## Local-First Data Layer
The database layer splits into two primary models:
1. **Meta DB** (`src/lib/db/meta-db.ts`): Stores global data like workspaces, auth states, and project listings.
2. **Project DB** (`src/lib/db/project-db.ts`): Instantiated dynamically per-project ID. Contains chapters, world-bible entries, relations, and editor state.

## Sync Engine Component
The synchronization strategy is defined in `src/lib/sync/`:
- **Conflict Resolver**: Determines truth when local and cloud states clash.
- **Sync Engine/Queue**: Queues local modifications asynchronously for pushing to Supabase.
- **Sync Manager**: Exposes synchronization state to the UI via `useSync` hooks.

## AI Context Engine
The key value proposition is context-aware AI.
- Modules in `src/lib/ai/` and `src/lib/hooks/use-context-injection.ts` gather data from the selected project (world entries, past chapters).
- The context engine serializes the world-bible data to prime the LLM prompt, resolving consistency across the timeline.

## Editor Architecture
- A specialized Tiptap implementation (`src/components/editor/`).
- Wraps basic generic rich-text functionality with writing-focused tooling like an AI floating toolbar and inline AI generation panel.