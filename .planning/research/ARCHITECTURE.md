# Architecture Research

**Domain:** AI Novel Writing Workstation (Chinese-first, Sudowrite competitor)
**Researched:** 2026-04-13
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Presentation Layer                              │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Workspace    │ │ World Bible  │ │   Outline    │ │   AI Chat    │    │
│  │ Layout Mgr   │ │    Panel     │ │    Panel     │ │    Panel     │    │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘    │
│         │                │                │                │             │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐    │
│  │                     Chapter Editor (TipTap)                      │    │
│  └────────────────────────────┬───────────────────────────────────┘    │
│                               │                                          │
├───────────────────────────────┼────────────────────────────────────────┤
│                        Service Layer                                     │
│  ┌─────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐              │
│  │ AI      │ │ Context   │ │ Consistency│ │ Project     │              │
│  │ Service │ │ Assembler │ │ Checker    │ │ Manager     │              │
│  └────┬────┘ └─────┬─────┘ └─────┬──────┘ └──────┬──────┘              │
│       │            │             │                │                      │
├───────┴────────────┴─────────────┴────────────────┴────────────────────┤
│                        Data Layer                                        │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────────┐   │
│  │ World    │ │  Project      │ │  Chat      │ │  Sync            │   │
│  │ Bible DB │ │  Chapters DB  │ │  History DB │ │  Engine          │   │
│  └──────────┘ └──────────────┘ └────────────┘ └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                     External Services                                    │
│  ┌──────────┐                              ┌──────────────────────┐      │
│  │ LLM APIs │  (OpenAI, Anthropic, DeepSeek, │  Cloud Backend API  │      │
│  │ (BYOK)   │   custom base URLs...)        │  (auth, sync, etc)  │      │
│  └──────────┘                              └──────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Workspace Layout Manager** | Multi-panel layout, resizable/dockable panels, panel focus management | Custom React component using `allotment` or `react-mosaic` for IDE-like layout |
| **World Bible Panel** | CRUD world Bible entries, display relationships, suggest connections | React components backed by Zustand store + local DB queries |
| **Outline Panel** | Chapter list management, drag-reorder, outline editing, per-chapter notes | React tree/list component + Zustand store |
| **Chapter Editor** | Rich text editing, inline formatting, word count, selection-to-AI bridge | TipTap (ProseMirror-based) with custom extensions |
| **AI Chat Panel** | Chat interface, draft display, acceptance flow, streaming responses | Vercel AI SDK `useChat` hook + custom transport layer |
| **AI Service** | LLM API calls, BYOK key management, stream handling, prompt engineering | Vercel AI SDK `streamText`/`generateText` with custom provider routing |
| **Context Assembler** | Build relevant context from world bible + outline + chapter content before AI calls | Custom service: entry matching + relevance scoring + prompt assembly |
| **Consistency Checker** | Validate AI output against established world bible entries | Custom validation service: entity extraction → contradiction detection |
| **Project Manager** | Novel project CRUD, chapter ordering, metadata, export orchestration | Zustand store + local DB persistence layer |
| **Sync Engine** | Bidirectional cloud sync, conflict resolution, offline queue | Custom sync layer with operation log + CRDT-like merge for text |
| **World Bible DB** | Structured storage of characters, locations, rules, timeline entries + relationship graph edges | SQLite via `better-sqlite3` (web) / Tauri SQL plugin (desktop) |
| **Project Chapters DB** | Chapter content storage, ordering, metadata | SQLite — chapter table with TipTap JSON content |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Auth group route
│   │   ├── login/
│   │   └── register/
│   ├── (workspace)/            # Main workspace group route
│   │   ├── projects/           # Project list
│   │   └── [projectId]/        # Project workspace — multi-panel layout
│   │       ├── layout.tsx      # Workspace layout with panel manager
│   │       └── page.tsx        # Main workspace page
│   ├── api/                    # API routes (server-side)
│   │   ├── chat/               # AI chat streaming endpoint
│   │   ├── generate/           # AI generation endpoint
│   │   ├── consistency/        # Consistency check endpoint
│   │   └── sync/               # Cloud sync endpoints
│   └── layout.tsx
├── components/
│   ├── workspace/              # Multi-panel layout system
│   │   ├── WorkspaceLayout.tsx # Root layout manager
│   │   ├── Panel.tsx           # Individual panel wrapper
│   │   └── PanelRegistry.tsx    # Panel type registry
│   ├── editor/                 # TipTap editor components
│   │   ├── ChapterEditor.tsx    # Main editor component
│   │   ├── EditorToolbar.tsx   # Formatting toolbar
│   │   ├── WordCount.tsx       # Word count display
│   │   └── extensions/         # Custom TipTap extensions
│   │       ├── ai-highlight.ts # Highlight AI-generated text
│   │       ├── mention-world.ts # @mention world bible entries
│   │       └── consistency-mark.ts # Mark consistency issues inline
│   ├── world-bible/            # World Bible panel components
│   │   ├── EntryList.tsx       # Browse/search entries
│   │   ├── EntryEditor.tsx     # Edit entry details
│   │   ├── RelationshipGraph.tsx # Visual graph of relations
│   │   └── EntryTypes/         # Type-specific editors
│   │       ├── CharacterEntry.tsx
│   │       ├── LocationEntry.tsx
│   │       ├── RuleEntry.tsx
│   │       └── TimelineEntry.tsx
│   ├── outline/                # Outline panel components
│   │   ├── ChapterList.tsx     # Drag-sortable chapter list
│   │   ├── ChapterOutline.tsx  # Per-chapter outline editor
│   │   └── PlotStructure.tsx   # Visual plot structure view
│   ├── ai-chat/                # AI chat panel components
│   │   ├── ChatInterface.tsx   # Main chat UI
│   │   ├── MessageList.tsx     # Scrollable message list
│   │   ├── MessageInput.tsx    # Chat input with controls
│   │   ├── DraftPreview.tsx    # Preview generated draft
│   │   ├── AcceptDraft.tsx     # Accept/modify/reject draft flow
│   │   └── ContextBadge.tsx    # Shows which world bible entries are in context
│   ├── settings/               # Settings components
│   │   ├── LLMSettings.tsx    # BYOK key configuration
│   │   └── ProjectSettings.tsx # Project-level settings
│   └── common/                 # Shared UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── zh-CN/              # Chinese localization strings
├── services/                   # Business logic layer
│   ├── ai/
│   │   ├── provider.ts         # BYOK provider routing (OpenAI/Anthropic/custom)
│   │   ├── stream.ts           # Streaming response handler
│   │   ├── prompts/            # Prompt templates
│   │   │   ├── chapter-generate.ts
│   │   │   ├── consistency-check.ts
│   │   │   ├── relationship-suggest.ts
│   │   │   └── context-inject.ts
│   │   └── context-assembler.ts # Assembles relevant world bible context
│   ├── consistency/
│   │   ├── checker.ts          # Consistency validation logic
│   │   └── extractor.ts        # Entity extraction from text
│   ├── sync/
│   │   ├── sync-engine.ts      # Cloud sync orchestration
│   │   ├── conflict-resolver.ts # Handle sync conflicts
│   │   └── offline-queue.ts    # Queue operations while offline
│   └── export/
│       ├── markdown.ts         # Markdown export
│       ├── docx.ts             # DOCX export (docx library)
│       └── epub.ts              # EPUB export
├── stores/                     # Zustand state management
│   ├── project-store.ts        # Project list + current project
│   ├── chapter-store.ts        # Chapter ordering + metadata
│   ├── world-bible-store.ts    # World bible entries + relationships
│   ├── editor-store.ts         # Editor state, selection, word count
│   ├── chat-store.ts           # Chat history, current chat state
│   ├── ai-settings-store.ts   # BYOK keys, model preferences
│   └── ui-store.ts             # Panel layout, theme, preferences
├── db/                         # Database layer
│   ├── schema.ts               # Schema definitions
│   ├── migrations/             # Migration files
│   ├── world-bible.ts          # World bible CRUD operations
│   ├── chapters.ts             # Chapter CRUD operations
│   ├── chat-history.ts         # Chat history persistence
│   └── sync-log.ts             # Sync operation log
├── lib/                        # Shared utilities
│   ├── tauri.ts                # Tauri API bridge (detects platform)
│   ├── cn.ts                   # Chinese-first i18n utilities
│   ├── text.ts                  # Chinese text processing (word count, etc.)
│   └── id.ts                   # ID generation
└── types/                       # TypeScript type definitions
    ├── world-bible.ts           # Entry, Relationship, Character types
    ├── project.ts               # Project, Chapter, Outline types
    ├── ai.ts                    # Message, StreamConfig, BYOKProvider types
    └── sync.ts                  # Sync operation types
