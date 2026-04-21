# InkForge 源码树分析

## 项目结构

```
D:\AUTO-WRITE\
├── src/
│   ├── app/                      # Next.js App Router 页面
│   │   ├── layout.tsx            # Root layout (字体/主题初始化)
│   │   ├── page.tsx              # 首页 → ProjectDashboard
│   │   ├── auth/                 # 认证相关
│   │   ├── (authenticated)/       # 受保护路由组
│   │   └── projects/[id]/         # 项目工作区
│   ├── components/               # React 组件
│   │   ├── ui/                    # 基础 UI 组件 (Radix-based)
│   │   ├── editor/                # Tiptap 编辑器组件
│   │   ├── chapter/               # 章节管理组件
│   │   ├── world-bible/           # 世界观百科组件
│   │   ├── outline/               # 大纲组件
│   │   ├── workspace/             # 工作区组件 (AI面板/配置等)
│   │   ├── project/               # 项目仪表盘组件
│   │   ├── sync/                  # 同步状态组件
│   │   ├── analysis/              # 分析面板组件
│   │   └── auth/                  # 认证组件
│   └── lib/                       # 业务逻辑核心
│       ├── db/                    # Dexie 数据库层
│       ├── hooks/                 # React Hooks
│       ├── ai/                    # AI 层
│       │   ├── providers/         # AI Provider 实现
│       │   └── tools/             # AI Tools schemas
│       ├── sync/                  # Supabase 同步引擎
│       ├── export/                # 导出功能 (EPUB/DOCX/Markdown)
│       ├── analysis/              # 内容分析
│       ├── supabase/             # Supabase 客户端
│       └── types/                # TypeScript 类型定义
├── docs/                          # 项目文档 (当前目录)
├── _bmad/                         # BMAD 配置
├── _bmad-output/                  # BMAD 输出
├── public/                        # 静态资源
└── tests/                        # E2E 测试配置
```

---

## 关键目录详解

### `src/app/` — Next.js App Router

| 路径 | 类型 | 说明 |
|------|------|------|
| `layout.tsx` | 文件 | 全局布局：字体加载(LXGW/Noto/JetBrains)、主题初始化脚本 |
| `page.tsx` | 文件 | 首页，重定向到 ProjectDashboard |
| `auth/` | 目录 | Supabase 认证页面和 actions |
| `(authenticated)/` | 路由组 | 受保护页面，需要登录 |
| `projects/[id]/` | 动态路由 | 项目工作区 |

### `src/components/` — React 组件

#### `ui/` — 基础 UI 组件
基于 Radix UI + Tailwind CSS：
- `button.tsx`, `input.tsx`, `textarea.tsx`
- `dialog.tsx`, `sheet.tsx` (overlay)
- `dropdown-menu.tsx`, `select.tsx`, `popover.tsx`
- `badge.tsx`, `avatar.tsx`, `tooltip.tsx`
- `label.tsx`, `separator.tsx`, `scroll-area.tsx`
- `accordion.tsx`, `card.tsx`

#### `editor/` — Tiptap 编辑器
| 组件 | 说明 |
|------|------|
| `editor.tsx` | 核心 Tiptap 编辑器 |
| `floating-toolbar.tsx` | 浮动格式工具栏 |
| `editor-toolbar.tsx` | 固定工具栏 |
| `history-drawer.tsx` | 版本历史抽屉 |
| `chapter-meta-strip.tsx` | 章节元信息条 |
| `theme-provider.tsx` | 主题 Provider |

#### `chapter/` — 章节管理
| 组件 | 说明 |
|------|------|
| `chapter-sidebar.tsx` | 章节列表侧边栏 |
| `chapter-row.tsx` | 章节行组件 |
| `create-chapter-input.tsx` | 创建章节输入 |
| `delete-chapter-dialog.tsx` | 删除确认对话框 |
| `chapter-context-menu.tsx` | 章节右键菜单 |

