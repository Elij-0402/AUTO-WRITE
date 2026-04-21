# InkForge 项目概览

## 项目概述

**InkForge** — AI 小说专业工作台，面向中文网文作者的 AI 写作工具。

**核心定位**：让 AI 真正理解你构建的故事世界。通过世界观百科自动注入上下文，解决现有 AI 写作工具丢失上下文和一致性的核心痛点。

**关键特性**：
- 世界观驱动的 AI 上下文：每次对话自动检索相关角色/地点/规则/时间线
- Anthropic 原生 + Prompt Caching：默认启用 1 小时 cache TTL
- 结构化建议：通过 tool use 发送"新建条目"、"建立关系"、"矛盾预警"卡片
- 语义 RAG 检索：中文指代性查询可命中
- 离线优先，BYOK（自带 API Key），数据完全留在本地

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.2.3 |
| 语言 | TypeScript | strict 模式 |
| UI 框架 | React | 19.2.4 |
| 样式 | Tailwind CSS | v4 |
| 编辑器 | Tiptap (ProseMirror) | 3.22.3 |
| 数据库 | Dexie.js (IndexedDB) | 4.4.2 |
| 云同步 | Supabase | @supabase/ssr 0.10.2 |
| AI SDK | @anthropic-ai/sdk | 0.90.0 |
| 表单验证 | React Hook Form + Zod | 7.72.1 / 4.3.6 |
| 图标 | Lucide React | 1.8.0 |
| 测试 | Vitest + Playwright | 4.1.4 / 1.59.1 |

---

## 架构类型

**单体应用 (Monolith)**

- 单一 Next.js 应用
- 路由：`/` (仪表盘), `/projects/[id]` (工作区), `/auth` (认证)
- 离线优先，本地 IndexedDB 为数据源

---

## 数据库架构

### 两层 IndexedDB 模式

1. **`inkforge-meta`** — 共享元数据库
   - `projectIndex`: 项目列表
   - `aiConfig`: 全局 AI 配置

2. **`inkforge-project-{id}`** — 每个项目独立数据库
   - `chapters`: 章节内容 (Tiptap JSON)
   - `worldEntries`: 世界观条目 (角色/地点/规则/时间线)
   - `relations`: 条目间关系
   - `messages`: AI 对话历史
   - `conversations`: 多线程对话
   - `revisions`: 章节快照
   - `aiUsage`: AI 使用记录
   - `contradictions`: 矛盾记录
   - `layoutSettings`: 布局设置

---

## 路由结构

```
/                           # 项目仪表盘
/auth                       # Supabase 认证
/projects/[id]              # 四面板工作区
/projects/[id]/analysis     # 分析面板 (关系图/时间线)
```

---

## 设计系统

**三更书房 (Study at Third Watch)**
- 主色调：煤黑 `#0E0F11`
- 唯一强调色：朱砂 `#C8553D`
- 字体：LXGW WenKai (楷体标题) + LXGW Neo XiHei (正文)
- 默认主题：深色

---

## 文档链接

- [架构文档](./architecture.md)
- [源码树分析](./source-tree-analysis.md)
- [组件清单](./component-inventory.md)
- [开发指南](./development-guide.md)
- [数据模型](./data-models.md)
- [部署指南](./deployment-guide.md)