```

### Structure Rationale

- **`app/`**: Next.js App Router with route groups for auth vs workspace. The workspace is a single page with client-side panel management — not separate pages per panel. The `[projectId]` route holds the entire multi-panel workspace.
- **`components/`**: Organized by domain (editor, world-bible, outline, ai-chat). Each domain's components are self-contained. The workspace/ folder handles the panel layout system that composes them.
- **`services/`**: Pure TypeScript business logic separated from React. AI service handles provider routing and streaming. Context assembler is a critical service that queries the world bible and builds prompts.
- **`stores/`**: Zustand stores following domain boundaries. Each store owns its data slice. Editor store bridges TipTap state with React state.
- **`db/`**: Database access layer abstracted behind plain functions. Uses `better-sqlite3` on web and Tauri's SQL plugin on desktop. Same schema, different drivers.
- **`types/`**: Shared TypeScript contracts between all layers.

## Architectural Patterns

### Pattern 1: Multi-Panel Workspace with Layout Persistence

**What:** IDE-like layout where world bible, outline, editor, and AI chat panels can be resized, collapsed, and rearranged. Layout state persists per user.

**When to use:** Always — this is the core UX differentiator for InkForge.

**Trade-offs:**
- ✅ Author always has context visible
- ✅ Reduces context switching between tools
- ❌ Complex panel state management
- ❌ Mobile unfriendly — desktop-first layout

**Example:**
```typescript
// Panel layout stored in ui-store, persisted to local DB
interface PanelLayout {
  panels: {
    id: 'world-bible' | 'outline' | 'editor' | 'ai-chat';
    visible: boolean;
    size: number; // relative width/height
  }[];
  orientation: 'horizontal' | 'vertical';
}

