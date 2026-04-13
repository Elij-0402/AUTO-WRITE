# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Agent-Orchestrated Workflow Engine

**Key Characteristics:**
- CLI tool (`gsd-tools.cjs`) serves as the programmatic backbone — workflows call it via `node gsd-tools.cjs <command>`
- LLM agents (planner, executor, verifier, etc.) are Markdown-defined personas orchestrated by workflow prompts
- State is persisted as Markdown + JSON files in `.planning/` directory
- Hooks intercept LLM runtime tool calls (PreToolUse/PostToolUse) to enforce guardrails
- Dual-runtime support: Claude Code (`.claude/`) and OpenCode (`.opencode/`) with identical structure

## Layers

**CLI Tool Layer:**
- Purpose: Programmatic operations that LLM agents cannot do natively (file I/O, git, math, state CRUD)
- Location: `.claude/get-shit-done/bin/gsd-tools.cjs`, `.claude/get-shit-done/bin/lib/*.cjs`
- Contains: 21 library modules and a CLI entry point
- Depends on: Node.js built-ins (fs, path, child_process, crypto, os), `.planning/` state files
- Used by: All workflow agents that need structured data or state mutation

**Workflow Layer:**
- Purpose: Orchestration logic for each GSD command (plan-phase, execute-phase, etc.)
- Location: `.claude/get-shit-done/workflows/*.md`, `.claude/commands/gsd/*.md`
- Contains: Markdown prompts with `<process>` steps, `<step>` directives, bash commands, agent spawn instructions
- Depends on: CLI tool layer (via bash invocations), agent definitions, templates, references
- Used by: LLM runtime /invoke parsers that map command names to workflow files

**Agent Layer:**
- Purpose: Specialized subagent personas for specific tasks (planning, execution, verification, etc.)
- Location: `.claude/agents/gsd-*.md`
- Contains: 24 agent definitions with YAML frontmatter (name, description, tools, color) and detailed prompt instructions
- Depends on: CLI tool layer, references (verification patterns, gates, thinking models, etc.)
- Used by: Workflow orchestrators that spawn subagents via Task/Agent tools

**Hook Layer:**
- Purpose: Runtime interception for safety, context awareness, and guardrails
- Location: `.claude/hooks/gsd-*.js`, `.claude/hooks/gsd-*.sh`
- Contains: 9 hook scripts (6 JS, 3 Bash)
- Depends on: Node.js runtime, `.planning/config.json`, temp files
- Used by: Claude Code / OpenCode runtime hook system (PreToolUse, PostToolUse, SessionStart)

**Template Layer:**
- Purpose: Scaffold templates for planning artifacts (ROADMAP.md, PLAN.md, STATE.md, etc.)
- Location: `.claude/get-shit-done/templates/*.md`, `.claude/get-shit-done/templates/*.json`
- Contains: 30+ template files for project documentation and planning artifacts
- Depends on: CLI tool layer (`template.cjs` for fill operations)
- Used by: New project initialization, phase creation, verification scaffolding

**Reference Layer:**
- Purpose: Domain knowledge documents consumed by agents during execution
- Location: `.claude/get-shit-done/references/*.md`, `.claude/get-shit-done/references/few-shot-examples/*.md`
- Contains: 35 reference documents covering verification patterns, agent contracts, thinking models, TDD, etc.
- Depends on: None (static reference material)
- Used by: Agent prompts that `@`-reference these files for context injection

## Data Flow

**Project Initialization (`/gsd-new-project`):**

1. User invokes `/gsd-new-project` command
2. Workflow reads `gsd-tools.cjs init new-project`
3. CLI creates `.planning/` directory structure with `config.json`, `STATE.md`, `ROADMAP.md`, `PROJECT.md`
4. Templates filled from `.claude/get-shit-done/templates/`
5. Session state hook registers the new project

**Phase Planning (`/gsd-plan-phase`):**

1. Orchestrator reads `gsd-tools.cjs init plan-phase` for context
2. Optionally spawns `gsd-phase-researcher` agent for technical research
3. Spawns `gsd-planner` agent to create PLAN.md files
4. Spawns `gsd-plan-checker` agent to review plan quality
5. Revision loop (max 3 iterations) based on checker feedback
6. CLI updates STATE.md with plan count and phase status

**Phase Execution (`/gsd-execute-phase`):**

1. Orchestrator reads `gsd-tools.cjs init execute-phase` for context
2. Spawns `gsd-executor` agent with PLAN.md and CONTEXT.md
3. Executor creates per-task commits, handles deviations
4. On completion, executor writes SUMMARY.md
5. CLI updates STATE.md with execution metrics

**Hook Flow (every tool call):**

1. **PreToolUse** — `gsd-prompt-guard.js` scans for prompt injection in `.planning/` writes
2. **PreToolUse** — `gsd-read-guard.js` reminds to read before writing existing files
3. **PreToolUse** — `gsd-workflow-guard.js` advises using GSD workflows for edits
4. **PreToolUse** — `gsd-validate-commit.sh` enforces Conventional Commits (opt-in)
5. **PostToolUse** — `gsd-context-monitor.js` warns when context window is low
6. **PostToolUse** — `gsd-phase-boundary.sh` reminds to update STATE.md

