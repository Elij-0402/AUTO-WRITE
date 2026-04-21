# InkForge 项目文档索引

**AI 小说专业工作台** — 面向中文网文作者的 AI 写作工具

---

## 项目概览

| 属性 | 值 |
|------|------|
| **类型** | 单体 Web 应用 |
| **主语言** | TypeScript |
| **架构** | Next.js 16 + React 19 + IndexedDB |
| **项目根目录** | `D:\AUTO-WRITE` |

### 快速参考

- **技术栈**: Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · Tiptap 3 · Dexie.js
- **入口点**: `src/app/page.tsx` → `ProjectDashboard`
- **工作区**: `src/app/projects/[id]/page.tsx` (四面板布局)
- **架构模式**: 离线优先，两层 IndexedDB 隔离

---

## 文档导航

### 核心文档

- [项目概览](./project-overview.md) — 项目概述、功能特性、技术栈
- [架构文档](./architecture.md) — 系统分层、模块职责、数据流
- [源码树分析](./source-tree-analysis.md) — 目录结构、关键文件关联
- [组件清单](./component-inventory.md) — 60+ React 组件分类与说明
- [数据模型](./data-models.md) — IndexedDB Schema、实体定义、索引设计
- [开发指南](./development-guide.md) — 环境设置、开发命令、代码规范
- [部署指南](./deployment-guide.md) — Vercel/Docker 部署、环境变量配置

---

## 技术亮点

### 两层 IndexedDB 隔离

```
inkforge-meta          → 共享元数据 (项目列表、全局AI配置)
inkforge-project-{id} → Per-project 数据库 (章节、世界观、对话等)
```

### AI 上下文注入

- 关键词匹配 + 2000 token 预算
- 优先级: character > location > rule > timeline
- Anthropic Prompt Caching 支持

### 四面板工作区

```
┌──────────────┬─────────────────────┬──────────────┐
│   侧边栏     │      编辑器         │   AI 面板    │
│   (280px)    │      (1fr)          │   (320px)   │
└──────────────┴─────────────────────┴──────────────┘
```

---

## 关键开发命令

```bash
pnpm dev          # 开发服务器 (localhost:3000)
pnpm build        # 生产构建
pnpm lint         # ESLint 检查
pnpm test         # Vitest 单元测试
pnpm test:e2e     # Playwright E2E 测试
```

---

## 设计系统

**三更书房 (Study at Third Watch)**

- 主色调: 煤黑 `#0E0F11`
- 唯一强调色: 朱砂 `#C8553D`
- 字体: LXGW WenKai (楷) · LXGW Neo XiHei (黑)
- 默认主题: **深色**

⚠️ 在进行任何 UI/视觉决策前，务必阅读 [`DESIGN.md`](./DESIGN.md)

---

## 现有文档

项目根目录已有文档：

- [`README.md`](../README.md) — 项目介绍与快速开始
- [`CLAUDE.md`](../CLAUDE.md) — Claude Code 开发指导
- [`DESIGN.md`](../DESIGN.md) — 设计系统规范
- [`AGENTS.md`](../AGENTS.md) — AI Agent 开发规范
- [`CHANGELOG.md`](../CHANGELOG.md) — 版本变更记录

---

## 数据库 Schema

| 表 | 说明 |
|------|------|
| `projectIndex` | 项目列表 |
| `chapters` | 章节内容 (Tiptap JSON) |
| `worldEntries` | 世界观条目 (4种类型) |
| `relations` | 条目间关系 |
| `messages` | AI 对话历史 |
| `conversations` | 多线程对话 |
| `revisions` | 章节快照 (最多50条) |
| `aiUsage` | AI 使用记录 |
| `contradictions` | 矛盾记录 |
| `layoutSettings` | 布局设置 |

---

## API Providers

| Provider | 状态 | 说明 |
|----------|------|------|
| Anthropic | ✅ 支持 | 原生 tool use、Prompt Caching |
| OpenAI Compatible | ✅ 支持 | DeepSeek、SiliconFlow、本地 LiteLLM |

---

*最后更新: 2026-04-21*
