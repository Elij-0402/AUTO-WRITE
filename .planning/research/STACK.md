# Stack Research

**Domain:** AI-powered novel writing workstation (Chinese-first, Sudowrite competitor)
**Researched:** 2026-04-13
**Confidence:** HIGH (core stack) / MEDIUM (export libraries, desktop packaging)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (App Router) | Full-stack React framework | Required by project constraints. v16 provides stable Turbopack, React Compiler, Server Components, and improved caching. App Router is the only forward-looking choice — Pages Router is legacy. |
| React | 19.x | UI library | Bundled with Next.js 16. React 19 brings Server Components, Actions, `useEffectEvent`, and concurrent features that are production-ready. |
| TypeScript | 5.x | Type safety | Non-negotiable for a complex multi-panel app. Prevents entire classes of bugs in state management, API contracts, and editor data structures. |
| Tailwind CSS | 4.x | Styling | v4 is current with CSS-first config. Best DX for rapid UI development with Chinese-first typography (CJK font stacks, responsive spacing). Pairs perfectly with shadcn/ui. |

### Rich Text Editor

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tiptap | 3.22+ | Rich text editor engine | The best ProseMirror-based editor for React. Headless-first (build your own UI), extensible via plugins, built-in character count, collaboration support, Markdown serialization, and a new React Composable API. Far superior to Slate (abandoned maintenance), Lexical (Meta-internal focus, less community), and Quill (legacy). This is THE choice for novel writing. |
| @tiptap/react | 3.22+ | React bindings | Official React integration with `useEditor`, `EditorContent`, `EditorContext.Provider`. |
| @tiptap/pm | 3.22+ | ProseMirror core | Required dependency for Tiptap. |
| @tiptap/starter-kit | 3.22+ | Default extensions bundle | Paragraph, headings, bold, italic, lists, code, blockquote, etc. Start here, then remove what you don't need. |
| @tiptap/extension-character-count | 3.22+ | Word/character counting | Critical for the "real-time word count" requirement. Supports both character and word counts natively. |
| @tiptap/extension-placeholder | 3.22+ | Placeholder text | Shows "Start writing..." when the editor is empty — standard writer UX. |
| @tiptap/extension-collaboration | 3.22+ | Yjs-based collaboration | Future-proof for real-time sync. Enables conflict-free concurrent editing with Y.js CRDT. Use later for cloud sync; not v1. |

### Database & Auth

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase | 2.103+ | Backend-as-a-service | Provides PostgreSQL, real-time subscriptions, Auth, Storage, and Edge Functions in one stack. Perfect for BYOK model — no custom backend needed for project storage, auth, and sync. Row Level Security (RLS) gives per-user data isolation out of the box. Far cheaper and faster to ship than self-hosting. |
| Drizzle ORM | 0.45+ | Type-safe SQL ORM | Used on the Supabase/Postgres database for server-side queries. Drizzle is lighter than Prisma (no Rust engine, no schema migration headaches), gives full SQL control, and has excellent TypeScript inference. Use for complex queries that Supabase client can't express efficiently. |
| Supabase Auth | (included) | User authentication | Email/password, magic link, OAuth (WeChat for Chinese users). Integrated with Supabase RLS for zero-config authorization. Handles JWT tokens, sessions, and multi-device login. |

### AI / LLM Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel AI SDK | 6.x (`ai` package) | LLM streaming & BYOK | The standard for BYOK LLM integration. Supports `createOpenAICompatible()` for custom base URLs, handles streaming SSE, provides `useChat` hook for chat UI, `streamText` for generation, and structured output for parsing AI responses. Supports OpenAI, Anthropic, Google, DeepSeek, and any OpenAI-compatible endpoint. This is the only serious choice for BYOK. |
| @ai-sdk/openai-compatible | (included) | Custom API endpoint support | Create provider with custom `baseURL` and `apiKey` — exactly the BYOK pattern needed for users to bring their own keys. Works with DeepSeek, Moonshot, Zhipu, and any OpenAI-compatible Chinese LLM provider. |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | 5.x | Global client state | Lightweight, TypeScript-first, no boilerplate. Perfect for multi-panel workspace state: active panel layout, selected chapter, AI chat state, world bible selection. Unlike Redux (too heavy) or Jotai (too atomic for this use case), Zustand's store-per-slice model maps cleanly to InkForge's domain: `editorStore`, `projectStore`, `aiChatStore`, `panelStore`. |
| @tanstack/react-query | 5.x | Server state & caching | Handles all server-state (projects, chapters, world bible entries) with automatic background refetch, optimistic updates, and cache invalidation. Eliminates the need for custom loading/error states. Critical for cloud sync — mutations auto-invalidate, offline queue comes via plugin. |

