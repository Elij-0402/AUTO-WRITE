# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

**Web Search:**
- Brave Search API — Optional web search for research workflows
  - SDK/Client: Configured via `brave_search` in `.planning/config.json`
  - Auth: Environment variable (API key)
  - Used by: `gsd-tools.cjs websearch` command

**Content Extraction:**
- Firecrawl — Optional web scraping for research
  - Configured via `firecrawl` in `.planning/config.json`
  - Used by: Research subagents for content extraction

**Exa Search:**
- Exa — Optional AI-focused search API
  - Configured via `exa_search` in `.planning/config.json`
  - Used by: Research subagents

**LLM Model Providers:**
- Anthropic (Claude) — Primary model provider
  - Model profiles: opus, sonnet, haiku — mapped per agent type (`model-profiles.cjs`)
- Other providers: Supported via OpenCode runtime (Gemini, etc.)
  - Model resolution via `resolveModelInternal` in `core.cjs`

**Update Checking:**
- npm registry — Checks for GSD framework updates on session start
  - Implementation: `gsd-check-update.js`
  - Caches results in `~/.cache/gsd/gsd-update-check.json`

## Data Storage

**Databases:**
- No database — All state is file-based (Markdown + JSON)

**File Storage:**
- Local filesystem — `.planning/` directory structure
  - `.planning/STATE.md` — Project state tracker (YAML frontmatter + Markdown)
  - `.planning/ROADMAP.md` — Phase roadmap and milestones
  - `.planning/REQUIREMENTS.md` — Acceptance criteria
  - `.planning/config.json` — Project configuration
  - `.planning/phases/` — Per-phase directories containing PLAN.md, SUMMARY.md, CONTEXT.md, VERIFICATION.md, UAT.md
  - `.planning/codebase/` — Codebase analysis documents (this file)
  - `.planning/intel/` — Structured project intelligence (files.json, apis.json, deps.json, arch.md, stack.json)
  - `.planning/workstreams/` — Parallel milestone scoping (optional)
  - `.planning/milestones/` — Archived milestone data
  - `.planning/todos/` — Todo tracking (optional)

**Global Knowledge Store:**
- `~/.gsd/knowledge/` — Cross-project learnings
  - JSON files with content-hash deduplication
  - Managed by `learnings.cjs`

**Caching:**
- `~/.cache/gsd/` — Update check cache
- `/tmp/claude-ctx-{session_id}.json` — Context window metrics bridge (statusline → context monitor)

## Authentication & Identity

**Auth Provider:**
- Not applicable — GSD is a local developer tool
- LLM API authentication handled by the host runtime (Claude Code, OpenCode, etc.)

**Session Identity:**
- Session tracking via environment variables: `GSD_SESSION_KEY`, `CLAUDE_SESSION_ID`, `OPENCODE_SESSION_ID`, etc.
  - Used for workstream isolation and context monitoring
  - Implementation: `core.cjs` `WORKSTREAM_SESSION_ENV_KEYS`

## Monitoring & Observability

**Error Tracking:**
- None — Errors are surfaced to the LLM agent and logged via `output()` / `error()` helpers in `core.cjs`

**Context Monitoring:**
- `gsd-context-monitor.js` — Tracks LLM context window usage
  - WARNING at ≤35% remaining context
  - CRITICAL at ≤25% remaining context
  - Debounced: 5 tool calls between warnings

**Status Line:**
- `gsd-statusline.js` — Displays model, task, directory, context usage bar
  - Writes metrics to temp file bridge for context monitor

**Update Checking:**
- `gsd-check-update.js` — Background npm version check on session start

## CI/CD & Deployment

**Hosting:**
- None — Local developer tool

**CI Pipeline:**
- None — No automated CI/CD (framework is distributed via npm as `get-shit-done`)

**Version Distribution:**
- npm package: `get-shit-done` (referenced in `gsd-check-update.js`)
- Version tracked in `VERSION` file (currently v1.34.2)
- File integrity via SHA-256 hashes in `gsd-file-manifest.json`

## Environment Configuration

**Required env vars:**
- None strictly required
- Optional: `CLAUDE_CONFIG_DIR` — Override config directory
- Optional: Brave/Firecrawl/Exa API keys for search features

**Secrets location:**
- API keys expected as environment variables
- Not stored in project files (`.env` not used)

**Runtime env vars consumed:**
- `GSD_SESSION_KEY`, `CODEX_THREAD_ID`, `CLAUDE_SESSION_ID`, `OPENCODE_SESSION_ID`, `GEMINI_SESSION_ID`, `CURSOR_SESSION_ID`, `WINDSURF_SESSION_ID`, `TERM_SESSION_ID`, `WT_SESSION`, `TMUX_PANE`, `ZELLIJ_SESSION_NAME` — Session identity for workstream isolation

## Webhooks & Callbacks

**Incoming:**
- None — GSD operates through LLM agent tool calls

**Outgoing:**
- Git commits (local only) — Via `gsd-tools.cjs commit` commands
- Git branching — Via `pr-branch` workflow
- Web search API calls — Via `gsd-tools.cjs websearch` (optional, if configured)

## Git Integration

**Branching Strategies:**
- Configurable: `git.branching_strategy` in config.json
- Templates for phase branches, milestone branches, quick branches
- Managed by `gsd-tools.cjs` and `core.cjs`

**Commit Management:**
- Conventional Commits enforced by `gsd-validate-commit.sh` hook (opt-in)
- Planning docs commits via `gsd-tools.cjs commit` / `commit-to-subrepo`
- Sub-repo detection and routing (`core.cjs detectSubRepos`)

---

*Integration audit: 2026-04-13*