# InkForge 组件清单

## 概览

InkForge 共有 **60+** React 组件，基于 Radix UI + Tailwind CSS 构建。

---

## 组件分类

### 1. 基础 UI 组件 (`src/components/ui/`)

基于 Radix UI 的无头组件库：

| 组件 | 基础 | 说明 |
|------|------|------|
| `button.tsx` | Radix Slot | 多变体按钮 |
| `input.tsx` | native input | 文本输入 |
| `textarea.tsx` | native textarea | 多行输入 |
| `dialog.tsx` | @radix-ui/react-dialog | 模态对话框 |
| `sheet.tsx` | @radix-ui/react-dialog | 侧边抽屉 |
| `dropdown-menu.tsx` | @radix-ui/react-dropdown-menu | 下拉菜单 |
| `select.tsx` | @radix-ui/react-select | 选择器 |
| `popover.tsx` | @radix-ui/react-popover | 弹出框 |
| `label.tsx` | native label | 标签 |
| `badge.tsx` | - | 徽章/标签 |
| `avatar.tsx` | @radix-ui/react-avatar | 头像 |
| `tooltip.tsx` | @radix-ui/react-tooltip | 工具提示 |
| `separator.tsx` | @radix-ui/react-separator | 分隔线 |
| `scroll-area.tsx` | @radix-ui/react-scroll-area | 滚动区域 |
| `accordion.tsx` | @radix-ui/react-accordion | 手风琴 |
| `card.tsx` | - | 卡片容器 |

### 2. 编辑器组件 (`src/components/editor/`)

| 组件 | 说明 |
|------|------|
| `editor.tsx` | **核心 Tiptap 编辑器**，基于 ProseMirror |
| `floating-toolbar.tsx` | 选中文本时显示的浮动工具栏 |
| `editor-toolbar.tsx` | 固定在编辑器顶部的工具栏 |
| `history-drawer.tsx` | 版本历史抽屉，支持快照恢复 |
| `chapter-meta-strip.tsx` | 显示章节号、字数、状态 |
| `theme-provider.tsx` | 深色/浅色主题 Provider |
| `format-distance.ts` | 格式化时间距离 |

### 3. 章节管理 (`src/components/chapter/`)

| 组件 | 说明 |
|------|------|
| `chapter-sidebar.tsx` | 章节列表侧边栏容器 |
| `chapter-row.tsx` | 单个章节行，支持拖拽排序 |
| `create-chapter-input.tsx` | 新建章节输入框 |
| `delete-chapter-dialog.tsx` | 删除章节确认对话框 |
| `chapter-context-menu.tsx` | 章节右键菜单 |

### 4. 世界观百科 (`src/components/world-bible/`)

| 组件 | 说明 |
|------|------|
| `world-entry-edit-form.tsx` | **条目编辑表单**，支持 4 种类型 |
| `world-bible-tab.tsx` | 世界观标签页容器 |
| `create-entry-input.tsx` | 新建条目输入框 |
| `delete-entry-dialog.tsx` | 删除条目确认 |
| `duplicate-entry-dialog.tsx` | 复制条目对话框 |
| `relationship-section.tsx` | 关系编辑区域 |
| `tag-input.tsx` | 标签输入组件 |

**WorldEntry 类型：**
- `character` — 角色 (别名/外貌/性格/背景)
- `location` — 地点 (描述/特征)
- `rule` — 规则 (内容/适用范围)
- `timeline` — 时间线 (时间点/事件描述)

### 5. 大纲 (`src/components/outline/`)

| 组件 | 说明 |
|------|------|
| `outline-tab.tsx` | 大纲标签页容器 |
| `outline-edit-form.tsx` | 大纲编辑表单 |

### 6. 工作区 (`src/components/workspace/`)

