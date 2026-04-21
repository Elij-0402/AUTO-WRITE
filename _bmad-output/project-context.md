---
name: InkForge Project Context
description: AI agent implementation rules for InkForge novel writing workstation
type: project
version: 1.0
created: 2026-04-21
sections_completed:
  ["technology-stack", "language-rules", "react-nextjs-rules", "testing-rules", "code-quality-rules", "critical-rules"]
status: complete
rule_count: 45
optimized_for_llm: true
---

# InkForge Project Context

## 技术栈 & 版本

- **Framework**: Next.js 16.2.3、React 19.2.4、TypeScript 5（strict 模式）
- **Database**: Dexie.js 4.4.2（IndexedDB）+ fake-indexeddb/auto（测试）
- **AI**: @anthropic-ai/sdk 0.90.0、OpenAI 兼容接口（BYOK）
- **UI**: @dnd-kit 10.0.0、react-resizable-panels 4.10.0、Radix UI、Tiptap 3.22.3
- **Styling**: Tailwind CSS v4、Zod 4.3.6
- **Sync**: Supabase SSR 0.10.2
- **Testing**: Vitest 4.1.4 + @testing-library/react 16.3 + jsdom + fake-indexeddb

### 数据库架构（双层 IndexedDB）

- `inkforge-meta`（meta-db）：存储项目列表 `projectIndex` + 全局 AI 配置 `aiConfig`
- `inkforge-project-{id}`（project-db）：存储项目所有数据（chapters、worldEntries、relations 等）
- Schema 版本：meta-db v2、project-db v14（embeddings 表已移除）
- 软删除模式：所有实体使用 `deletedAt: Date | null`，查询时过滤 `!deletedAt`

### 路径别名

- `@/*` → `./src/*`

---

## 语言特定规则（TypeScript）

- `strict: true`（tsconfig.json）- 所有严格检查必须通过
- `moduleResolution: bundler` - 使用 Next.js 的模块解析
- 类型定义在 `src/lib/types/` 中，接口以 `type` 导出（非 `interface`，除非需要继承）
- Dexie 表使用 `type Table<T, Key>` 泛型，键名明确标注
- 所有 `id` 字段使用 `string`（`crypto.randomUUID()` 或 `nanoid` 生成）
- Soft delete 查询模式：`await db.table.where('deletedAt').equals(null).toArray()`
- DB schema 升级：每个 version 只做最小变更，迁移函数加 try/catch 防止部分失败

---

## React/Next.js 规范

- 每个功能一个 hook：`use-chapters`、`use-world-entries`、`use-ai-chat` 等
- 使用 `useLiveQuery`（dexie-react-hooks）做响应式 DB 查询，loading 状态独立处理
- Client Components 显式标注 `'use client'`
- Server Actions 在 `actions.ts` 中管理
- AI 配置存储在 IndexedDB，不使用 React Context
- 编辑器使用 Tiptap JSON 格式（Tiptap/ProseMirror）
- 多面板布局使用 `react-resizable-panels`，布局设置持久化到 IndexedDB
- 对话状态在 `messages` state 中，pending 时 optimistically add
- 同步状态由 `useSync` hook 管理

---

## Testing Rules

- 测试文件与源文件同目录：`src/**/*.test.{ts,tsx}`
- 测试配置：`vitest.config.ts` + `src/test/setup.ts`
- 使用 `fake-indexeddb/auto` 自动处理 IndexedDB（测试时真实 DB）
- 全局 mock `@/lib/supabase/client`（测试环境不连真实 Supabase）
- jsdom 环境用于 React 组件测试（`environment: 'jsdom'`）
- DB 测试：每个 query 函数有对应 `.test.ts`
- Hook 测试：每个 hook 有 `.test.ts` 验证行为
- 组件测试：`@testing-library/react` + `userEvent`
- `createProjectDB(projectId)` 需要真实或测试用 projectId

---

## 代码质量 & 风格规范

- **文件命名**：组件 PascalCase、Hook 使用 `use-` 前缀、Query 文件 kebab-case
- **组件结构**：`src/components/ui/` 放通用 UI、`workspace/`/`editor/`/`world-bible/` 放业务组件
- **Props 接口**：命名 `ComponentNameProps`
- **导入顺序**：React → 第三方库 → `@/` 路径别名 → 相对导入
- **ESLint**：flat config（`eslint.config.mjs`），规则 `core-web-vitals` + TypeScript
- **组件变体**：使用 `class-variance-authority`（CVA）
- Tailwind CSS v4 + `tailwind-merge` + `clsx` 组合类名
- 设计系统颜色使用 `hsl(var(--accent))` / `hsl(var(--line))` CSS 变量（见 DESIGN.md）

---

## 关键规则（禁止违反）

### AI Context Injection（已简化）
- RAG 向量系统已删除（`src/lib/rag/` 目录不存在）
- `use-context-injection.ts` 是纯关键词匹配：topK=6，token budget=2000
- 禁止重新引入向量嵌入或 RAG 搜索

### AI Config 本地存储
- `aiConfig` 存储在 IndexedDB，永远不上传到 Supabase
- BYOK API Key 保存在本地，不经过云端

### 数据库 Schema
- `project-db` 当前是 v14（embeddings 表已删除）
- 新功能禁止添加回 embeddings 表

### Sync 队列
- 没有重试逻辑，失败标记 `failed: true`，不自动重试
- 没有 conflict-resolver（已删除）
- `flushSyncQueue` 单向推送，本地优先

### 多会话已降级
- `use-conversations.ts` 只导出 `{ conversations, loading, remove }`
- 禁止使用 `create()` 或 `rename()`
- AI chat panel 始终使用 `conversations[0]`

### Draft Rejection
- 只有 2 个选项：不符合设定 / 其他（不是 4 个选项）

### UI 设计系统
- 严格遵循 DESIGN.md（颜色使用 hsl 变量）
- 禁止使用 gradient / glow / pulse / shimmer
- 不偏离设计系统除非用户显式批准

---

## 使用指南

**AI Agents 使用规则**：
- 实施任何代码前阅读此文件
- 严格遵循所有规则
- 模糊时优先选择更严格的选项
- 新模式出现时更新此文件

**维护规则**：
- 技术栈变化时更新
- 每季度审查，移除过时规则
- 保持精简，专注 agent 需求
- 移除变得显而易见的规则

最后更新：2026-04-21