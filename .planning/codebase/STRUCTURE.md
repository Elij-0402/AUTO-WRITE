# Codebase Structure

**Analysis Date:** 2026-04-13

## Directory Layout

```
D:\AUTO-WRITE/
├── .claude/                          # Claude Code runtime configuration
│   ├── agents/                       # Agent persona definitions (24 files)
│   ├── commands/gsd/                 # Claude Code /gsd-* command definitions (68 files)
│   ├── get-shit-done/                # Core GSD framework
│   │   ├── bin/                      # CLI tooling
│   │   │   ├── gsd-tools.cjs         # Main CLI entry point (1047 lines)
│   │   │   └── lib/                  # Library modules (21 files)
│   │   ├── contexts/                 # Agent context profiles (dev, research, review)
│   │   ├── references/               # Domain knowledge documents (35 files)
│   │   │   └── few-shot-examples/    # Example patterns for agents
│   │   ├── templates/                # Artifact scaffold templates (33 files)
│   │   │   ├── codebase/             # Codebase mapping templates (7 files)
│   │   │   └── research-project/     # Research report templates (5 files)
│   │   ├── workflows/                # Workflow orchestration prompts (68 files)
│   │   └── VERSION                   # Framework version (v1.34.2)
│   ├── hooks/                        # Runtime hook scripts (9 files)
│   ├── gsd-file-manifest.json        # SHA-256 integrity checksums
│   ├── package.json                  # Minimal: {"type":"commonjs"}
│   └── settings.json                 # Hook configuration for Claude Code
│
├── .opencode/                        # OpenCode runtime configuration (mirror)
│   ├── agents/                       # Same agent definitions as .claude/agents/
│   ├── command/                      # OpenCode command definitions (68 files)
│   ├── get-shit-done/                # Same GSD framework (identical copy)
│   │   ├── bin/                      # Same CLI tooling
│   │   ├── contexts/                # Same context profiles
│   │   ├── references/              # Same reference documents
│   │   ├── templates/               # Same templates
│   │   └── workflows/               # Same workflows
│   ├── hooks/                        # Same hook scripts
│   ├── gsd-file-manifest.json        # Same integrity checksums
│   ├── node_modules/                 # npm dependencies (zod)
│   ├── opencode.json                 # OpenCode permissions config
│   ├── package.json                  # {"type":"commonjs", dependencies: {"@opencode-ai/plugin"}}
│   ├── package-lock.json             # npm lockfile
│   └── settings.json                 # Empty ({})
│
└── .git/                             # Git repository (no commits yet)
```

## Directory Purposes

**`.claude/`:**
- Purpose: Claude Code agent runtime configuration — agents, commands, hooks, and the GSD framework
- Contains: 130+ files defining the full GSD system for Claude Code
- Key files: `settings.json` (hook config), `package.json` (CommonJS type), `gsd-file-manifest.json`

**`.opencode/`:**
- Purpose: OpenCode agent runtime configuration — mirrors `.claude/` structure for OpenCode compatibility
- Contains: Same GSD framework files, OpenCode-specific command format (`gsd-` prefix in filenames)
- Key files: `opencode.json` (permissions), `package.json` (with `@opencode-ai/plugin`), `settings.json`

**`.claude/get-shit-done/bin/`:**
- Purpose: CLI tooling — the programmatic backbone that all workflow agents invoke
- Contains: `gsd-tools.cjs` (entry point) and `lib/` (21 module files)
- Key files: `gsd-tools.cjs` (CLI router), `lib/core.cjs` (1367 lines, shared utilities), `lib/init.cjs` (1319 lines, compound init commands), `lib/state.cjs` (1173 lines, state management)

**`.claude/get-shit-done/workflows/`:**
- Purpose: Workflow definitions — Markdown prompts that orchestrate multi-step agent interactions
- Contains: 68 workflow files, one per `/gsd-*` command
- Key files: `plan-phase.md` (1075 lines), `execute-phase.md`, `map-codebase.md`

