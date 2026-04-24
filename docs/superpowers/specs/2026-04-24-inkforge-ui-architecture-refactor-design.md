# InkForge UI 架构重构设计

> **状态:** 初稿
> **日期:** 2026-04-24

## 目标

1. **降低单文件规模** — 消除 400-800 行的大文件，将职责分散到专注的小单元
2. **划清组件边界** — 每个组件/hook 只做一件事，接口清晰
3. **改善可维护性** — 让后续功能迭代和新功能添加更高效

## 当前问题总览

| 问题 | 位置 | 严重程度 |
|------|------|----------|
| AIChatPanel 单文件 774 行，承担 9 个独立职责 | `components/workspace/ai-chat-panel.tsx` | 🔴 严重 |
| use-wizard-mode 绕过 useAIChat，直接调用 streamChat，重复上下文格式化 | `hooks/use-wizard-mode.ts` | 🔴 严重 |
| projects/page.tsx 单文件 497 行，混合布局状态、对话框、快捷键 | `app/projects/[id]/page.tsx` | 🔴 严重 |
| 4 个对话框状态和逻辑散落在 page.tsx | `app/projects/[id]/page.tsx` | 🟠 高 |
| findEntryIdByName 在 ai-chat-panel 和 use-wizard-mode 中重复 | 多处 | 🟡 中 |
| formatEntryForContext 未被复用 | `hooks/use-context-injection.ts` | 🟡 中 |

---

## Phase 1: 提取公共逻辑（无依赖，最安全）

### 1.1 formatEntryForContext 提升为公共模块

```typescript
// src/lib/ai/formatters.ts  (新)
export function formatEntryForContext(entry: WorldEntry): string { ... }
export function formatEntriesForPrompt(entries: WorldEntry[]): string { ... }
```

消除 `ai-chat-panel.tsx` 和 `use-wizard-mode.ts` 中的重复格式化逻辑。

### 1.2 findEntryIdByName 提取到工具函数

```typescript
// src/lib/ai/find-entry-by-name.ts  (新)
export function findEntryIdByName(entries: WorldEntry[], name: string): string | undefined
```

`ai-chat-panel.tsx` 和 `use-wizard-mode.ts` 都引用此函数，不再重复实现。

---

## Phase 2: AIChatPanel 拆分

### 目录结构

```
components/workspace/ai-chat-panel/
├── index.tsx              # 面板入口，仅做状态组合
├── message-list.tsx       # 消息列表渲染 + 空状态
├── suggestions-panel.tsx  # 建议卡片 + 矛盾警告
├── chat-input.tsx         # 输入区 + 模型选择器 + 字数统计
├── wizard-overlay.tsx     # Wizard 模式叠加层（独立状态机）
└── types.ts               # AIChatPanel 内部类型
```

### 各组件职责

**`index.tsx`**（新入口）
- 不直接调用 `streamChat`，仅组合 hooks 和子组件
- 管理流式状态、suggestions、矛盾警告的展示逻辑
- 通过 props 接收 `selectedText`、`wizardModeActive` 等外部状态

**`message-list.tsx`**（从原文件拆分）
- 消息列表渲染
- 滚动到底部 pill
- 空状态

**`suggestions-panel.tsx`**（从原文件拆分）
- 建议卡片列表
- 矛盾警告卡片
- 新建条目快捷按钮

**`chat-input.tsx`**（从原文件拆分）
- 文本输入框
- 模型选择器下拉
- 字数统计
- 发送按钮

**`wizard-overlay.tsx`**（从原文件拆分）
- Wizard 模式叠加层 UI
- 不再内联 JSX，作为独立子组件
- 通过 props 和 callback 与外部通信

**`types.ts`**（新）
- `Message`, `Suggestion`, `Contradiction` 等内部类型
- 组件 props 类型

### Wizard 通信接口

Wizard overlay 通过以下 props 与 panel 主体通信：

```typescript
interface WizardOverlayProps {
  active: boolean
  projectId: string
  onComplete: (content?: string) => void
  onClose: () => void
  // 从 use-wizard-mode 透传的状态
  wizardState: WizardState
  onSelectOption: (option: PlotOption) => void
}
```

---

## Phase 3: Hooks 层重构

### 3.1 use-wizard-mode 复用 useAIChat 底层

```
hooks/use-wizard-mode/
├── index.ts               # 保留，对外接口不变（向后兼容）
└── lib/
    └── format-wizard-context.ts  # 复用 formatEntryForContext
```

**变化:**
- `triggerWizardMode` / `selectOption` 内部逻辑提取到 `use-wizard-ai.ts`
- 不再重复 `extractKeywords/findRelevantEntries`，改为导入 `use-context-injection` 中的工具函数
- `streamChat` 调用改为通过 `useAIChat` 提供的底层方法（不破坏现有接口）

### 3.2 统一 context 格式化

`use-context-injection` 中的 `formatEntryForContext` 提升到 `lib/ai/formatters.ts`，被以下模块共同引用：
- `useAIChat`（消息上下文注入）
- `use-wizard-mode`（Wizard 上下文注入）

---

## Phase 4: 项目页面简化

### 4.1 对话框提取

将 4 个对话框的状态和关联逻辑封装为独立模块：

