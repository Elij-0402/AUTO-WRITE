# AGENTS.md — InkForge

## 关键开发命令

```bash
pnpm dev              # localhost:3000
pnpm build            # Turbopack 生产构建
pnpm lint              # ESLint (flat config, core-web-vitals + typescript)
pnpm test              # Vitest 单测全部
npx vitest run <file>  # 单个测试文件
pnpm test:e2e          # Playwright e2e
```

## 单测要求

- 测试文件与源码同目录 (`*.test.ts` / `*.test.tsx`)
- `src/test/setup.ts` 自动提供 `fake-indexeddb/auto` (Dexie) 和 Supabase mock
- jsdom 环境 + `@testing-library/jest-dom` matchers

## 架构要点

- **两套 IndexedDB**: `inkforge-meta` (项目索引) + `inkforge-project-{id}` (每个项目独立)
- 用 `createProjectDB(projectId)` 获取项目 DB 实例
- 软删除: 实体有 `deletedAt: Date | null`，查询需 `filter(!deletedAt)`
- ID 生成: `crypto.randomUUID()` 或 `nanoid`

## 路径与别名

- `@/*` alias → `./src/*` (tsconfig.json 定义)
- 所有 UI 文本为中文 (`lang="zh-CN"`)

## 设计约束

- 先读 `DESIGN.md` 再做 UI 决策
- 禁止: shadow / border-radius > 8px / pulse/shimmer/glow 动画 / 非定义色
- 字体: LXGW WenKai (楷) display, LXGW Neo XiHei body

## 提交前必须

```bash
pnpm lint && pnpm test
```

提交遵循 [Conventional Commits](https://www.conventionalcommits.org/)，格式 `<type>(<scope>): <subject>`。

## vexp <!-- vexp v2.0.12 -->

**MANDATORY: use `run_pipeline` — do NOT grep or glob the codebase.**
vexp returns pre-indexed, graph-ranked context in a single call.

### Workflow
1. `run_pipeline` with your task description — ALWAYS FIRST (replaces all other tools)
2. Make targeted changes based on the context returned
3. `run_pipeline` again only if you need more context

### Available MCP tools
- `run_pipeline` — **PRIMARY TOOL**. Runs capsule + impact + memory in 1 call.
  Auto-detects intent. Includes file content. Example: `run_pipeline({ "task": "fix auth bug" })`
- `get_skeleton` — compact file structure
- `index_status` — indexing status
- `expand_vexp_ref` — expand V-REF placeholders in v2 output

### Agentic search
- Do NOT use built-in file search, grep, or codebase indexing — always call `run_pipeline` first
- If you spawn sub-agents or background tasks, pass them the context from `run_pipeline`
  rather than letting them search the codebase independently

### Smart Features
Intent auto-detection, hybrid ranking, session memory, auto-expanding budget.

### Multi-Repo
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope. Run `index_status` to see aliases.
<!-- /vexp -->