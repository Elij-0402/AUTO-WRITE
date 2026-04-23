# 沉浸式 UI 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过渐进式隐藏工具栏和侧边栏，减少写作时的视觉干扰，实现更沉浸的写作体验。

**Architecture:** 纯 CSS/Tailwind 实现，使用 `group-hover` 和 `hover:` 变体实现过渡效果，无需引入新依赖。工具栏透明度降低，侧边栏收缩至 4px 窄条。

**Tech Stack:** Tailwind CSS 4, React 19, TypeScript strict mode

---

## 文件结构

- Modify: `src/components/editor/editor-toolbar.tsx` — 添加工具栏渐进式隐藏
- Modify: `src/components/workspace/resizable-panel.tsx` — 添加侧边栏窄条模式
- Modify: `src/components/chapter/chapter-sidebar.tsx` — 适配窄条模式下的导航

---

## Task 1: 工具栏渐进式隐藏

**Files:**
- Modify: `src/components/editor/editor-toolbar.tsx:44-99`

- [ ] **Step 1: 修改工具栏容器，添加渐进式隐藏类**

当前代码（第 45 行）：
```tsx
<div className="editor-toolbar flex items-center gap-0.5 divider-hair px-3 py-1.5 surface-1 sticky top-0 z-10">
```

修改为：
```tsx
<div className="editor-toolbar group flex items-center gap-0.5 divider-hair px-3 py-1.5 surface-1 sticky top-0 z-10 opacity-15 hover:opacity-100 transition-opacity duration-300">
```

- [ ] **Step 2: 验证更改**

检查 Tailwind 的 `opacity-15 hover:opacity-100` 组合是否正确应用了透明度和悬停效果。

- [ ] **Step 3: 提交**

```bash
git add src/components/editor/editor-toolbar.tsx
git commit -m "feat(editor): add progressive hide for toolbar on hover"
```

---

## Task 2: 侧边栏窄条模式

**Files:**
- Modify: `src/components/workspace/resizable-panel.tsx:53-142`

- [ ] **Step 1: 修改 ResizablePanelGroup 组件，添加窄条模式**

在 `ResizablePanelGroupProps` 接口中添加新属性：
```tsx
/** Whether to collapse sidebar to a narrow rail (4px) when not hovered */
collapseToRail?: boolean
```

在组件实现中（第 105-141 行的 return 部分），修改 Sidebar Panel 的样式：
```tsx
{/* Sidebar panel per D-01, D-04 */}
<Panel
  id="sidebar"
  panelRef={sidebarPanelRef}
  defaultSize={DEFAULT_SIDEBAR_WIDTH}
  minSize={minSidebarWidth}
  groupResizeBehavior="preserve-pixel-size"
  className={collapseToRail ? 'group relative' : undefined}
>
  <div className={cn(
    'h-full flex flex-col overflow-hidden transition-all duration-300',
    collapseToRail && 'w-1 group-hover:w-full'
  )}>
    {sidebarContent}
  </div>
</Panel>
```

- [ ] **Step 2: 验证更改**

确认 `collapseToRail` 属性存在且默认值为 `false`。

- [ ] **Step 3: 提交**

```bash
git add src/components/workspace/resizable-panel.tsx
git commit -m "feat(workspace): add collapseToRail prop for sidebar narrow mode"
```

---

## Task 3: 章节侧边栏适配窄条模式

**Files:**
- Modify: `src/components/chapter/chapter-sidebar.tsx:146-249`

- [ ] **Step 1: 修改侧边栏容器，添加窄条模式样式**

当前代码（第 147 行）：
```tsx
<div className="flex h-full overflow-hidden surface-1">
```

修改为：
```tsx
<div className="flex h-full overflow-hidden surface-1 group/sidebar">
```

当前代码（第 193 行）的 Tab 内容区：
```tsx
<div className="flex min-w-0 flex-1 flex-col overflow-hidden divider-hair-v animate-slide-in-left" key={activeTab}>
```

修改为：
```tsx
<div className={cn(
  'flex min-w-0 flex-1 flex-col overflow-hidden divider-hair-v animate-slide-in-left transition-all duration-300',
  'group-hover/sidebar:opacity-100 opacity-60'
)} key={activeTab}>
```

- [ ] **Step 2: 验证更改**

确认修改后侧边栏在默认状态下略微透明，悬停时恢复正常。

- [ ] **Step 3: 提交**

```bash
git add src/components/chapter/chapter-sidebar.tsx
git commit -m "feat(sidebar): add subtle opacity transition for immersive writing"
```

---

## Task 4: 集成测试

**Files:**
- Test: `src/components/editor/editor-toolbar.tsx`
- Test: `src/components/workspace/resizable-panel.tsx`
- Test: `src/components/chapter/chapter-sidebar.tsx`

- [ ] **Step 1: 运行现有测试确保无回归**

```bash
pnpm test
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "test: verify immersive UI changes don't break existing tests"
```

---

## 验收标准

- [ ] 工具栏在默认状态下透明度约为 15%
- [ ] 鼠标悬停工具栏时透明度恢复至 100%
- [ ] 侧边栏默认收缩至 4px 窄条（通过 `collapseToRail` 属性控制）
- [ ] 所有过渡动画时长约为 300ms
- [ ] 现有测试全部通过
