# InkForge 架构文档

## 执行摘要

InkForge 是一款面向中文网文作者的 AI 写作工作台，采用 Next.js 16 + React 19 + TypeScript 技术栈，实现离线优先的两层 IndexedDB 数据架构。

---

## 技术栈详情

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 16 | App Router, Server Components |
| 语言 | TypeScript | strict 模式 |
| 样式 | Tailwind CSS v4 | @tailwindcss/postcss |
| 编辑器 | Tiptap 3 | ProseMirror-based rich text |
| 数据库 | Dexie.js 4 | IndexedDB wrapper |
| 状态 | React Hooks + useLiveQuery |  |
| 云同步 | Supabase | 可选离线同步 |
| AI | @anthropic-ai/sdk | Anthropic 原生 + OpenAI 兼容 |

---

## 架构模式

### 两层 IndexedDB 隔离

```
┌─────────────────────────────────────────────────────┐
│                   inkforge-meta                      │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  projectIndex    │  │     aiConfig (global)     │  │
│  └─────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│           inkforge-project-{projectId}              │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐  │
│  │chapters │ │worldEntries│ │relations│ │messages │  │
│  └─────────┘ └──────────┘ └─────────┘ └─────────┘  │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐   │
│  │conversations │ │ revisions│ │  aiUsage     │   │
│  └──────────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌───────────────────────────┐   │
│  │contradictions│ │ layoutSettings            │   │
│  └──────────────┘ └───────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 数据流向

```
用户操作 → React Hooks → Dexie → IndexedDB
                ↓
         Supabase (可选同步)
```

---

## 核心模块

### AI 层 (`src/lib/ai/`)

| 文件 | 职责 |
|------|------|
| `client.ts` | Provider-agnostic AI 客户端，统一 streamChat 接口 |
| `prompts.ts` | 系统提示词构建，支持 cache-friendly 分段 |
| `providers/anthropic.ts` | Anthropic 原生实现，支持 tool use |
| `providers/openai-compatible.ts` | OpenAI 兼容端点实现 |
| `suggestion-parser.ts` | AI 建议解析 |
| `summarize.ts` | 对话摘要生成 |

**AI Context Injection**:
- 关键词匹配 + 2000 token 预算
- 优先级：character > location > rule > timeline
- 注入为 `【世界观百科】` 系统提示词段落

### 数据层 (`src/lib/db/`)

| 文件 | 职责 |
|------|------|
| `meta-db.ts` | 共享元数据库 (inkforge-meta) |
| `project-db.ts` | Per-project 数据库工厂 |
| `chapter-queries.ts` | 章节 CRUD 操作 |
| `world-entry-queries.ts` | 世界观条目 CRUD |
| `relation-queries.ts` | 关系 CRUD |

### Hooks 层 (`src/lib/hooks/`)

| Hook | 职责 |
|------|------|
| `use-chapters.ts` | 章节状态管理 |
| `use-world-entries.ts` | 世界观条目状态 |
| `use-relations.ts` | 关系状态 |
| `use-ai-chat.ts` | AI 对话核心逻辑 |
| `use-context-injection.ts` | 上下文注入逻辑 |
| `use-autosave.ts` | 自动保存 |
| `use-layout.ts` | 布局设置持久化 |
| `use-projects.ts` | 项目列表 |

### 同步层 (`src/lib/sync/`)

| 文件 | 职责 |
|------|------|
| `sync-engine.ts` | Supabase 同步引擎 |
| `sync-queue.ts` | 离线队列管理 |
| `field-mapping.ts` | 本地/云端字段映射 |

**同步策略**：
- 离线优先，本地 IndexedDB 为数据源
- 队列批量同步 (50条/批)
- 最多 5 次重试，指数退避
- `aiConfig` 不同步 (D-48: 本地存储)

---

## 组件架构

### 工作区四面板布局

```
┌──────────────┬─────────────────────┬──────────────┐
│   侧边栏     │      编辑器         │   AI 面板    │
│   (280px)    │      (1fr)          │   (320px)    │
│              │                     │              │
│  ┌────────┐  │  ┌─────────────────┐│  ┌─────────┐│
│  │章节列表│  │  │   Tiptap 编辑器 ││  │AI 对话  ││
│  ├────────┤  │  │                 ││  ├─────────┤│
│  │大纲    │  │  │                 ││  │建议卡片 ││
│  ├────────┤  │  └─────────────────┘│  └─────────┘│
│  │世界观  │  │                     │              │
│  └────────┘  │                     │              │
└──────────────┴─────────────────────┴──────────────┘
```

### 组件分类

| 类别 | 组件 |
|------|------|
| 编辑器 | `Editor`, `FloatingToolbar`, `HistoryDrawer`, `ChapterMetaStrip` |
| 章节 | `ChapterSidebar`, `ChapterRow`, `CreateChapterInput`, `DeleteChapterDialog` |
| 世界观 | `WorldEntryEditForm`, `WorldBibleTab`, `RelationshipSection`, `TagInput` |
| AI | `AIChatPanel`, `SuggestionCard`, `DraftCard`, `ConsistencyWarningCard` |
| 项目 | `ProjectDashboard`, `ProjectCard`, `CreateProjectModal`, `ProjectSettingsDialog` |
| 同步 | `SyncManager`, `SyncProgress`, `SyncStatusIcon` |
| 分析 | `RelationGraph`, `TimelineView`, `ContradictionDashboard` |
| UI | Button, Dialog, DropdownMenu, Input, Select 等 (基于 Radix UI) |

---

## 路由架构

```
src/app/
├── layout.tsx                    # Root layout (字体, 主题)
├── page.tsx                      # 首页 → ProjectDashboard
├── auth/
│   ├── page.tsx                  # 认证页
│   ├── actions.ts                # Auth actions
│   ├── callback/route.ts         # OAuth callback
│   └── forgot-password/page.tsx
├── (authenticated)/
│   ├── layout.tsx                # Auth layout wrapper
│   └── AuthenticatedLayoutClient.tsx
└── projects/[id]/
    ├── layout.tsx                # Project layout
    ├── page.tsx                  # 四面板工作区
    └── analysis/page.tsx         # 分析面板
```

---

## 安全与数据

### BYOK 模型
- API Key 存储在本地 IndexedDB
- 不经过 InkForge 服务器
- `aiConfig` 不同步到 Supabase

### 软删除
- 所有实体使用 `deletedAt: Date | null`
- 查询需 filter `!deletedAt`

### ID 生成
- `crypto.randomUUID()` 或 `nanoid`

---

## 实验性功能

`src/lib/ai/experiment-flags.ts` 定义 Phase B-D 实验标志：

| 标志 | 状态 | 说明 |
|------|------|------|
| `citations` | Phase C | Custom Content document + citations |
| `extendedCacheTtl` | Phase D | 1 小时 cache TTL |
| `thinking` | v1.1 | UI 已暴露，行为待实现 |

---

## 下一步

- [源码树分析](./source-tree-analysis.md)
- [组件清单](./component-inventory.md)
- [数据模型详解](./data-models.md)
