# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-04-27

### Added

- Provider-agnostic AI layer with Anthropic native support and OpenAI-compatible fallback.
- Structured AI suggestions for world entries, relations, and contradiction reporting.
- Hybrid retrieval pipeline for Chinese writing context injection.
- Chapter revision snapshots with restore support.
- Creator analysis workspace with relation graph, timeline, and style profile.

### Changed

- Prompt caching is enabled by default for Anthropic sessions.
- Project schema expanded to support provider config, revisions, embeddings, and analyses.
- Public repository metadata, documentation, and CI were aligned for open-source publishing.

### Fixed

- Removed local-only tracked artifacts and internal planning files from the public repository surface.
- Unified package management and CI around pnpm.

## [0.1.0] - 2026-04

### Added

- Initial multi-panel novel writing workspace.
- Tiptap-based chapter editor and world bible management.
- OpenAI-compatible AI chat, optional Supabase sync, and export support.