**State Management:**

- `.planning/STATE.md` — YAML frontmatter + Markdown body, parsed/mutated by `state.cjs`
- `.planning/config.json` — JSON config, parsed/mutated by `config.cjs`
- `.planning/ROADMAP.md` — Markdown with phase structure, parsed/mutated by `roadmap.cjs`
- Phase directories contain: `XX-CONTEXT.md`, `XX-YY-PLAN.md`, `XX-YY-SUMMARY.md`, `XX-VERIFICATION.md`, `XX-UAT.md`
- All state mutations go through `gsd-tools.cjs state *` commands for atomicity

## Key Abstractions

**Planning Directory (`.planning/`):**
- Purpose: Single source of truth for all project state, plans, and progress
- Examples: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/config.json`
- Pattern: File-based state machine — each artifact type has a defined schema and lifecycle

**Agent-as-Markdown:**
- Purpose: Define agent behavior as structured Markdown prompts rather than code
- Examples: `.claude/agents/gsd-planner.md`, `.claude/agents/gsd-executor.md`
- Pattern: YAML frontmatter (name, description, tools, color) + XML-tagged prompt sections

**Workflow-as-Markdown:**
- Purpose: Define multi-step orchestration flows as structured prompts
- Examples: `.claude/get-shit-done/workflows/plan-phase.md`, `.claude/get-shit-done/workflows/execute-phase.md`
- Pattern: `<purpose>`, `<process>`, `<step>` tags with embedded bash commands and conditional logic

**Model Profiles:**
- Purpose: Map agent types to LLM models based on quality/cost tradeoff profile
- Examples: `.claude/get-shit-done/bin/lib/model-profiles.cjs`
- Pattern: `MODEL_PROFILES` object maps agent name → {quality, balanced, budget, adaptive} → model name

**File Manifest:**
- Purpose: Integrity verification of all distributed GSD files
- Examples: `.claude/gsd-file-manifest.json`, `.opencode/gsd-file-manifest.json`
- Pattern: SHA-256 hash of every bundled file, checked by update system

## Entry Points

**CLI Entry Point:**
- Location: `.claude/get-shit-done/bin/gsd-tools.cjs`
- Triggers: Invoked by workflow agents via `node` command
- Responsibilities: All state operations (load, update, query), phase CRUD, git operations, verification, scaffolding

**Command Entry Points (Claude Code):**
- Location: `.claude/commands/gsd/*.md`
- Triggers: User types `/gsd-*` in Claude Code
- Responsibilities: Map commands to workflow files, parse arguments

**Command Entry Points (OpenCode):**
- Location: `.opencode/command/gsd-*.md`
- Triggers: User types `/gsd-*` in OpenCode
- Responsibilities: Same as Claude Code commands, adapted for OpenCode format

**Hook Entry Points:**
- Location: `.claude/hooks/gsd-*.js`, `.claude/hooks/gsd-*.sh`
- Triggers: LLM runtime emits hook events (PreToolUse, PostToolUse, SessionStart)
- Responsibilities: Safety guardrails, context monitoring, state reminders, update checking

## Error Handling

**Strategy:** Fail-safe with advisory warnings

**Patterns:**
- CLI tools: `output()` for structured JSON results, `error()` for fatal errors (exits with code 1)
- Hooks: Advisory-only — inject warnings as `additionalContext` but never block operations
- Security: Path traversal prevention in `security.cjs`, prompt injection detection in `gsd-prompt-guard.js`
- File locking: `withPlanningLock()` in `core.cjs` for concurrent write protection
- Timeouts: All hooks have stdin timeouts (3-10s) to prevent hanging

## Cross-Cutting Concerns

**Security:**
- Path traversal prevention: `security.cjs validatePath()` ensures all file operations stay within allowed directories
- Prompt injection detection: `gsd-prompt-guard.js` scans for 13 injection patterns
- Shell metacharacter sanitization: `security.cjs sanitizeForDisplay()`
- Commit message validation: `gsd-validate-commit.sh` enforces Conventional Commits format

**Context Management:**
- Context window monitoring via `gsd-context-monitor.js` and `gsd-statusline.js`
- Bridge file pattern: statusline writes metrics, context monitor reads them
- Thresholds: WARNING at 35%, CRITICAL at 25% remaining context

**Model Resolution:**
- `core.cjs resolveModelInternal()` maps agent type + profile to model name
- Supports: opus (high quality), sonnet (balanced), haiku (budget), adaptive
- Configurable via `.planning/config.json model_profile`

**Cross-Platform:**
- `toPosixPath()` normalizes Windows backslash paths to forward slashes
- Shell scripts use Bash (available on Windows via Git Bash, WSL)
- Node.js hooks are cross-platform

---

*Architecture analysis: 2026-04-13*