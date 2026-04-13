# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- JavaScript (CommonJS) — Core tooling runtime (`gsd-tools.cjs` and all `.cjs` libs)

**Secondary:**
- Bash — Shell hooks (`gsd-session-state.sh`, `gsd-phase-boundary.sh`, `gsd-validate-commit.sh`)
- Markdown — Workflow definitions, agent specifications, templates, and references

## Runtime

**Environment:**
- Node.js — Required for all `.cjs` tooling and `.js` hooks
- Multiple LLM agent runtimes supported: Claude Code, OpenCode, Kilo, Gemini, Cursor, Windsurf

**Package Manager:**
- npm — `.opencode/` has `package.json` with `@opencode-ai/plugin` dependency
- No lockfile in `.claude/` (minimal `{"type":"commonjs"}`)
- `.opencode/` has `package-lock.json` with `zod` as transitive dependency

## Frameworks

**Core:**
- GSD (Get Shit Done) v1.34.2 — Agent-orchestrated project management framework
- No web/UI framework — this is a CLI/agent tooling project, not a user-facing application

**Agent Runtime Integration:**
- Claude Code (`.claude/`) — Primary agent runtime with hooks, commands, agents
- OpenCode (`.opencode/`) — Secondary agent runtime with commands, agents
- Hooks are runtime-agnostic (Node.js + Bash)

## Key Dependencies

**Critical:**
- `@opencode-ai/plugin` v1.4.3 — OpenCode plugin system (`.opencode/package.json`)
- `zod` (transitive) — Schema validation (bundled with OpenCode plugin)

**Node.js Built-in Modules (core tooling):**
- `fs` — File system operations (all `.cjs` modules)
- `path` — Path manipulation (all `.cjs` modules)
- `child_process` (`execSync`, `spawnSync`) — Git operations, command execution
- `crypto` — Content hashing, deduplication (`core.cjs`, `learnings.cjs`)
- `os` — Platform detection, temp directory resolution (`core.cjs`, `check-update.js`)

**No External npm Dependencies in Core:**
The `.claude/` package.json is minimal (`{"type":"commonjs"}`). All `.cjs` libs use only Node.js built-in modules. No Express, no database driver, no ORM.

## Configuration

**Environment:**
- Multi-runtime config dirs: `.claude/`, `.opencode/`, `.gemini/`, `.config/kilo/`
- Project config: `.planning/config.json` (created at runtime via `/gsd-new-project`)
- State files: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`

**Config Options (from `.claude/get-shit-done/templates/config.json`):**
- `mode`: "interactive" | "autonomous" | etc.
- `granularity`: task detail level
- `workflow.research`: enables research subagent
- `workflow.plan_check`: enables plan checker
- `workflow.verifier`: enables verification subagent
- `workflow.text_mode`: for remote sessions
- `parallelization`: agent parallelism settings
- `model_profile`: "quality" | "balanced" | "budget" | "adaptive"
- `hooks.community`: opt-in for community hooks
- `response_language`: force all agent output to a specific language

**Build:**
- No build step — all `.cjs` files are executed directly by Node.js
- No transpilation, no bundling

## Platform Requirements

**Development:**
- Node.js ≥ 16 (uses `fs.readdirSync`, `crypto`, `child_process`)
- Git (required for commit operations, branching, diff analysis)
- LLM agent runtime (Claude Code, OpenCode, or compatible)

**Production:**
- Same as development — this is a developer tool, not a deployed service
- Cross-platform: Windows, macOS, Linux supported (cross-platform path handling in `core.cjs`)
- Works inside any project directory; creates `.planning/` scaffold for state management

---

*Stack analysis: 2026-04-13*