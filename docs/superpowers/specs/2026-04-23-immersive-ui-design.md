# 沉浸式 UI 设计方案

**日期：** 2026-04-23
**类型：** 前端交互优化
**状态：** 已批准

---

## 1. 目标

减少写作时的视觉干扰，通过渐进式隐藏工具栏和侧边栏，让作者更专注于内容创作。

---

## 2. 核心交互

### 工具栏（EditorToolbar）

| 状态 | 透明度 | 触发条件 |
|------|--------|----------|
| 隐藏 | opacity: 0.15 | 默认写作状态 |
| 显示 | opacity: 1 | 鼠标悬停工具栏区域 |

- 过渡时长：300ms ease-out
- 触发区：工具栏本身 + 下方 20px 缓冲区

### 侧边栏（Sidebar）

| 状态 | 宽度 | 触发条件 |
|------|------|----------|
| 隐藏 | 4px 窄条 | 默认写作状态 |
| 显示 | 正常宽度（可配置） | 鼠标悬停窄条 |

- 过渡时长：300ms ease-out
- 窄条颜色：与背景略区分，可见但不起眼

---

## 3. 技术方案

### 实现方式

**纯 CSS + Tailwind 变体**

使用 Tailwind 的 `group-hover` 和 `hover:` 变体实现，无需引入新依赖：

```tsx
// 工具栏
<div className="opacity-15 hover:opacity-100 transition-opacity duration-300">
  {/* toolbar content */}
</div>

// 侧边栏
<div className="w-1 hover:w-64 transition-all duration-300">
  {/* sidebar content */}
</div>
```

### 关键文件

- `src/components/editor/editor-toolbar.tsx` — 工具栏组件
- `src/components/workspace/resizable-panel.tsx` — 可折叠面板
- `src/components/chapter/chapter-sidebar.tsx` — 章节侧边栏
- `src/components/outline/outline-tab.tsx` — 大纲标签页
- `src/components/world-bible/world-bible-tab.tsx` — 世界百科标签页

### 行为细节

1. **工具栏隐藏时仍可交互**：opacity 降低但 `pointer-events` 保留
2. **侧边栏窄条提供视觉提示**：hover 时展开，不遮挡内容
3. **响应式支持**：移动端保持侧边栏默认展开
4. **可配置性**：通过 LayoutSettings 存储用户偏好

---

## 4. 用户体验

### 优势

- 无学习成本，自然的交互习惯
- 鼠标悬停即可快速访问
- 过渡平滑，不突兀
- 不影响键盘快捷键操作

### 注意事项

- 无障碍支持：确保屏幕阅读器仍能正常访问
- 移动端适配：触摸设备默认不启用此行为
- 冲突避免：与现有快捷键不冲突

---

## 5. 实现步骤

1. 修改 `editor-toolbar.tsx` 添加渐进式隐藏
2. 修改 `resizable-panel.tsx` 添加窄条模式
3. 确保章节、大纲、世界百科标签页在窄条模式下正确折叠
4. 添加用户偏好设置（可选）

---

## 6. 验收标准

- [ ] 工具栏在默认状态下透明度约为 15%
- [ ] 鼠标悬停工具栏时透明度恢复至 100%
- [ ] 侧边栏默认收缩至 4px 窄条
- [ ] 鼠标悬停窄条时侧边栏展开
- [ ] 所有过渡动画时长约为 300ms
- [ ] 移动端保持侧边栏默认展开