### UI Components

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | latest | Component library | Not a dependency — copy-paste component code. Gives full control over every component. Based on Radix UI (accessible), styled with Tailwind. Includes Resizable panels, Dialog, Sheet, Tabs, Command palette, and 50+ primitives. Perfect for a writer tool where every pixel of the UI matters. |
| Radix UI | latest | Accessible primitives | Underpins shadcn/ui. Provides unstyled, accessible primitives for Dialog, Popover, Tooltip, etc. Required for a production app — don't skip accessibility. |
| react-resizable-panels | 4.x | Multi-panel layout | Battle-tested by VS Code, 0 worries. Supports horizontal/vertical splits, persistence of layouts, imperative API for programmatic resize, and accessibility. The right choice over `allotment` (less maintained, fewer features). |
| Lucide React | 1.x | Icon library | Comprehensive, tree-shakeable, consistent design language. Better than Heroicons for a Chinese-first app — wider icon coverage, including CJK-relevant icons. |

### Internationalization

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| next-intl | 4.x | i18n for Next.js | The best i18n solution for App Router. Provides server components support, type-safe messages, locale detection, and SSR. Chinese-first means `zh-CN` is the default locale with `en` as secondary. Handles pluralization, date formatting, and number formatting for CJK correctly. |

### Export Libraries

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| docx | 9.x | DOCX generation | Declarative API for creating Word documents. Works in browser and Node. Supports Chinese fonts, custom styles, headers/footers, page numbers — everything needed for novel export. Only serious browser-compatible DOCX library. |
| epub-gen-memory | 1.x | EPUB generation | Generates EPUB files in-memory (browser-compatible). Supports HTML content, CSS styling, metadata, table of contents, and cover images. Limited maintenance but works for standard novel EPUB export. |
| Tiptap Markdown | (built-in) | Markdown export | Tiptap 3.x has built-in Markdown serialization. No extra library needed — just `editor.storage.markdown.getMarkdown()` or the Markdown extension. |

### Desktop Packaging

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tauri | 2.x | Desktop app wrapper | Required by project constraints. v2 is stable with mobile support (future). Uses system webview (small bundle), Rust backend for native operations. Requires `output: 'export'` in Next.js config (static export only — no SSR in desktop mode). Key caveat: must handle the SSR restriction carefully. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint 9 | Code linting | Next.js 16 supports ESLint 9 natively. Flat config recommended. |
| Prettier | Code formatting | Standard formatter, integrates with Tiptap & Tailwind. |
| Vitest | Unit testing | Faster than Jest, native ESM support, works with Next.js 16. |
| Playwright | E2E testing | Multi-browser, supports Tauri testing. |

## Installation

