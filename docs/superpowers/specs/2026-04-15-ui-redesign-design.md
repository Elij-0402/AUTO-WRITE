# InkForge UI 重设计

## 概述

全面重设计 InkForge 的 UI/UX，从当前的粗糙 zinc 灰色工具风格升级为现代简约、暖色调、宽松呼吸式的写作工作台。涵盖所有页面：登录页、项目仪表盘、写作工作区。

## 设计决策

- **视觉风格**：现代简约，浅色清新（方案 B）
- **强调色**：蓝色系（blue-500 / blue-400）
- **仪表盘布局**：侧边导航 + 卡片网格（方案 A）
- **工作区布局**：宽松呼吸式（方案 B）
- **登录页**：左右分栏式

---

## 1. 设计系统基础

### 1.1 配色方案

从 zinc 色系迁移到 stone（暖灰），避免冰冷工具感。

| 用途 | 浅色模式 | 深色模式 |
|------|---------|---------|
| 页面背景 | `#fafaf9` (stone-50) | `#0c0a09` (stone-950) |
| 卡片/面板 | `#ffffff` | `#1c1917` (stone-900) |
| 文本主色 | `#1c1917` (stone-900) | `#fafaf9` (stone-50) |
| 文本次色 | `#78716c` (stone-500) | `#a8a29e` (stone-400) |
| 边框 | `#e7e5e4` (stone-200) | `#292524` (stone-800) |
| 强调色 | `#3b82f6` (blue-500) | `#60a5fa` (blue-400) |
| 强调悬停 | `#2563eb` (blue-600) | `#3b82f6` (blue-500) |
| 强调浅底 | `#eff6ff` (blue-50) | `#1e3a5f` |
| 危险色 | `#ef4444` (red-500) | `#f87171` (red-400) |
| 成功色 | `#22c55e` (green-500) | `#4ade80` (green-400) |

### 1.2 排版

- 正文：Noto Sans SC, 16px, line-height 2.0（从 1.75 增大）
- 标题：Noto Sans SC Bold
- 编辑器内容最大宽度：640px 居中
- 圆角：小元素 8px，卡片/面板 12px，按钮 8px

### 1.3 间距

- 面板间分隔：1px border
- 面板内 padding：12-16px
- 编辑器 padding：28px 40px
- 侧栏列表项：2px gap, 8-10px padding

---

## 2. 登录/注册页

**文件**: `src/app/auth/page.tsx`

### 布局

- 左右分栏，各 50%
- **左侧品牌展示区**：蓝色渐变背景（`#3b82f6` → `#1d4ed8`），InkForge logo + 品牌标语「AI 驱动的小说创作工作台」
- **右侧表单区**：白色背景，垂直居中
  - 登录/注册 tab 切换，蓝色下划线指示器
  - 输入框：stone 边框，12px 圆角，聚焦蓝色环
  - 按钮：蓝色实填，全宽，12px 圆角
  - 忘记密码：蓝色文字右对齐

### 改动

- 从 `bg-gray-50` 居中卡片 → 左右分栏
- 从 `border-gray-300 rounded-md` → stone + `rounded-xl`
- 从 `bg-blue-600 rounded-md` → 统一设计系统蓝色 + `rounded-lg`

---

## 3. 项目仪表盘

**文件**: `src/app/page.tsx`, `src/components/project/project-dashboard.tsx`, `src/components/project/project-card.tsx`, `src/components/project/empty-dashboard.tsx`

### 布局

- **左侧导航栏**：固定 240px，白色背景
  - InkForge logo（蓝色渐变小方块 + 文字）
  - 导航项：「我的作品」「最近编辑」「回收站」
  - 选中态：蓝色浅底 + 蓝色文字
  - 底部：用户头像/账户 + 设置
- **右侧主区域**：stone-50 背景
  - 标题 + 蓝色「+ 新建项目」按钮
  - 项目卡片 responsive grid（2-4 列），12px gap

### 项目卡片

- 12px 圆角，白色背景，shadow `0 1px 3px rgba(0,0,0,0.05)`
- 渐变色条 80px 高（保留 ID 哈希算法，改为柔和淡色）
- 标题 14px semibold，单行截断
- 类型标签 badge（stone-100 背景药丸形）
- 底部：字数 + 相对时间（stone-500）
- hover：shadow 加深 + `translateY(-2px)`，200ms 过渡
- 三点菜单：hover 显示，白色半透明圆形