// WorkspaceLayout composes panels based on layout config
function WorkspaceLayout({ projectId }: { projectId: string }) {
  const layout = useUIStore(s => s.panelLayout);
  return (
    <Allotment defaultSizes={layout.panels.map(p => p.size)}>
      {layout.panels.filter(p => p.visible).map(panel => (
        <Panel key={panel.id} id={panel.id} />
      ))}
    </Allotment>
  );
}
```

### Pattern 2: Context Assembly Pipeline (World Bible → AI Context)

**What:** Before any AI generation call, a pipeline assembles relevant context from the world bible, current chapter outline, and surrounding chapter text. This is the core differentiator — AI that "understands" the story world.

**When to use:** Before every AI chat message, chapter generation, consistency check, and relationship suggestion.

**Trade-offs:**
- ✅ AI responses grounded in established story canon
- ✅ Author doesn't have to manually reference entries
- ❌ Token budget management — must choose which entries to include
- ❌ Latency overhead from context assembly before each call

**Example:**
```typescript
// services/ai/context-assembler.ts
interface AssembledContext {
  systemPrompt: string;
  contextEntries: WorldBibleEntry[];
  tokenCount: number;
}

export async function assembleContext(
  projectId: string,
  options: {
    currentChapterId?: string;
    selection?: { from: number; to: number };
    maxTokens?: number;
  }
): Promise<AssembledContext> {
  // 1. Get project-level world bible entries
  const allEntries = await worldBibleDB.getEntries(projectId);
  
  // 2. Score relevance based on:
  //    - Current chapter's referenced characters/locations
  //    - Selection context (if editor selection exists)
  //    - Recent chat mentions
  //    - Relationship graph proximity
  const scored = scoreRelevance(allEntries, options);
  
  // 3. Fit within token budget, prioritizing highest-scored entries
  const selected = fitTokenBudget(scored, options.maxTokens ?? 4000);
  
  // 4. Format into structured context blocks
  const contextBlocks = formatContextBlocks(selected);
  
  return {
    systemPrompt: buildSystemPrompt(contextBlocks),
    contextEntries: selected,
    tokenCount: countTokens(contextBlocks),
  };
}