**`.claude/agents/`:**
- Purpose: Agent persona definitions — specialized LLM prompt templates
- Contains: 24 agent definitions with YAML frontmatter + structured instructions
- Key files: `gsd-planner.md` (958 lines), `gsd-debugger.md` (1005 lines), `gsd-verifier.md` (581 lines)

**`.claude/commands/gsd/`:**
- Purpose: Claude Code command entry points — maps `/gsd-*` invocations to workflow files
- Contains: 68 command files, one per workflow

**`.claude/hooks/`:**
- Purpose: Runtime hooks — scripts that execute before/after LLM tool calls
- Contains: 9 hook scripts (6 `.js`, 3 `.sh`)
- Key files: `gsd-context-monitor.js` (141 lines), `gsd-statusline.js` (126 lines), `gsd-check-update.js` (124 lines)

**`.claude/get-shit-done/references/`:**
- Purpose: Domain knowledge documents consumed by agents during planning/execution/verification
- Contains: 35 reference documents + few-shot examples
- Key files: `agent-contracts.md`, `gates.md`, `verification-patterns.md`, `thinking-models-*.md`, `tdd.md`

**`.claude/get-shit-done/templates/`:**
- Purpose: Scaffold templates for planning artifacts
- Contains: 33 template files + subdirectories for codebase and research-project templates
- Key files: `PLAN.md` equivalents, `STATE.md`, `ROADMAP.md`, `PROJECT.md`, `config.json`

**`.claude/get-shit-done/contexts/`:**
- Purpose: Agent output style profiles
- Contains: 3 files (`dev.md`, `research.md`, `review.md`)
- Loaded when `context` field is set in config

## Key File Locations

**Entry Points:**
- `.claude/get-shit-done/bin/gsd-tools.cjs`: CLI entry point — all state/phase/roadmap operations
- `.claude/commands/gsd/*.md`: Command-to-workflow mapping (68 commands)
- `.opencode/command/gsd-*.md`: OpenCode command mapping (68 commands)

**Configuration:**
- `.claude/settings.json`: Claude Code hook configuration (PreToolUse, PostToolUse, SessionStart)
- `.opencode/opencode.json`: OpenCode permissions (read, external_directory)
- `.planning/config.json`: Project configuration (created at runtime by `/gsd-new-project`)

**Core Logic:**
- `.claude/get-shit-done/bin/lib/core.cjs` (1367 lines): Shared utilities, constants, git operations, path helpers
- `.claude/get-shit-done/bin/lib/state.cjs` (1173 lines): STATE.md CRUD, frontmatter parsing
- `.claude/get-shit-done/bin/lib/init.cjs` (1319 lines): Compound init commands for workflow bootstrapping
- `.claude/get-shit-done/bin/lib/commands.cjs` (875 lines): Standalone utility commands
- `.claude/get-shit-done/bin/lib/security.cjs` (424 lines): Path traversal prevention, prompt injection guards

**Agent Definitions:**
- `.claude/agents/gsd-planner.md` (958 lines): Plan creation with task breakdown
- `.claude/agents/gsd-executor.md` (374 lines): Plan execution with atomic commits
- `.claude/agents/gsd-verifier.md` (581 lines): Goal-backward verification
- `.claude/agents/gsd-codebase-mapper.md` (529 lines): Codebase analysis for mapping

**Workflows:**
- `.claude/get-shit-done/workflows/plan-phase.md` (1075 lines): Phase planning orchestration
- `.claude/get-shit-done/workflows/execute-phase.md`: Phase execution orchestration
- `.claude/get-shit-done/workflows/map-codebase.md` (379 lines): Codebase mapping orchestration

## Naming Conventions