---

## 4. 写作工作区

**文件**: `src/app/projects/[id]/page.tsx`, `src/components/chapter/chapter-sidebar.tsx`, `src/components/chapter/chapter-row.tsx`, `src/components/editor/editor.tsx`, `src/components/editor/editor-toolbar.tsx`, `src/components/editor/editor.css`, `src/components/workspace/ai-chat-panel.tsx`, `src/components/workspace/message-bubble.tsx`

### 4.1 顶栏

- 48px 高，白色背景，1px stone-200 底边框
- 左：InkForge 小 logo + 项目名 + 类型 badge
- 右：保存状态、同步状态、AI 设置、聚焦模式、主题切换
- 按钮：lucide 图标，26x26，stone-100 圆角背景

### 4.2 左侧栏

- 默认 240px（从 280px 收窄）
- Tab 栏：三 tab 等宽，2px 蓝色下划线指示选中
- 章节列表项：
  - 选中态：`#eff6ff` 背景 + 左 3px 蓝色边条
  - hover：stone-50
  - 字数选中蓝色，未选中 stone-400
  - 拖拽手柄/菜单 hover 淡入
- 新建章节：底部固定，蓝色虚线 + 浅蓝底

### 4.3 编辑器

- 工具栏：padding 8px 16px，按钮 stone-100 圆角，右侧字数统计
- 编辑区：padding 28px 40px，max-width 640px 居中，行高 2.0
- 底部状态栏移除，整合到工具栏

### 4.4 AI 聊天面板

- 默认 300px
- 标题栏：「AI 助手」+ 绿色连接状态 badge
- 用户消息：蓝色背景白字，圆角 `12 12 4 12`
- AI 消息：白色 shadow，圆角 `12 12 12 4`
- 草稿采纳：蓝色浅底卡片内嵌
- 输入框：stone 边框 10px 圆角；发送按钮蓝色 10px 圆角 32x32

### 4.5 面板分隔

- 1px stone-200 线，hover 浅蓝指示
- 去掉强烈蓝色拖拽反馈，改为柔和蓝色

---

## 5. 组件系统

### Button (`src/components/ui/button.tsx`)

- primary: `bg-blue-500 hover:bg-blue-600 text-white`，8px 圆角
- secondary: `bg-stone-100 hover:bg-stone-200 text-stone-900`
- danger: `bg-red-500 hover:bg-red-600 text-white`
- ghost: `hover:bg-stone-100 text-stone-600`
- 全部加 `transition-all duration-150`

### Dialog (`src/components/ui/dialog.tsx`)

- 遮罩：`bg-black/40 backdrop-blur-sm`
- 对话框：白色，12px 圆角，大 shadow
- 标题 16px semibold

### Input / Textarea (`src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`)

- 边框：stone-300，圆角 10px
- 聚焦：`ring-2 ring-blue-500/20 border-blue-500`
- placeholder：stone-400

### 全局 CSS (`src/app/globals.css`)

- `--background`: `#ffffff` → `#fafaf9`；dark `#0a0a0a` → `#0c0a09`
- line-height: 1.8 保持

### Editor CSS (`src/components/editor/editor.css`)

- tiptap 行高 1.75 → 2.0
- selection 颜色改为蓝色系
- 暗色背景 `#000` → `#0c0a09`

---

## 6. 动画与过渡

- 卡片 hover：`transition-all duration-200`，`hover:shadow-md hover:-translate-y-0.5`
- 按钮：`transition-colors duration-150`
- Tab 切换：无动画（即时切换）
- Dialog：fade + scale，200ms
- 暗色模式：所有 zinc → stone 对应值

---

## 7. 不在此次范围

- 移动端响应式优化（保持桌面优先）
- 全新功能页面（仅重设计现有页面）
- 字体文件替换（继续用 Noto Sans SC）
- 图标库替换（继续用 lucide-react）

---

## 验证方式

1. `npm run dev` 启动开发服务器
2. 检查登录页：左右分栏，品牌区渐变，表单区干净
3. 检查仪表盘：侧边导航 + 卡片网格，hover 动画
4. 检查工作区：宽松布局，编辑器行距，AI 聊天气泡样式
5. 切换暗色模式：所有页面颜色正确
6. 测试面板拖拽调整大小
7. `npm run build` 确保无构建错误