// Token budget allocation:
// - System instructions: ~500 tokens
// - World bible context: ~3000 tokens (primary)
// - Chapter outline: ~500 tokens
// - Recent chapter text: ~1000 tokens
// - Total context: ~5000 tokens, leaving room for response
```

### Pattern 3: BYOK Provider Abstraction with Vercel AI SDK

**What:** A provider routing layer that takes user-configured API keys and base URLs, creates dynamic provider instances, and passes them to Vercel AI SDK's `streamText`/`generateText`. Users bring their own keys for any supported provider.

**When to use:** Every AI call — the app never hardcodes a model provider.

**Trade-offs:**
- ✅ Users choose cost/quality tradeoffs
- ✅ Zero model cost for the platform
- ❌ Must handle provider-specific errors and rate limits
- ❌ Key storage security concerns

**Example:**
```typescript
// services/ai/provider.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';

interface BYOKConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'custom';
  apiKey: string;
  baseUrl?: string;
  modelId: string;
}

export function createModel(config: BYOKConfig): LanguageModel {
  switch (config.provider) {
    case 'openai':
      return createOpenAI({ apiKey: config.apiKey })(config.modelId);
    case 'anthropic':
      return createAnthropic({ apiKey: config.apiKey })(config.modelId);
    case 'deepseek':
      return createOpenAICompatible({
        name: 'deepseek',
        apiKey: config.apiKey,
        baseURL: config.baseUrl ?? 'https://api.deepseek.com/v1',
      })(config.modelId);
    case 'custom':
      return createOpenAICompatible({
        name: 'custom',
        apiKey: config.apiKey,
        baseURL: config.baseUrl!,
      })(config.modelId);
  }
}

// Then in API route:
export async function POST(req: Request) {
  const { messages, byokConfig } = await req.json();
  const model = createModel(byokConfig);
  
  const result = streamText({
    model,
    system: assembledContext.systemPrompt,
    messages: await convertToModelMessages(messages),
  });
  
  return result.toUIMessageStreamResponse();
}
```

### Pattern 4: Draft-then-Accept AI Flow

**What:** AI-generated text always appears first in the chat panel as a draft. The author reviews, edits within the chat, and manually accepts (or rejects) it. Accepted text is then inserted into the chapter editor at a location the author chooses.

**When to use:** All AI generation — never auto-insert into the manuscript.

**Trade-offs:**
- ✅ Author maintains full control — AI never silently modifies the manuscript
- ✅ Natural review workflow — see draft, edit, then accept
- ❌ Extra step compared to inline completion
- ❌ Need smooth UX for the accept/insert flow

**Example:**
```typescript
// Draft in chat panel, accept to editor
interface DraftBlock {
  id: string;
  content: string;          // Rich text (TipTap JSON)
  sourceContext: string[];   // Which world bible entries were used
  timestamp: Date;
}

// Chat store tracks drafts separately from accepted messages
interface ChatStore {
  messages: ChatMessage[];
  drafts: DraftBlock[];  // Pending drafts not yet accepted
  
  acceptDraft: (draftId: string) => void;  // Moves draft to editor
  rejectDraft: (draftId: string) => void;  // Discards draft
  editDraft: (draftId: string, content: string) => void;  // Edit before accepting
}

