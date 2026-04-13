<!-- GSD:project-start source:PROJECT.md -->
## Project

**InkForge — AI小说专业工作台**

InkForge 是一款面向中文网文作者的 AI 小说写作专业工作台。多面板布局集成世界观百科、大纲规划、编辑器和 AI 聊天，核心差异化在于 AI 基于「世界观百科」自动注入上下文并主动检查矛盾，解决现有 AI 写作工具丢失上下文和一致性的核心痛点。用户自带 API Key（BYOK 模式），支持 Web 端和可选桌面端，中文优先。

**Core Value:** AI 真正理解你构建的故事世界——自动注入世界观上下文，主动检查跨角色、地点、规则、时间线的矛盾，让作者专注于创作而非记忆一致性。

### Constraints

- **Tech Stack**: React + Next.js 前端框架
- **Language**: 中文优先的 UI 和写作体验
- **AI Model**: BYOK——用户自带 API Key 和 Base URL，产品不内置模型成本
- **Platform**: Web 端（桌面优先）+ 可选桌面端封装
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (CommonJS) — Core tooling runtime (`gsd-tools.cjs` and all `.cjs` libs)
- Bash — Shell hooks (`gsd-session-state.sh`, `gsd-phase-boundary.sh`, `gsd-validate-commit.sh`)
- Markdown — Workflow definitions, agent specifications, templates, and references
## Runtime
- Node.js — Required for all `.cjs` tooling and `.js` hooks
- Multiple LLM agent runtimes supported: Claude Code, OpenCode, Kilo, Gemini, Cursor, Windsurf
- npm — `.opencode/` has `package.json` with `@opencode-ai/plugin` dependency
- No lockfile in `.claude/` (minimal `{"type":"commonjs"}`)
- `.opencode/` has `package-lock.json` with `zod` as transitive dependency
## Frameworks
- GSD (Get Shit Done) v1.34.2 — Agent-orchestrated project management framework
- No web/UI framework — this is a CLI/agent tooling project, not a user-facing application
- Claude Code (`.claude/`) — Primary agent runtime with hooks, commands, agents
- OpenCode (`.opencode/`) — Secondary agent runtime with commands, agents
- Hooks are runtime-agnostic (Node.js + Bash)
## Key Dependencies
- `@opencode-ai/plugin` v1.4.3 — OpenCode plugin system (`.opencode/package.json`)
- `zod` (transitive) — Schema validation (bundled with OpenCode plugin)
- `fs` — File system operations (all `.cjs` modules)
- `path` — Path manipulation (all `.cjs` modules)
- `child_process` (`execSync`, `spawnSync`) — Git operations, command execution
- `crypto` — Content hashing, deduplication (`core.cjs`, `learnings.cjs`)
- `os` — Platform detection, temp directory resolution (`core.cjs`, `check-update.js`)
## Configuration
- Multi-runtime config dirs: `.claude/`, `.opencode/`, `.gemini/`, `.config/kilo/`
- Project config: `.planning/config.json` (created at runtime via `/gsd-new-project`)
- State files: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`
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
- No build step — all `.cjs` files are executed directly by Node.js
- No transpilation, no bundling
## Platform Requirements
- Node.js ≥ 16 (uses `fs.readdirSync`, `crypto`, `child_process`)
- Git (required for commit operations, branching, diff analysis)
- LLM agent runtime (Claude Code, OpenCode, or compatible)
- Same as development — this is a developer tool, not a deployed service
- Cross-platform: Windows, macOS, Linux supported (cross-platform path handling in `core.cjs`)
- Works inside any project directory; creates `.planning/` scaffold for state management
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- CLI tool (`gsd-tools.cjs`) serves as the programmatic backbone — workflows call it via `node gsd-tools.cjs <command>`
- LLM agents (planner, executor, verifier, etc.) are Markdown-defined personas orchestrated by workflow prompts
- State is persisted as Markdown + JSON files in `.planning/` directory
- Hooks intercept LLM runtime tool calls (PreToolUse/PostToolUse) to enforce guardrails
- Dual-runtime support: Claude Code (`.claude/`) and OpenCode (`.opencode/`) with identical structure
## Layers
- Purpose: Programmatic operations that LLM agents cannot do natively (file I/O, git, math, state CRUD)
- Location: `.claude/get-shit-done/bin/gsd-tools.cjs`, `.claude/get-shit-done/bin/lib/*.cjs`
- Contains: 21 library modules and a CLI entry point
- Depends on: Node.js built-ins (fs, path, child_process, crypto, os), `.planning/` state files
- Used by: All workflow agents that need structured data or state mutation
- Purpose: Orchestration logic for each GSD command (plan-phase, execute-phase, etc.)
- Location: `.claude/get-shit-done/workflows/*.md`, `.claude/commands/gsd/*.md`
- Contains: Markdown prompts with `<process>` steps, `<step>` directives, bash commands, agent spawn instructions
- Depends on: CLI tool layer (via bash invocations), agent definitions, templates, references
- Used by: LLM runtime /invoke parsers that map command names to workflow files
- Purpose: Specialized subagent personas for specific tasks (planning, execution, verification, etc.)
- Location: `.claude/agents/gsd-*.md`
- Contains: 24 agent definitions with YAML frontmatter (name, description, tools, color) and detailed prompt instructions
- Depends on: CLI tool layer, references (verification patterns, gates, thinking models, etc.)
- Used by: Workflow orchestrators that spawn subagents via Task/Agent tools
- Purpose: Runtime interception for safety, context awareness, and guardrails
- Location: `.claude/hooks/gsd-*.js`, `.claude/hooks/gsd-*.sh`
- Contains: 9 hook scripts (6 JS, 3 Bash)
- Depends on: Node.js runtime, `.planning/config.json`, temp files
- Used by: Claude Code / OpenCode runtime hook system (PreToolUse, PostToolUse, SessionStart)
- Purpose: Scaffold templates for planning artifacts (ROADMAP.md, PLAN.md, STATE.md, etc.)
- Location: `.claude/get-shit-done/templates/*.md`, `.claude/get-shit-done/templates/*.json`
- Contains: 30+ template files for project documentation and planning artifacts
- Depends on: CLI tool layer (`template.cjs` for fill operations)
- Used by: New project initialization, phase creation, verification scaffolding
- Purpose: Domain knowledge documents consumed by agents during execution
- Location: `.claude/get-shit-done/references/*.md`, `.claude/get-shit-done/references/few-shot-examples/*.md`
- Contains: 35 reference documents covering verification patterns, agent contracts, thinking models, TDD, etc.
- Depends on: None (static reference material)
- Used by: Agent prompts that `@`-reference these files for context injection
## Data Flow
- `.planning/STATE.md` — YAML frontmatter + Markdown body, parsed/mutated by `state.cjs`
- `.planning/config.json` — JSON config, parsed/mutated by `config.cjs`
- `.planning/ROADMAP.md` — Markdown with phase structure, parsed/mutated by `roadmap.cjs`
- Phase directories contain: `XX-CONTEXT.md`, `XX-YY-PLAN.md`, `XX-YY-SUMMARY.md`, `XX-VERIFICATION.md`, `XX-UAT.md`
- All state mutations go through `gsd-tools.cjs state *` commands for atomicity
## Key Abstractions
- Purpose: Single source of truth for all project state, plans, and progress
- Examples: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/config.json`
- Pattern: File-based state machine — each artifact type has a defined schema and lifecycle
- Purpose: Define agent behavior as structured Markdown prompts rather than code
- Examples: `.claude/agents/gsd-planner.md`, `.claude/agents/gsd-executor.md`
- Pattern: YAML frontmatter (name, description, tools, color) + XML-tagged prompt sections
- Purpose: Define multi-step orchestration flows as structured prompts
- Examples: `.claude/get-shit-done/workflows/plan-phase.md`, `.claude/get-shit-done/workflows/execute-phase.md`
- Pattern: `<purpose>`, `<process>`, `<step>` tags with embedded bash commands and conditional logic
- Purpose: Map agent types to LLM models based on quality/cost tradeoff profile
- Examples: `.claude/get-shit-done/bin/lib/model-profiles.cjs`
- Pattern: `MODEL_PROFILES` object maps agent name → {quality, balanced, budget, adaptive} → model name
- Purpose: Integrity verification of all distributed GSD files
- Examples: `.claude/gsd-file-manifest.json`, `.opencode/gsd-file-manifest.json`
- Pattern: SHA-256 hash of every bundled file, checked by update system
## Entry Points
- Location: `.claude/get-shit-done/bin/gsd-tools.cjs`
- Triggers: Invoked by workflow agents via `node` command
- Responsibilities: All state operations (load, update, query), phase CRUD, git operations, verification, scaffolding
- Location: `.claude/commands/gsd/*.md`
- Triggers: User types `/gsd-*` in Claude Code
- Responsibilities: Map commands to workflow files, parse arguments
- Location: `.opencode/command/gsd-*.md`
- Triggers: User types `/gsd-*` in OpenCode
- Responsibilities: Same as Claude Code commands, adapted for OpenCode format
- Location: `.claude/hooks/gsd-*.js`, `.claude/hooks/gsd-*.sh`
- Triggers: LLM runtime emits hook events (PreToolUse, PostToolUse, SessionStart)
- Responsibilities: Safety guardrails, context monitoring, state reminders, update checking
## Error Handling
- CLI tools: `output()` for structured JSON results, `error()` for fatal errors (exits with code 1)
- Hooks: Advisory-only — inject warnings as `additionalContext` but never block operations
- Security: Path traversal prevention in `security.cjs`, prompt injection detection in `gsd-prompt-guard.js`
- File locking: `withPlanningLock()` in `core.cjs` for concurrent write protection
- Timeouts: All hooks have stdin timeouts (3-10s) to prevent hanging
## Cross-Cutting Concerns
- Path traversal prevention: `security.cjs validatePath()` ensures all file operations stay within allowed directories
- Prompt injection detection: `gsd-prompt-guard.js` scans for 13 injection patterns
- Shell metacharacter sanitization: `security.cjs sanitizeForDisplay()`
- Commit message validation: `gsd-validate-commit.sh` enforces Conventional Commits format
- Context window monitoring via `gsd-context-monitor.js` and `gsd-statusline.js`
- Bridge file pattern: statusline writes metrics, context monitor reads them
- Thresholds: WARNING at 35%, CRITICAL at 25% remaining context
- `core.cjs resolveModelInternal()` maps agent type + profile to model name
- Supports: opus (high quality), sonnet (balanced), haiku (budget), adaptive
- Configurable via `.planning/config.json model_profile`
- `toPosixPath()` normalizes Windows backslash paths to forward slashes
- Shell scripts use Bash (available on Windows via Git Bash, WSL)
- Node.js hooks are cross-platform
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
