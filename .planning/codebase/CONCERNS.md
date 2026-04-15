# Codebase Concerns (InkForge)

## Data Synchronization
- The `SyncEngine` handles optimistic updates locally, but there are always complex edge cases when overriding states across devices. Thorough stress testing of `conflict-resolver.ts` is required as usage scales.

## AI Provider Compatibility (BYOK)
- Since InkForge allows users to Bring Your Own Key, API interfaces and streaming behaviors may vary between OpenAI, Anthropic, or local endpoints. `suggestion-parser.ts` requires flexible fallback handling for varying LLM output layouts.

## Web Performance
- The project allows dynamically creating multiple `ProjectDB` instances. Garbage collection and closing connections correctly on workspace switch must be heavily audited to avoid memory leaks.
- Tiptap editor performance might degrade if single chapters exceed standard word counts without pagination or virtualization layers.
- App Router layout rendering needs strict client/server boundaries; ensuring `'use client'` is only applied at the leaf nodes or boundary layers to minimize bundle size.
