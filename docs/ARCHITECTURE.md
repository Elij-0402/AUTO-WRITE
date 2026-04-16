# 架构概览

## 分层

```
┌─────────────────────────────────────────────────────┐
│  UI 层 (src/app, src/components)                     │
│    四面板工作区 · 分析面板 · 版本历史抽屉             │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  Hooks 层 (src/lib/hooks)                            │
│    use-ai-chat · use-chapter-editor · use-revisions │
│    use-world-entries · use-relations                │
└──────────────┬──────────────────────────────────────┘
               │
    ┌──────────┼──────────┬────────────┐
    │          │          │            │
┌───▼───┐ ┌────▼────┐ ┌───▼────┐ ┌────▼──────┐
│ AI    │ │ RAG     │ │ DB     │ │ Analysis  │
│ 层    │ │ 层      │ │ 层     │ │ 层        │
│       │ │         │ │ (Dexie)│ │           │
└───────┘ └─────────┘ └────────┘ └───────────┘
```

## 两层 IndexedDB

| DB | 作用 | 表 |
| --- | --- | --- |
| `inkforge-meta`（单例） | 项目列表 | `projectIndex` |
| `inkforge-project-{id}`（每项目一个） | 项目全部内容 | `chapters`, `worldEntries`, `relations`, `layoutSettings`, `aiConfig`, `messages`, `consistencyExemptions`, `revisions`, `embeddings`, `analyses` |

每个项目的 DB 是独立的，支持完整的多版本迁移。当前 schema 版本：**v9**。

## 关键模块

### AI 层（`src/lib/ai/`）
见 [AI-LAYER.md](./AI-LAYER.md)。

### RAG 层（`src/lib/rag/`）
见 [RAG.md](./RAG.md)。

### 分析层（`src/lib/analysis/`, `src/components/analysis/`）
- `force-layout.ts` — DIY 力导向图布局
- `content-hash.ts` — FNV-1a 内容哈希 + Tiptap 文档纯文本提取
- `StyleProfile` 组件 — 单次 Claude 调用 + `analyses` 表缓存

### 编辑器（`src/components/editor/`）
Tiptap 3 + StarterKit + Placeholder + Typography。通过 `EditorHandle` ref 暴露 `insertText` 和 `setContent` 两个指令（后者供版本历史恢复使用）。

### 版本历史（`src/lib/db/revisions.ts` + `src/components/editor/history-drawer.tsx`）
- 自动快照：每 5 分钟 + 在自动保存后触发一次
- 手动快照：history drawer 的「保存当前为命名版本」按钮
- AI 草稿快照：预留 `source: 'ai-draft'`（待 Stage 4 diff 卡集成）
- 容量：每章节最多 50 条，溢出时按优先级裁剪（labelled > manual > ai-draft > autosnapshot）

### 同步（`src/lib/sync/`）
离线优先：本地 IndexedDB 是真相之源，Supabase 只做镜像。`aiConfig` 永远不同步。

## 数据类型

在 `src/lib/types/` 里定义：
- `ProjectMeta` — 项目元信息
- `Chapter` — Tiptap JSON 内容 + 大纲字段 + 字数
- `WorldEntry` — 判别联合：`character | location | rule | timeline`
- `Relation` — 双向条目关系

在 `src/lib/db/project-db.ts` 里定义：
- `AIConfig` — provider + apiKey + baseUrl + model
- `ChatMessage` — AI 对话历史
- `ConsistencyExemption` — 用户"有意为之"的矛盾记录
- `Revision` — 章节快照
- `AnalysisArtifact` — 缓存的 AI 分析结果

在 `src/lib/rag/types.ts` 里定义：
- `Embedding` — `{ sourceType, sourceId, vector, embedderId, text, updatedAt }`

## 路由

- `/` — Dashboard（项目列表）
- `/auth`, `/auth/forgot-password`, `/auth/callback` — Supabase 登录
- `/projects/[id]` — 四面板写作工作区
- `/projects/[id]/analysis` — 创作者分析面板

## Proxy（Next.js 16 新 convention）

`src/proxy.ts`（原 `src/middleware.ts`）负责：
- 校验 Supabase 会话
- 登录后重定向到 returnUrl
