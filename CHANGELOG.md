# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — v2 iteration (2026-04)

### Added

- **AI layer**: provider-agnostic streaming client (`src/lib/ai/`) wrapping
  `@anthropic-ai/sdk`. Anthropic path enables prompt caching on the base
  instruction and world-bible blocks, and tool use via three structured
  tools (`suggest_entry`, `suggest_relation`, `report_contradiction`)
  replacing the regex suggestion parser.
- **Hybrid RAG retrieval** (`src/lib/rag/`): feature-hashed 256-dim char-gram
  embedder + keyword lane fused with Reciprocal Rank Fusion. Replaces the
  pure substring matcher in `use-context-injection`.
- **Chapter revisions** (`src/lib/db/revisions.ts`): autosnapshot every
  5 minutes, manual snapshots, capped at 50 per chapter with priority-
  aware pruning. History drawer UI in the editor bottom bar.
- **Creator analysis panel** (`/projects/[id]/analysis`): force-directed
  relation graph, natural-sorted timeline, one-shot Claude-powered style
  profile cached in a new `analyses` table.
- **`AIConfig.provider`** field with legacy record backfill — users pick
  Anthropic vs OpenAI-compatible per project.
- **Next.js 16 `proxy` convention**: renamed `src/middleware.ts` →
  `src/proxy.ts`, silencing the deprecation warning.

### Changed

- `EditorHandle` gains `setContent(snapshot)` for revision restore.
- DB schema bumped v5 → v9 (provider field, revisions, embeddings, analyses).
- `use-ai-chat.ts` rewritten on top of the new AI client + RAG layer.

### Deferred (blocked)

- **React Compiler** (`experimental.reactCompiler`) is not recognised by the
  NextConfig types in Next.js 16.2.3; revisit on canary/17.
- **Cache Components** (`experimental.cacheComponents`) — same.
- **AI Diff card** — suggestion→diff UI deferred; current flow inserts AI
  drafts via `EditorHandle.insertText`.
- **BGE neural embedder** — pluggable via the `Embedder` interface, not
  shipped as default because of the ~100 MB first-run download cost.

### Tests

70 → 101 passing.

## [0.1.0] — v1 baseline

Initial release: four-panel workspace, Tiptap editor, world bible, outline,
AI chat with regex-based suggestion parsing, OpenAI-compatible AI calls,
Supabase cloud sync, EPUB/DOCX/Markdown export.