```bash
# Core
npm install next@latest react@latest react-dom@latest typescript@latest

# Styling
npm install tailwindcss@latest @tailwindcss/postcss

# Rich Text Editor
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-character-count @tiptap/extension-placeholder
npm install @tiptap/extension-collaboration @tiptap/extension-highlight
npm install @tiptap/extension-typography @tiptap/extension-underline

# AI Integration
npm install ai @ai-sdk/openai-compatible

# Database & Auth
npm install @supabase/supabase-js drizzle-orm

# State Management
npm install zustand @tanstack/react-query

# UI Components
npx shadcn@latest init
npm install react-resizable-panels lucide-react

# i18n
npm install next-intl

# Export
npm install docx epub-gen-memory

# Dev dependencies
npm install -D @types/react @types/react-dom
npm install -D eslint prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Rich Text Editor | Tiptap | Lexical | If you're building inside Meta's ecosystem, or need ultra-low-level AST control. Tiptap is better for this use case because of ProseMirror's proven track record in writing tools. |
| Rich Text Editor | Tiptap | Slate | Slate hasn't had meaningful updates since 2021. React 18+ compatibility issues. Don't start new projects with it. |
| Rich Text Editor | Tiptap | Novel (novel.sh) | Novel is a Tiptap wrapper with pre-built Notion-like UI. Good for quick prototypes, but locks you into their UI patterns. InkForge needs a custom writer UI. |
| Database | Supabase | PlanetScale | If you need database branching workflows. But PlanetScale removed free tier. Supabase includes auth + storage + real-time in one. |
| Database | Supabase | Firebase | Firebase uses NoSQL (Firestore) which is terrible for relational novel data (chapters → world bible entries → relationships). Supabase gives you real PostgreSQL with joins. |
| Database | Supabase | Self-hosted Postgres + custom API | More control, but months of extra work for auth, storage, and real-time. Only justified at scale (10K+ users) when Supabase costs become significant. |
| ORM | Drizzle | Prisma | Prisma has a heavy Rust engine, worse cold starts, and schema migration complexity. Drizzle is lighter, SQL-first, and has better TypeScript inference. Prisma better if you want visual schema editor. |
| AI SDK | Vercel AI SDK | LangChain.js | LangChain is for complex agent chains with tool orchestration. InkForge needs direct streaming to a chat UI — AI SDK's `useChat` hook does this perfectly. LangChain adds complexity without benefit for BYOK chat. |
| State | Zustand | Redux Toolkit | Redux is overkill. InkForge has ~5 domain stores (panel, project, editor, AI chat, settings). Zustand handles this cleanly without the ceremony. |
| State | Zustand | Jotai | Jotai is atom-based (good for independent state atoms). InkForge's state is hierarchical (project → chapters → entries → AI context). Zustand's store model maps better. |
| Panel Layout | react-resizable-panels | allotment | Allotment works but has less active maintenance and fewer features. react-resizable-panels is used in production by VS Code and has better accessibility. |
| Panel Layout | react-resizable-panels | react-mosaic | Mosaic provides tiling/window-manager layouts. Overkill for InkForge — we need a simple split-pane workspace, not a full window manager. |
| i18n | next-intl | next-i18next | next-i18next is based on i18next and doesn't have proper App Router support. next-intl is built for App Router, has server component support, and is actively maintained by its creator. |
| Desktop | Tauri | Electron | Electron bundles Chromium (~150MB+). Tauri uses system webview (~10MB). Tauri 2 is stable and production-ready. Only use Electron if you need Chrome-specific APIs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Quill.js | Legacy, unmaintained, poor CJK support, no extensible architecture | Tiptap |
| Draft.js | Deprecated by Meta (they moved to Lexical). Frozen at React 16 compatibility. | Tiptap |
| CKEditor 5 | Excellent editor, but commercial license for collaboration features. Tiptap is MIT-licensed for everything. | Tiptap |
| Firebase (Firestore) | NoSQL is wrong for relational novel data (chapters, characters, relationships). Hard to query, no joins, terrible for complex data models. | Supabase (PostgreSQL) |
| MongoDB | Same NoSQL problem. Novel data is inherently relational. Don't fight the grain. | Supabase (PostgreSQL) |
| Express.js custom API | Months of dev time for auth, validation, storage that Supabase provides out of the box. Only justified at hyperscale. | Supabase Edge Functions + Client SDK |
| Material UI (MUI) | Heavy bundle, opinionated design, hard to customize for writer-specific UIs. shadcn/ui gives full control. | shadcn/ui + Tailwind |
| Ant Design | Popular in Chinese dev, but heavy (1MB+ bundle), opinionated design, and overkill for a focused writer tool. | shadcn/ui + Tailwind |
| next-i18next | Doesn't work properly with Next.js App Router. Requires workarounds for Server Components. | next-intl |
| CSS Modules | Workable but slower DX than Tailwind for a project with many component variants. No utility-first advantage. | Tailwind CSS |
| Y.js (in v1) | Collaboration/CRDT is powerful but adds significant complexity. Defer to post-v1 when real-time sync is prioritized. | Simple API-based save/load in v1 |

## Stack Patterns by Variant

**Web-only (MVP):**
- Next.js 16 with App Router, deployed to Vercel or self-hosted
- Supabase for all backend (auth, database, storage)
- No Tauri dependency — simpler build pipeline

**Web + Desktop (post-MVP):**
- Add Tauri 2 wrapper around the same Next.js app
- Must use `output: 'export'` in next.config.js — static export only
- All Supabase calls remain client-side (they work identically in web and Tauri)
- Use Tauri's HTTP client for native-feeling API calls (optional optimization)

**Chinese LLM Provider Priority:**
- DeepSeek (`deepseek.com`) — best Chinese writing quality, OpenAI-compatible API
- Zhipu AI (`bigmodel.cn`) — GLM-4 series, excellent Chinese
- Moonshot (`moonshot.cn`) — Kimi series, long context window
- OpenAI — fallback, good but Chinese quality inferior to domestic providers
- All providers work with Vercel AI SDK's `createOpenAICompatible()`

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.x | React 19.x | Next.js 16 requires React 19.x |
| Tiptap 3.22+ | React 19.x | Tiptap 3.x is compatible with React 19 |
| Tauri 2.x | Next.js (static export) | Must use `output: 'export'`, no SSR features available in desktop mode |
| Tailwind CSS 4.x | PostCSS 8+ | Tailwind v4 uses CSS-first configuration, no `tailwind.config.js` |
| shadcn/ui | Tailwind 4.x, React 19 | Compatible, use latest `npx shadcn@latest init` |
| Vercel AI SDK 6.x | Next.js 16.x | Designed for Next.js App Router with streaming |
| Drizzle ORM 0.45+ | Supabase PostgreSQL 15+ | Use `drizzle-kit` for introspection of Supabase schema |
| next-intl 4.x | Next.js App Router | Requires `middleware.ts` and `i18n/request.ts` setup |
| Zustand 5.x | React 19.x | Fully compatible |

## Special Considerations for Chinese-First

1. **Font Stack**: Use system CJK fonts first (`"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`). Web fonts for CJK are massive (10MB+) — avoid them.

