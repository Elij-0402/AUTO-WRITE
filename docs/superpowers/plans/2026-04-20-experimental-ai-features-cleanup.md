# 实验性 AI 特性清理与强化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除未实现的 thinking stub，限制评分 UI 只在有 citations 时显示，确保实验性 AI 特性体验改进完成。

**Architecture:** 最小改动原则：从 providerCapabilities 移除 thinking 返回，调整 MessageBubble 的 StarRating 显示条件，保持现有数据结构兼容性。

**Tech Stack:** TypeScript, React, Tailwind CSS, Dexie.js

---

## 代码审查结论

经过全面代码审查，发现以下状态：

| 功能 | 当前状态 | 需要改动 |
|------|----------|----------|
| **Thinking stub** | `FLAG_LABELS` 已移除 thinking，UI 不显示；但 `providerCapabilities` 仍返回 `thinking: true` | ✅ 需要清理 |
| **Citations 分析面板** | 已完整实现 (`citations-analytics-panel.tsx`) | ❌ 无需改动 |
| **Cache 节省提示** | 已完整实现 (`use-ai-chat.ts` + `ai-chat-panel.tsx`) | ❌ 无需改动 |
| **作者评分 UI** | 已实现但始终显示，需要限制为只在 citations 开启且有引用时显示 | ✅ 需要调整 |

---

### Task 1: 从 providerCapabilities 移除 thinking

**Files:**
- Modify: `src/lib/ai/experiment-flags.ts:38-42`

- [ ] **Step 1: 修改 providerCapabilities 移除 thinking**

```typescript
// 修改前 (第38-42行):
export function providerCapabilities(provider: AIProvider | undefined): ExperimentFlagCapabilities {
  if (provider === 'anthropic') {
    return { citations: true, extendedCacheTtl: true, thinking: true }
  }
  return { citations: false, extendedCacheTtl: false, thinking: false }
}

// 修改后:
export function providerCapabilities(provider: AIProvider | undefined): ExperimentFlagCapabilities {
  if (provider === 'anthropic') {
    return { citations: true, extendedCacheTtl: true, thinking: false }
  }
  return { citations: false, extendedCacheTtl: false, thinking: false }
}
```

**Rationale:** `thinking` 功能当前是 stub 无实际实现。将其 capability 设为 `false` 确保任何地方的检查都认为此功能不可用。保留接口定义以保证数据兼容性。

- [ ] **Step 2: 验证改动**

Run: `npx vitest run src/lib/ai/experiment-flags.test.ts -v`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/experiment-flags.ts
git commit -m "fix: disable thinking capability in providerCapabilities (stub removal)"
```

---

### Task 2: 限制 StarRating 只在有 citations 时显示

**Files:**
- Modify: `src/components/workspace/message-bubble.tsx:151`

- [ ] **Step 1: 修改 StarRating 显示条件**

```tsx
// 修改前 (第151行):
<StarRating messageId={message.id} projectId={projectId} />

// 修改后:
{useCitations && message.citations && message.citations.length > 0 && (
  <StarRating messageId={message.id} projectId={projectId} />
)}
```

**Rationale:** 设计文档要求评分只在 `role='assistant'` 且 `useCitations=true` 且 `message.citations.length > 0` 时显示。这样只收集有实际引用价值的消息的反馈。

- [ ] **Step 2: 更新测试期望**

File: `src/components/workspace/message-bubble.test.tsx`

添加一个测试用例验证无 citations 时不显示评分：

```typescript
it('does not render star rating when useCitations is false', () => {
  const assistantMsg = {
    id: 'msg1',
    projectId: 'p1',
    conversationId: 'c1',
    role: 'assistant' as const,
    content: 'Test response',
    timestamp: Date.now(),
  }

  const wrapper = makeWrapper({ activeTab: 'chapters', selectedEntryId: null })

  render(
    <MessageBubble
      message={assistantMsg}
      projectId="p1"
      useCitations={false}
    />,
    { wrapper }
  )

  const stars = screen.queryAllByRole('button').filter(btn => btn.getAttribute('aria-label')?.includes('星'))
  expect(stars.length).toBe(0)
})
```

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run src/components/workspace/message-bubble.test.tsx -v`
Expected: All tests pass (2 tests)

- [ ] **Step 4: Commit**

```bash
git add src/components/workspace/message-bubble.tsx
git add src/components/workspace/message-bubble.test.tsx
git commit -m "feat: conditionally show star rating only when citations present"
```

---

### Task 3: 验证所有测试通过

- [ ] **Step 1: 运行完整测试套件**

Run: `pnpm test`
Expected: All 180 tests pass (or current count)

- [ ] **Step 2: 运行 lint**

Run: `pnpm lint`
Expected: No errors or warnings

- [ ] **Step 3: 最终 commit (如有必要)**

---

## 验收标准

1. ✅ AI Config Dialog 的 Experiment Flags 区不显示 thinking 复选框
2. ✅ `providerCapabilities('anthropic')` 返回的 flags 对象中 `thinking` 为 `false`
3. ✅ 带有 citations 的 assistant 消息底部显示 5 星评分
4. ✅ 无 citations 的 assistant 消息不显示评分
5. ✅ 所有改动通过 `pnpm lint && pnpm test`