#### `world-bible/` — 世界观百科
| 组件 | 说明 |
|------|------|
| `world-entry-edit-form.tsx` | 条目编辑表单 |
| `world-bible-tab.tsx` | 世界观标签页 |
| `create-entry-input.tsx` | 创建条目输入 |
| `delete-entry-dialog.tsx` | 删除条目对话框 |
| `duplicate-entry-dialog.tsx` | 复制条目对话框 |
| `relationship-section.tsx` | 关系编辑区 |
| `tag-input.tsx` | 标签输入组件 |

#### `outline/` — 大纲
| 组件 | 说明 |
|------|------|
| `outline-tab.tsx` | 大纲标签页 |
| `outline-edit-form.tsx` | 大纲编辑表单 |

#### `workspace/` — 工作区
| 组件 | 说明 |
|------|------|
| `ai-chat-panel.tsx` | AI 对话面板 |
| `ai-config-dialog.tsx` | AI 配置对话框 |
| `suggestion-card.tsx` | 建议卡片 |
| `draft-card.tsx` | 草稿卡片 |
| `consistency-warning-card.tsx` | 矛盾警告卡片 |
| `workspace-topbar.tsx` | 工作区顶栏 |
| `resizable-panel.tsx` | 可调整面板 |
| `error-boundary.tsx` | 错误边界 |
| `conversation-drawer.tsx` | 对话历史抽屉 |
| `onboarding-tour-dialog.tsx` | 引导弹窗 |
| `message-bubble.tsx` | 消息气泡 |

#### `project/` — 项目仪表盘
| 组件 | 说明 |
|------|------|
| `project-dashboard.tsx` | 项目列表仪表盘 |
| `project-card.tsx` | 项目卡片 |
| `create-project-modal.tsx` | 创建项目弹窗 |
| `project-settings-dialog.tsx` | 项目设置 |
| `project-settings-form.tsx` | 项目设置表单 |
| `empty-dashboard.tsx` | 空状态 |

#### `sync/` — 同步状态
| 组件 | 说明 |
|------|------|
| `sync-manager.tsx` | 同步管理器 |
| `sync-progress.tsx` | 同步进度 |
| `sync-status-icon.tsx` | 同步状态图标 |

#### `analysis/` — 分析面板
| 组件 | 说明 |
|------|------|
| `relation-graph.tsx` | 力导向关系图 |
| `timeline-view.tsx` | 事件时间线 |
| `contradiction-dashboard.tsx` | 矛盾仪表盘 |

#### `auth/` — 认证
| 组件 | 说明 |
|------|------|
| `auth-status.tsx` | 认证状态 |
| `auth-dropdown.tsx` | 认证下拉菜单 |

---

### `src/lib/` — 业务逻辑核心

#### `db/` — 数据库层
| 文件 | 说明 |
|------|------|
| `meta-db.ts` | 共享元数据库 (inkforge-meta) |
| `project-db.ts` | Per-project 数据库工厂 + Schema v1-15 |
| `index.ts` | 导出入口 |
| `chapter-queries.ts` | 章节 CRUD |
| `world-entry-queries.ts` | 世界观条目 CRUD |
| `relation-queries.ts` | 关系 CRUD |
| `revisions.ts` | 快照管理 |
| `*.test.ts` | 单元测试 |

#### `hooks/` — React Hooks
| Hook | 说明 |
|------|------|
| `use-chapters.ts` | 章节状态 |
| `use-world-entries.ts` | 世界观条目 |
| `use-relations.ts` | 关系 |
| `use-all-relations.ts` | 所有关系 (跨类型) |
| `use-ai-chat.ts` | AI 对话核心 |
| `use-ai-config.ts` | AI 配置 |
| `use-context-injection.ts` | 上下文注入 |
| `use-conversations.ts` | 对话列表 |
| `use-autosave.ts` | 自动保存 |
| `use-chapter-editor.ts` | 章节编辑器状态 |
| `use-layout.ts` | 布局设置 |
| `use-projects.ts` | 项目列表 |
| `use-revisions.ts` | 快照历史 |
| `use-consistency-exemptions.ts` | 矛盾豁免 |
| `use-contradictions.ts` | 矛盾记录 |
| `use-sync.ts` | 同步状态 |
| `use-auth.ts` | 认证状态 |
| `use-word-count.ts` | 字数统计 |
| `use-idle-mode.ts` | 空闲模式 |
| `use-dismissed-suggestions.ts` | 已拒绝建议 |
| `use-sidebar-nav.ts` | 侧边导航状态 |
| `use-chat-telemetry.ts` | 对话遥测 |