// Editor receives accepted text
function handleAcceptDraft(draft: DraftBlock) {
  const editor = useEditorStore.getState().editor;
  const position = useEditorStore.getState().cursorPosition;
  editor.chain().focus().insertContentAt(position, draft.content).run();
}
```

### Pattern 5: Local-First with Cloud Sync

**What:** All data lives locally in SQLite first. A sync engine periodically pushes changes to the cloud backend and pulls remote changes. Offline operation is seamless — sync resumes when connectivity returns.

**When to use:** Always — local-first is essential for a writing tool. Authors must never lose work.

**Trade-offs:**
- ✅ Works fully offline
- ✅ Fast — no network latency for reads/writes
- ✅ No data loss (local is source of truth)
- ❌ Conflict resolution is complex
- ❌ Need careful migration management across devices

**Example:**
```typescript
// db/ sync architecture
// Every write goes to local SQLite first, then queues for sync

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'chapter' | 'world_bible_entry' | 'relationship' | 'chat_message';
  entityId: string;
  projectId: string;
  data: unknown;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

// Sync engine runs periodically, processes pending operations
class SyncEngine {
  async push(): Promise<void> {
    const pending = await syncLog.getPending();
    // Batch send to server
    const results = await api.batchSync(pending);
    // Mark synced, flag conflicts
    for (const result of results) {
      if (result.conflict) {
        await syncLog.markConflict(result.id, result.serverVersion);
      } else {
        await syncLog.markSynced(result.id);
      }
    }
  }

  async pull(): Promise<void> {
    const lastSync = await syncLog.getLastSyncTimestamp();
    const remote = await api.getChangesSince(lastSync);
    // Merge with local — last-write-wins for simple fields
    for (const change of remote) {
      await this.mergeChange(change);
    }
  }
}
```

### Pattern 6: Chinese-First Text Processing

**What:** All text processing (word count, selection, paragraph detection) handles Chinese text correctly. Chinese characters count as words (not bytes). Mixed CJK + Latin text is handled gracefully.

**When to use:** All text processing throughout the application.

**Example:**
```typescript
// lib/text.ts — Chinese-aware text utilities
export function countWords(text: string): number {
  // Chinese: each character = 1 word
  // English: spaces separate words
  // Mixed: count both separately, sum
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const nonCjkText = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const englishWords = nonCjkText.trim().split(/\s+/).filter(Boolean).length;
  return cjkChars + englishWords;
}

export function countChars(text: string): number {
  return text.length; // Unicode-safe character count
}
```

## Data Flow

### AI Generation Flow (Primary Use Case)

```
[Author writes or selects text] → [Editor / Chat input]
         ↓
[Context Assembler queries World Bible]
         ↓ (scores + selects relevant entries)
[Assembled prompt: system + context + user message]
         ↓
[AI Service: BYOK provider → streamText()]
         ↓ (streaming tokens)
[Chat Panel: shows streaming draft]
         ↓
[Author reviews, optionally edits draft]
         ↓
[Author clicks "Accept" → draft text inserted into editor at cursor]
         ↓
[Chapter content saved to local DB → queued for cloud sync]
```

### Consistency Check Flow

```
[Author triggers consistency check (or auto-trigger on generation)]
         ↓
[Extractor: pull entities from generated text (characters, locations, rules)]
         ↓
[Load relevant world bible entries]
         ↓
[Checker: compare extracted entities against established canon]
         ↓ (flag contradictions)
[Display: show warnings inline or in a panel]
         ↓
[Author resolves or acknowledges each warning]
```

### Cloud Sync Flow

```
[Local write] → [SQLite] → [Sync Queue: pending operations]
                                    ↓ (periodic push)
                            [Cloud API: batch sync]
                                    ↓
                            [Server DB] → [Response: conflicts + remote changes]
                                    ↓
                            [Pull: merge remote changes into local]
                                    ↓
                            [Update UI stores from local DB]
