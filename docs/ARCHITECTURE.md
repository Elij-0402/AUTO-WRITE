# InkForge Architecture

## Two-Tier Database Architecture

InkForge uses Dexie.js (IndexedDB) with two tiers of database isolation:

### Tier 1: Meta Database (`inkforge-meta`)

Singleton database for project-independent global state.

**Tables:**
- `projectIndex` — list of projects (id, title, updatedAt, deletedAt)
- `aiConfig` — global AI configuration (BYOK: single-user, single-config, inherited by all projects)

```typescript
// src/lib/db/meta-db.ts
metaDb.projectIndex.getAll()        // list all projects
metaDb.aiConfig.get('config')       // get global AI config
```

### Tier 2: Per-Project Databases (`inkforge-{projectId}`)

Each project gets its own isolated database. This ensures:
- Project data is fully isolated (no cross-project leaks)
- Projects can be exported/archived independently
- DB schema can evolve per-project without global migrations

**Key tables in project DB:**

| Table | Purpose |
|-------|---------|
| `chapters` | Chapter content, metadata, word counts |
| `worldEntries` | Characters, locations, rules, timelines |
| `relations` | Relationships between world entries |
| `conversations` | Chat thread metadata |
| `messages` | Chat messages within a conversation |
| `revisions` | Autosnapshots (every 5 min, max 50/chapter) |
| `analyses` | Cached relation graphs, style profiles |
| `embeddings` | Feature-hashed RAG embeddings |

**Factory function:**
```typescript
// src/lib/db/project-db.ts
const db = createProjectDB(projectId)  // cached by projectId
await db.table('chapters').getAll()
```

### Schema Versioning

Each project DB has a version number. Migrations run on DB open via `migration()` functions in `project-db.ts`. Version bumps are documented in `CHANGELOG.md`.

## Directory Structure

```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts           # exports metaDb, createProjectDB
│   │   ├── meta-db.ts        # InkForgeMetaDB (global config)
│   │   └── project-db.ts     # InkForgeProjectDB (per-project), migrations
│   ├── hooks/                # React hooks (use-ai-chat, use-wizard-mode, etc.)
│   ├── ai/
│   │   ├── client.ts          # streamChat — provider-agnostic facade
│   │   ├── events.ts          # AIEvent union type
│   │   ├── prompts.ts         # SegmentedSystemPrompt builder
│   │   └── tools/schemas.ts   # Tool use schemas (suggest_entry, etc.)
│   └── rag/                   # Hybrid RAG (embeddings + keyword)
└── components/
    ├── workspace/             # Main panels (editor, chat, world-bible)
    ├── editor/                # Tiptap editor
    └── world-bible/          # World entry forms
```

## Data Flow

```
User action
    ↓
React component (e.g., AIChatPanel)
    ↓
React hook (e.g., useAIChat)
    ↓
Dexie.js (IndexedDB) — read/write project data
    ↓
AI hook (e.g., useAIConfig) — fetch API key from metaDb
    ↓
streamChat() — provider-agnostic AI call
    ↓
Provider (anthropic / openai-compatible)
```

## State Management

No Redux/Zustand. State flows through:
- **Dexie.js + dexie-react-hooks** for persisted state (chapters, entries, messages)
- **React `useState`/`useRef`** for ephemeral UI state
- **React Context** for workspace layout (panel sizes, active tab)

## Key Conventions

- All AI config (API key, base URL, model) stored per-project in IndexedDB — never sent to any server
- BYOK model: user provides their own API keys
- `src/lib/types.ts` — shared TypeScript types (WorldEntry, ProjectMeta, etc.)
- `@/*` alias maps to `src/*` (see `tsconfig.json`)