| 组件 | 说明 |
|------|------|
| `ai-chat-panel.tsx` | **AI 对话面板**，支持流式输出 |
| `ai-config-dialog.tsx` | AI 配置对话框 (API Key/Provider) |
| `suggestion-card.tsx` | AI 建议卡片 (新建条目/关系) |
| `draft-card.tsx` | AI 草稿卡片，支持插入正文 |
| `consistency-warning-card.tsx` | 矛盾警告卡片 |
| `workspace-topbar.tsx` | 工作区顶栏 |
| `resizable-panel.tsx` | `react-resizable-panels` 封装 |
| `error-boundary.tsx` | 组件错误边界 |
| `conversation-drawer.tsx` | 历史对话抽屉 |
| `onboarding-tour-dialog.tsx` | 新用户引导 |
| `message-bubble.tsx` | 消息气泡组件 |
| `citation-chip.tsx` | 引用溯源标签 |
| `cache-hint.tsx` | Cache TTL 节省提示 |

### 7. 项目仪表盘 (`src/components/project/`)

| 组件 | 说明 |
|------|------|
| `project-dashboard.tsx` | **项目列表仪表盘** |
| `project-card.tsx` | 项目卡片 |
| `create-project-modal.tsx` | 创建项目弹窗 |
| `project-settings-dialog.tsx` | 项目设置对话框 |
| `project-settings-form.tsx` | 项目设置表单 |
| `empty-dashboard.tsx` | 空状态提示 |

### 8. 同步 (`src/components/sync/`)

| 组件 | 说明 |
|------|------|
| `sync-manager.tsx` | 同步管理器组件 |
| `sync-progress.tsx` | 同步进度条 |
| `sync-status-icon.tsx` | 同步状态图标 |

### 9. 分析 (`src/components/analysis/`)

| 组件 | 说明 |
|------|------|
| `relation-graph.tsx` | **力导向关系图** |
| `timeline-view.tsx` | 事件时间线视图 |
| `contradiction-dashboard.tsx` | 矛盾仪表盘 |

### 10. 认证 (`src/components/auth/`)

| 组件 | 说明 |
|------|------|
| `auth-status.tsx` | 认证状态显示 |
| `auth-dropdown.tsx` | 认证下拉菜单 |

---

## 组件设计模式

### 1. 变体组件 (CVA)

使用 `class-variance-authority` 实现变体：

```tsx
// button.tsx
const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn--primary",
      ghost: "btn--ghost",
      danger: "btn--danger",
    },
    size: { sm: "btn--sm", md: "btn--md" }
  }
})
```

### 2. 插槽组合 (Radix Slot)

使用 `@radix-ui/react-slot` 实现组件 composition：

```tsx
<Slot className={className}>
  {children}
</Slot>
```

### 3. 错误边界

每个面板区域都有独立的 `PanelErrorBoundary`：

```tsx
<PanelErrorBoundary label="编辑器">
  <Editor />
</PanelErrorBoundary>
```

### 4. Resizable Panels

使用 `react-resizable-panels` 实现可拖拽调整大小的面板：

```tsx
<Group orientation="horizontal">
  <Panel id="sidebar" defaultSize={280} minSize={200} maxSize={400}>
    <ChapterSidebar />
  </Panel>
  <PanelSeparator />
  <Panel id="editor" minSize={500}>
    <Editor />
  </Panel>
</Group>
```

---

## 主题与样式

### CSS 变量 (Tailwind)

```css
/* 表面色 */
--surface-0: #0E0F11    /* App 背景 */
--surface-1: #161719    /* 侧边栏 */
--surface-2: #1E1F22    /* 卡片 */
--surface-3: #26272B    /* Hover */

/* 文本 */
--foreground: #EDE7DC   /* 正文 */
--muted: #8A857D       /* 次要 */
--faint: #575249       /* 占位 */

/* 强调色 */
--accent: #C8553D      /* 朱砂 - 唯一彩色 */
```

### 字体

| 用途 | 字体 |
|------|------|
| 章节标题 | LXGW WenKai (霞鹜文楷) |
| 编辑器正文 | LXGW Neo XiHei (霞鹜新晰黑) |
| UI 标签 | Noto Sans SC |
| 数字显示 | Instrument Serif italic |
| 代码 | JetBrains Mono |

---

## 下一文档

- [数据模型](./data-models.md)
- [开发指南](./development-guide.md)
- [部署指南](./deployment-guide.md)