```

### State Management

```
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Stores                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Project   │ │ Chapter  │ │ World    │ │ AI Settings   │  │
│  │ Store     │ │ Store    │ │ Bible    │ │ Store         │  │
│  │          │ │          │ │ Store     │ │ (BYOK keys,   │  │
│  │ (projects│ │ (chapter │ │ (entries, │ │  model pref)   │  │
│  │  list,   │ │  order,  │ │  rels,   │ │               │  │
│  │  current)│ │  current)│ │  search) │ │               │  │
│  └─────┬────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│        │            │             │                │           │
│  ┌─────┴────────────┴────────────┴────────────────┘          │
│  │              Persistence Layer (SQLite)                    │  │
│  │    Stores write to DB on change, hydrate from DB on load  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Editor Store (TipTap bridge)                 │   │
│  │  (selection, cursor position, word count, active chapter) │   │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Chat Store (AI SDK bridge)                   │   │
│  │  (messages, drafts, streaming status, context badges)     │   │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              UI Store (layout, theme, panels)             │   │
│  │  — persisted to localStorage, not SQLite                  │   │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **AI Context Injection Flow:** Editor selection → Context Assembler queries World Bible Store → scores entries by relevance → assembles system prompt with top-k entries → passes to AI Service alongside user message → streamed back to Chat Store.

2. **Draft Acceptance Flow:** Chat Store receives AI stream → assembles into DraftBlock → author edits in chat → clicks Accept → Editor Store inserts content at cursor → Chapter Store marks dirty → Sync Queue logs operation.

3. **World Bible Update Flow:** Author edits entry → World Bible Store updates → persists to SQLite → Sync Queue logs → AI Service future calls automatically include updated entry (no manual @mention needed).

4. **Offline-First Sync Flow:** All writes go to SQLite first → Sync Engine batches pending operations → pushes to cloud API → receives remote changes → merges with conflict resolution → updates local DB → Zustand stores re-hydrate from DB.

5. **Selection-to-Chat Flow:** Author selects text in editor → Editor Store captures selection and chapter context → Chat Store receives selection as context → AI Chat displays "Discussing selected text" badge → Context Assembler enriches with relevant world bible entries.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users (MVP) | Monolithic Next.js app with SQLite on each client. Cloud backend is a simple API server (Node.js) with PostgreSQL. No sharding needed. Sync is simple last-write-wins. |
| 1k-50k users | Add rate limiting on BYOK proxy endpoints. Cache frequently accessed world bible entries in memory. Optimistic UI updates for smoother experience. Consider WebSocket for real-time sync. |
| 50k+ users | Dedicated sync servers. Batch sync operations. CDN for static assets. Consider read replicas for cloud DB. Shard sync by project. Add monitoring/alerting. |

### Scaling Priorities

1. **First bottleneck: AI response latency** — Context assembly + prompt building adds latency before the LLM call. Cache assembled contexts for repeated queries on the same chapter. Pre-compute relevance scores on world bible changes.
2. **Second bottleneck: Sync conflicts at scale** — With many concurrent users, conflict resolution gets complex. Start with simple last-write-wins per field. Move to CRDT-based text merging (Yjs) only if conflict frequency justifies it.

## Anti-Patterns

### Anti-Pattern 1: AI Auto-Inserts Into Manuscript

**What people do:** Let AI generate text and auto-insert it directly into the chapter editor, like inline autocomplete on steroids.
**Why it's wrong:** Removes author control. AI can hallucinate, contradict established canon, or simply write poorly. The author must review before text enters the manuscript.
**Do this instead:** Draft-then-Accept pattern. AI text always appears in the chat panel as a draft. Author explicitly accepts, edits, or rejects it.

### Anti-Pattern 2: Giant Monolithic Prompt for Context

**What people do:** Dump the entire world bible into every AI prompt as a massive system message.
**Why it's wrong:** Tokens are expensive. Most entries are irrelevant for any single generation. Exceeds context windows. Degrades response quality as irrelevant context confuses the model.
**Do this instead:** Context Assembly Pipeline — score entries by relevance to current context, select top-k within token budget, format structured context blocks with clear headers.

### Anti-Pattern 3: Server-Side State as Source of Truth

