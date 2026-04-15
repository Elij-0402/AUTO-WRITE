# MCP-Driven End-to-End Bug Fix & Optimization

**Date:** 2026-04-15
**Status:** Approved
**Approach:** Option A — MCP-first, fix iteratively, E2E verify with Playwright

## Goal

Set up Next.js devtools MCP + Playwright MCP for InkForge, use them to detect and fix all build/runtime/type errors, then E2E verify every page flow works correctly.

## 1. MCP Infrastructure

### 1.1 `.mcp.json` Configuration

Create `.mcp.json` at project root with two MCP servers:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/playwright-mcp@latest"]
    }
  }
}
```

### 1.2 Connection Flow

```
npm run dev  →  MCP auto-discovers dev server at /_next/mcp
             →  get_errors detects issues
             →  get_routes confirms route integrity
             →  Playwright opens browser for E2E verification
```

No changes to `next.config.ts` required — Next.js 16.2.3 has native MCP support.

## 2. Error Detection & Fix Workflow

### Phase 1 — Startup & Detection

1. Start `npm run dev` in background
2. Wait for compilation to complete
3. Use MCP tools:
   - `get_errors` — build errors, type errors, runtime errors
   - `get_routes` — confirm all routes exist and are correct
   - `get_project_metadata` — project structure baseline

### Phase 2 — Fix Loop

For each detected issue:
1. Analyze root cause (MCP provides source file + error stack)
2. Fix code
3. Wait for dev server hot-reload
4. Re-run `get_errors` to confirm fix, ensure no regressions

### Phase 3 — Known Risk Points

Proactively check concerns from `.planning/STATE.md`:
- Tiptap + React 19 hydration issues
- epub-gen Chinese export compatibility
- Supabase SSR middleware correctness
- IndexedDB transaction error handling

## 3. Playwright E2E Verification

### 3.1 Verification Matrix

| Flow | Route | Verification Points |
|------|-------|-------------------|
| Auth | `/auth` | Login/register form render, tab switch, form validation |
| Dashboard | `/` | Project list load, create project modal, project card click |
| Editor | `/projects/[id]` | Tiptap editor init, chapter sidebar, drag-n-drop reorder |
| World Bible | Editor right tab | Create/edit world entries, relationship management |
| Outline | Editor left tab | Outline edit form, chapter generation button |
| AI Chat | Right panel | Message send/receive, context injection display |
| Settings/Export | Settings dialog | EPUB/DOCX/Markdown export buttons |

### 3.2 Verification Strategy

- Screenshot each flow as regression baseline
- Focus on IndexedDB data persistence (create project → refresh → data retained)
- Chinese text rendering (font loading, typography)
- Panel resize drag behavior and layout correctness

## 4. Success Criteria

- `get_errors` returns zero errors across all pages
- All 7 E2E flows pass without exceptions
- No console errors in browser logs
- Chinese text renders correctly with Noto Sans SC
- IndexedDB operations (CRUD) work reliably

## 5. Out of Scope

- Performance optimization (bundle size, load time)
- Accessibility audit
- SEO improvements
- New feature development
- Test coverage improvements