**Files:**
- CLI libraries: `kebab-case.cjs` (e.g., `model-profiles.cjs`, `schema-detect.cjs`)
- Hooks: `gsd-{purpose}.{js|sh}` (e.g., `gsd-workflow-guard.js`, `gsd-validate-commit.sh`)
- Agents: `gsd-{role}.md` (e.g., `gsd-planner.md`, `gsd-code-fixer.md`)
- Workflows: `kebab-case.md` (e.g., `plan-phase.md`, `execute-phase.md`)
- Commands (Claude): `kebab-case.md` in `commands/gsd/`
- Commands (OpenCode): `gsd-kebab-case.md` in `command/`
- Templates: `SCREAMING-CASE.md` (e.g., `ROADMAP.md`, `PLAN.md`) or `kebab-case.md` (e.g., `summary-standard.md`)
- Phase artifacts: `{padded_phase}-{slug}-{TYPE}.md` (e.g., `01-01-PLAN.md`, `01-01-SUMMARY.md`)

**Directories:**
- `.claude/get-shit-done/bin/lib/`: Library modules
- `.claude/agents/`: Agent definitions
- `.claude/commands/gsd/`: Claude Code commands
- `.claude/hooks/`: Runtime hooks
- `.planning/`: Runtime project state (created by `/gsd-new-project`)
- `.planning/phases/`: Per-phase directories
- `.planning/codebase/`: Codebase analysis documents

## Where to Add New Code

**New Agent:**
- Primary definition: `.claude/agents/gsd-{name}.md`
- Must include YAML frontmatter: `name`, `description`, `tools`, `color`
- Must reference required_reading paths with `D:/AUTO-WRITE/.claude/get-shit-done/references/`
- Register in `model-profiles.cjs` for model resolution

**New Workflow:**
- Workflow prompt: `.claude/get-shit-done/workflows/{name}.md`
- Claude Code command: `.claude/commands/gsd/{name}.md`
- OpenCode command: `.opencode/command/gsd-{name}.md`
- Register in `gsd-file-manifest.json` with SHA-256 hash

**New CLI Command:**
- Add command handler in `gsd-tools.cjs` or appropriate `lib/*.cjs` module
- Register command in `lib/commands.cjs` if standalone, or relevant module
- Update `gsd-file-manifest.json`

**New Hook:**
- Script: `.claude/hooks/gsd-{name}.{js|sh}` (Node.js for complex logic, Bash for simple checks)
- Register in `.claude/settings.json` hooks configuration (PreToolUse, PostToolUse, or SessionStart)
- Mirror to `.opencode/hooks/` for OpenCode compatibility

**New Template:**
- Template file: `.claude/get-shit-done/templates/{name}.md`
- Reference in relevant workflow or CLI command
- Update `gsd-file-manifest.json`

**New Reference Document:**
- Reference file: `.claude/get-shit-done/references/{name}.md`
- Reference in agent `required_reading` sections using `@` paths
- Update `gsd-file-manifest.json`

**Runtime State (project-specific, created by `/gsd-new-project`):**
- `.planning/config.json` — Project configuration
- `.planning/STATE.md` — Project state
- `.planning/ROADMAP.md` — Phase roadmap
- `.planning/PROJECT.md` — Project context
- `.planning/REQUIREMENTS.md` — Acceptance criteria
- `.planning/phases/{XX-name}/` — Phase directories

## Special Directories

**`.planning/`:**
- Purpose: Runtime project state — created by `/gsd-new-project`, not in version control
- Generated: Yes (created at runtime, includes in `.gitignore`)
- Committed: No (should be `.gitignore`d)
- Structure: `STATE.md`, `config.json`, `ROADMAP.md`, `phases/`, `codebase/`, `intel/`, `todos/`, `workstreams/`, `milestones/`

**`.opencode/node_modules/`:**
- Purpose: npm dependencies for OpenCode plugin system
- Generated: Yes (via `npm install`)
- Committed: No (should be `.gitignore`d)

**`.claude/get-shit-done/` / `.opencode/get-shit-done/`:**
- Purpose: Distributed GSD framework code (installed by `/gsd-new-project` or update mechanism)
- Generated: No (managed by GSD update system)
- Committed: Yes (tracked in git, verified by `gsd-file-manifest.json`)

---

*Structure analysis: 2026-04-13*