**What people do:** Store all novel data on a remote server and fetch it on each page load.
**Why it's wrong:** Writing tools must work offline. Server dependency means any network hiccup blocks the author. Latency degrades the writing experience.
**Do this instead:** Local-first architecture. SQLite is the source of truth. Cloud sync is additive. The app works fully offline, syncs when possible.

### Anti-Pattern 4: Separate Pages for Each Panel

**What people do:** Navigate between world bible page, outline page, editor page, chat page as separate routes.
**Why it's wrong:** Authors need simultaneous context — they need to see their outline while writing, their world bible while chatting with AI. Navigation breaks flow.
**Do this instead:** Multi-panel workspace — all panels visible on one screen, resizable, collapsible. The workspace IS the product.

### Anti-Pattern 5: Tight Coupling Between AI and Editor

**What people do:** The AI service directly manipulates editor content, making it hard to change either independently.
**Why it's wrong:** The AI layer and editor layer have different release cycles, different failure modes. Direct coupling makes testing and iteration harder.
**Do this instead:** Event-driven bridge. AI service produces drafts (data). Editor receives "insert this content at position" commands. They communicate through the Chat Store → Editor Store bridge, not direct method calls.

### Anti-Pattern 6: English-Only Text Processing

**What people do:** Use standard regex-based word counting, sentence splitting, and text analysis designed for English.
**Why it's wrong:** Chinese text has no spaces between words. Standard English word counting gives nonsensical results for Chinese. Sentence boundary detection differs fundamentally.
**Do this instead:** Chinese-first text utilities from day one. Count Chinese characters as words. Use Unicode-aware paragraph detection. Test all text features with Chinese content first, English second.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| LLM Providers (BYOK) | Vercel AI SDK via `createOpenAICompatible` / provider-specific SDKs | User provides API key + base URL. Keys stored encrypted in local DB, never sent to our backend. Vercel AI SDK v6 handles streaming, tool calls, structured output. |
| Cloud Backend API | REST (project sync) + WebSocket (real-time sync signals) | Our backend only stores encrypted project data. It never sees LLM API keys. LLM calls go directly from client to user's provider. |
| Tauri Desktop APIs | `invoke()` IPC for filesystem, SQL, window management | Only active in desktop mode. Web mode uses browser APIs + SQLite via better-sqlite3. Platform detection via `lib/tauri.ts`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Panel ↔ Panel | Zustand stores (shared state) | Panels read from stores, never call each other directly. Editor selection → Editor Store → Chat Store reads it. |
| AI Service ↔ Context Assembler | Function call (synchronous within service layer) | Context Assembler returns assembled prompt. AI Service uses it. Both are in `services/`. |
| AI Service ↔ Editor | Via Chat Store + Editor Store | Never direct. AI writes drafts to Chat Store. Accept flow: Chat → Editor Store → TipTap command. |
| Sync Engine ↔ Local DB | SQLite queries | Sync Engine reads/writes through DB abstraction layer. Never bypasses it. |
| Local DB ↔ Zustand Stores | Hydration on mount, write-through on change | Stores hydrate from DB on project load. Store mutations trigger DB writes. Not a replica — stores are ephemeral, DB is truth. |

## Sources

- Vercel AI SDK v6 official documentation (https://sdk.vercel.ai/docs/introduction) — HIGH confidence, authoritative source for LLM integration patterns, `useChat` hook, `streamText` API, BYOK provider routing
- Tauri v2 official documentation (https://tauri.app/start/, https://tauri.app/concept/architecture/) — HIGH confidence, Tauri uses system WebView, Next.js requires `output: 'export'` for Tauri compatibility
- TipTap official documentation (https://tiptap.dev/docs/editor/getting-started/install/nextjs) — HIGH confidence, ProseMirror-based editor, React support, rich extension ecosystem including collaboration, comments, AI toolkit
- Sudowrite public website (https://sudowrite.com) — MEDIUM confidence, confirms competitor features (Story Bible, Canvas, AI generation) but no public architecture docs
- Project requirements from PROJECT.md — HIGH confidence, directly from project definition

---
*Architecture research for: AI Novel Writing Workstation (InkForge)*
*Researched: 2026-04-13*