```
src/components/workspace/
├── dialogs/
│   ├── index.ts                    # 统一导出
│   ├── use-ai-config-dialog.ts     # AIConfigDialog 状态 hook
│   ├── use-ai-onboarding-dialog.ts # AIOnboardingDialog 状态 hook
│   ├── use-onboarding-tour-dialog.ts# OnboardingTourDialog 状态 hook
│   └── use-chapter-draft-dialog.ts  # ChapterDraftDialog 状态 hook
```

**每个 dialog hook 的接口：**
```typescript
// use-ai-onboarding-dialog.ts 示例
export function useAIOnboardingDialog() {
  const [open, setOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  // 内部处理 hasSeenOnboarding localStorage 逻辑
  const onSkip = useCallback(() => { ... }, [])
  const onSaveComplete = useCallback(() => { ... }, [])

  return { open, onSkip, onSaveComplete, tourOpen, setTourOpen }
}
```

page.tsx 不再感知对话框的内部逻辑，只负责渲染。

### 4.2 布局状态提取到独立 Hook

```typescript
// src/lib/hooks/use-workspace-layout.ts  (新)
export function useWorkspaceLayout(projectId: string) {
  // 提取: focusMode, activeChapterId, activeOutlineId, activeWorldEntryId
  // 提取: Tab 切换逻辑 (handleTabChange, handleOutlinePrevious/Next, handleWorldPrevious/Next)
  // 提取: 键盘快捷键处理 (Ctrl+1/2/3, Ctrl+Shift+W)
  // 返回所有布局状态和操作函数
}
```

page.tsx 从 `useWorkspaceLayout` 获取所有布局状态，不再直接管理这些状态。

### 4.3 page.tsx 重构后目标结构

```typescript
export default function ProjectPage() {
  const params = useParams<{ id: string }>()

  // 布局状态（从 hook 获取）
  const layout = useWorkspaceLayout(params.id)
  const { config } = useAIConfig()

  // 对话框状态（从 hook 获取）
  const aiConfigDialog = useAIConfigDialog()
  const onboardingDialog = useAIOnboardingDialog()
  const tourDialog = useOnboardingTourDialog()
  const draftDialog = useChapterDraftDialog({ config, ... })

  return (
    <ThemeProvider>
      <TooltipProvider ...>
        <SidebarNavProvider ...>
          <AIConfigDialog {...aiConfigDialog} />
          <AIOnboardingDialog {...onboardingDialog} />
          <OnboardingTourDialog {...tourDialog} />
          <ChapterDraftDialog {...draftDialog} />
          <WorkspaceTopbar ... />
          {layout.focusMode ? <FocusModeLayout {...layout} /> : <NormalLayout {...layout} />}
        </SidebarNavProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
```

**目标：page.tsx 缩减至 ~120 行**，职责明确为：
1. 获取路由参数
2. 组合所有 layout hooks 和 dialog hooks
3. 根据 focusMode 条件渲染两种布局
4. 渲染所有对话框

### 4.4 布局组件拆分

```
src/components/workspace/
├── layouts/
│   ├── normal-layout.tsx    # 三面板布局（侧边栏 + 编辑器 + AI面板）
│   └── focus-layout.tsx    # 纯净编辑器布局
```

- `NormalLayout` 包含 `Group/Panel/PanelSeparator` 结构，提取自 page.tsx 第 326-393 行
- `FocusLayout` 包含聚焦模式 wrapper，提取自 page.tsx 第 308-324 行
- `EditorWithStatus` 保持不变（已在 page.tsx 独立定义）

---

## Phase 5: 数据库层（不在本设计范围内）

已有单独 spec（`2026-04-23-inkforge-modular-refactor-design.md`）覆盖，Phase 4 不包含 DB 层改动。

---

## 重构顺序

```
Phase 1 (安全基础)
  ├─ 提取 formatEntryForContext → lib/ai/formatters.ts
  └─ 提取 findEntryIdByName → lib/ai/find-entry-by-name.ts

Phase 2 (AIChatPanel 拆分)
  ├─ 新建目录结构
  ├─ 拆分 message-list、suggestions-panel、chat-input
  ├─ 拆分 wizard-overlay
  ├─ 创建 types.ts
  └─ 重构 index.tsx 为组合层

Phase 3 (Hooks 层)
  ├─ 重构 use-wizard-mode，复用 useAIChat 底层
  └─ 统一 context 格式化引用 formatters.ts

Phase 4 (项目页面重构)
  ├─ 提取 4 个 dialog hooks
  ├─ 提取 use-workspace-layout hook
  ├─ 拆分 normal-layout / focus-layout 组件
  └─ 精简 page.tsx 至 ~120 行
```

---

## 测试策略

每个 Phase 完成后：
1. 运行 `pnpm lint` — 确保无新增 lint 错误
2. 运行 `pnpm test` — 确保单元测试通过
3. 手动验证核心功能：
   - AI 对话流（消息发送/接收/建议）
   - Wizard Mode（Ctrl+Shift+W 流程）
   - 项目页面布局切换（focus mode）
   - 对话框打开/关闭流程

---

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| AIChatPanel 拆分时 props 接口变化影响 page.tsx | Phase 2 先完成内部拆分，再调整 page.tsx |
| use-wizard-mode 重构可能影响 Wizard UX | 保留原接口，内部实现逐步替换 |
| page.tsx 改动范围大，容易漏掉状态 | 每个 dialog hook 单独 PR，page.tsx 最后改 |