2. **Word Count**: Chinese "word count" means character count (字数), not word count. Use `@tiptap/extension-character-count` and display as "X 字" not "X words". The count logic must count CJK characters correctly.

3. **Text Direction**: LTR (left-to-right) for Chinese novels. Chinese web novels are almost exclusively horizontal LTR in digital format. Don't add RTL support.

4. **AI Prompt Language**: Default prompts must be in Chinese. Provide fallback English prompts. The "auto-inject context" feature must construct prompts in the user's writing language.

5. **LLM Provider Defaults**: Default base URL for Chinese users should be DeepSeek or Zhipu, not OpenAI. The BYOK setup should offer quick-select buttons for common Chinese providers.

6. **Export Encoding**: DOCX and EPUB exports must use UTF-8 with proper Chinese font embedding references. Test with actual Chinese content — many export libraries mess up CJK characters.

7. **Input Method Composition**: Tiptap/ProseMirror handles IME composition correctly. Do NOT use `onInput` hacks — rely on ProseMirror's built-in IME handling which is tested against CJK input.

## Sources

- Next.js 16.2 blog (March 2026) — version verification, App Router, Server Components — HIGH confidence
- Tiptap docs (tiptap.dev) — React integration, extensions, Markdown support — HIGH confidence
- Tauri 2 docs (v2.tauri.app) — Next.js integration, static export requirement — HIGH confidence
- Vercel AI SDK docs (sdk.vercel.ai) — v6 API, BYOK via `createOpenAICompatible`, streaming — HIGH confidence
- Supabase auth docs — RLS, providers, session management — HIGH confidence
- npm registry — Version numbers verified for all packages — HIGH confidence
- react-resizable-panels — npm registry, battle-tested in VS Code — HIGH confidence
- docx library — npm registry v9.6+, declarative API, browser-compatible — MEDIUM confidence (limited Chinese export testing)
- epub-gen-memory — npm registry v1.1.2, browser-compatible — LOW confidence (limited maintenance, may need alternatives for complex EPUB)

---
*Stack research for: AI novel writing workstation (InkForge / AI小说专业工作台)*
*Researched: 2026-04-13*