#### `ai/` — AI 层
| 文件 | 说明 |
|------|------|
| `client.ts` | Provider-agnostic AI 客户端 |
| `prompts.ts` | 提示词构建 |
| `suggestion-parser.ts` | 建议解析 |
| `summarize.ts` | 对话摘要 |
| `events.ts` | AI 事件类型 |
| `ui-flags.ts` | UI 实验标志 |
| `providers/anthropic.ts` | Anthropic Provider |
| `providers/openai-compatible.ts` | OpenAI 兼容 Provider |
| `providers/types.ts` | Provider 类型定义 |
| `tools/schemas.ts` | Tool Use Schemas |

#### `sync/` — 同步引擎
| 文件 | 说明 |
|------|------|
| `sync-engine.ts` | 同步引擎 |
| `sync-queue.ts` | 离线队列 |
| `field-mapping.ts` | 字段映射 |
| `*.test.ts` | 单元测试 |

#### `export/` — 导出功能
| 文件 | 说明 |
|------|------|
| `epub-export.ts` | EPUB 导出 |
| `docx-export.ts` | DOCX 导出 |
| `markdown-export.ts` | Markdown 导出 |
| `prosemirror-markdown.ts` | ProseMirror ↔ Markdown 转换 |

#### `analysis/` — 内容分析
| 文件 | 说明 |
|------|------|
| `content-hash.ts` | 内容哈希 |
| `force-layout.ts` | 力导向布局算法 |

#### `supabase/` — Supabase 客户端
| 文件 | 说明 |
|------|------|
| `client.ts` | 浏览器端客户端 |
| `server.ts` | 服务端客户端 |
| `middleware.ts` | Next.js 中间件 |

#### `types/` — 类型定义
| 文件 | 说明 |
|------|------|
| `project.ts` | ProjectMeta 类型 |
| `chapter.ts` | Chapter 类型 |
| `world-entry.ts` | WorldEntry 类型 |
| `relation.ts` | Relation 类型 |
| `index.ts` | 统一导出 |

---

## 入口点

| 入口 | 说明 |
|------|------|
| `src/app/layout.tsx` | Next.js 根布局 |
| `src/app/page.tsx` | 首页路由 → Dashboard |
| `src/app/projects/[id]/page.tsx` | 项目工作区 |
| `src/components/editor/editor.tsx` | Tiptap 编辑器入口 |

---

## 关键文件关联

```
use-ai-chat.ts
  ├── use-ai-config.ts
  ├── use-world-entries.ts
  ├── use-context-injection.ts
  ├── streamChat() from ai/client.ts
  │     ├── streamAnthropic() from ai/providers/anthropic.ts
  │     └── streamOpenAICompatible() from ai/providers/openai-compatible.ts
  └── buildSegmentedSystemPrompt() from ai/prompts.ts

use-chapter-editor.ts
  └── use-autosave.ts

ProjectPage (projects/[id]/page.tsx)
  ├── useLayout()
  ├── useChapters()
  ├── useWorldEntries()
  ├── useAIConfig()
  ├── ChapterSidebar
  ├── Editor
  ├── AIChatPanel
  └── WorkspaceTopbar
```

---

## 下一文档

- [组件清单](./component-inventory.md)
- [数据模型](./data-models.md)
- [开发指南](./development-guide.md)
