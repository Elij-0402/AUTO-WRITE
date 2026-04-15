# Directory Structure (InkForge)

## `src/` tree
- **`app/`**: Next.js App Router paths.
  - `(authenticated)/`: Main app shells requiring user login.
  - `auth/`: Login, callback, forgot-password routes.
  - `projects/[id]/`: Core workspace router specific to an active novel.
- **`components/`**: React components by domain feature.
  - `auth/`, `ui/`: Common generic UI components.
  - `chapter/`: Chapter lists, creation dialogs, and sidebars.
  - `editor/`: Tiptap editor and toolbars.
  - `generation/`: Components tracking active background AI generations.
  - `outline/`: Story outlining tables/cards.
  - `project/`: Dashboards and configuration modals.
  - `sync/`: Sync progress and conflict UI indicators.
  - `workspace/`: Splittable resizable workspace and AI chat sidebars.
  - `world-bible/`: Encyclopedia features (relationship maps, entries).
- **`lib/`**: Business logic, database, and utility modules.
  - `ai/`: AI communication and custom parsing logic (`suggestion-parser.ts`).
  - `db/`: Dexie database setups and query functions separated by domain (`meta-db`, `project-db`, `chapter-queries`).
  - `export/`: Generators for docx/md/epub formatting.
  - `hooks/`: Custom React hooks, most crucially `use-autosave`, `use-context-injection`, and domain data access.
  - `supabase/`: Nextjs specific Supabase client/server singletons.
  - `sync/`: Offline to online sync state machine.
  - `types/`: Typescript models matching Dexie tables.
- **`test/`**: Shared test setup utilities.