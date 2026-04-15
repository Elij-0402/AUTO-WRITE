# External Integrations (InkForge)

## Supabase
- **Purpose**: User Authentication and Cloud Sync infrastructure.
- **Implementation**: Managed through `@supabase/ssr` with client/middleware/server utilities in `src/lib/supabase/`.
- **Usage**: Used for synchronizing local Dexie IndexedDB changes to the cloud backend and managing session state.

## AI / Language Models (Bring Your Own Key - BYOK)
- **Purpose**: AI content generation (suggestions, chat, world-building).
- **Implementation**: The user must provide their own API Key. Context injections flow from `src/lib/ai/` and `use-context-injection`. The application connects to standard OpenAI-compatible endpoints or Anthropic using user credentials.
- **Workflow**: Context from `world-bible` and `chapters` are injected into AI requests to maintain story consistency.

## Export Integrations
- **Purpose**: Export completed manuscripts.
- **Implementation**: `docx` package for Word Document exports, `epub-gen` for EPUB generation. Handled in `src/lib/export/`.