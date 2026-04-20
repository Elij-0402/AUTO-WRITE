# 实验性 AI 特性：清理与强化

**状态**：设计中
**日期**：2026-04-20
**决策**：方向 C — 移除 thinking stub，Citations 做扎实，Cache TTL 可见化

---

## 背景

三个 2026 Anthropic 原语实验标志处于不同实现状态：

| 功能 | 实现状态 | 问题 |
|---|---|---|
| Citations API | 全链路实现 | `emptyCitationRate` 未计算，无评分 UI，无分析面板 |
| Extended Cache TTL | 已启用且生效 | 用户感知不到价值 |
| Extended Thinking | **Stub — 无 provider 接入** | UI 复选框是空承诺，损害用户信任 |

---

## 第一部分：移除 thinking stub

**原则**：不复存在的功能不应占据 UI。

### 改动

1. **`src/components/workspace/ai-config-dialog.tsx`**
   - 从 `ExperimentFlagsSection` 删除 `thinking` 行

2. **`src/lib/ai/experiment-flags.ts`**
   - `THINKING_FLAG` 类型定义保留（避免破坏 `experimentGroupKey` 序列化兼容）
   - `DEFAULT_EXPERIMENT_FLAGS` 确认不包含 `thinking`（已是 `false`，显式确认）

3. **已有数据**：旧 `abTestMetrics` 行中 `experimentGroup.thinking` 字段保留，查询时自然忽略

### 验收标准

- 打开 AI Config Dialog，Experiment Flags 区不再显示 thinking 复选框
- `providerCapabilities('anthropic')` 返回的 flags 对象不包含 `thinking`

---

## 第二部分：Citations 做扎实

目标：Citations 的价值可量化、可感知。

### 2a. 补完 `emptyCitationRate` 计算

**文件**：`src/lib/hooks/use-chat-telemetry.ts` → `recordChatTurn`

**逻辑**：
- 当 `citationsFlag === true` 且 `citationCount > 0`：写入 `emptyCitationRate = 0`
- 当 `citationsFlag === true` 且 `citationCount === 0`：写入 `emptyCitationRate = 1`（AI 拿到了世界观百科但什么都没引用）
- 当 `citationsFlag === false`：不写入该字段

**效果**：`aggregateABTestMetrics()` 的 `avgEmptyCitationRate` 才有意义——反映幻觉风险频率。

### 2b. `authorRating` 1-5 星收集 UI

**文件**：`src/components/workspace/message-bubble.tsx`

**时机**：仅对 `role='assistant'` 且 `useCitations=true` 且 `message.citations.length > 0` 的消息显示。

**交互**：
- 消息气泡底部渲染 5 个小星星（☆ / ★）
- 悬停高亮到当前星位（可半选）
- 点击后固定显示评分，tooltip 显示"已收集"
- 调用 `recordAuthorRating(message.id, rating)`（新增，写入对应 `abTestMetric` 行）
- 只能评分一次，不可修改
- 失败静默，不打断写作流

**UI 位置**：在消息底部、citation chips 之后，时间戳之前。

### 2c. 最小分析面板

**文件**：`src/components/workspace/citations-analytics-panel.tsx`（新）

**位置**：AI chat 面板底部，可折叠区域。

**显示内容**（按 conversation 聚合）：
- 本次会话总 citations 数量
- 空引用率（`avgEmptyCitationRate`）
- 平均用户评分（`avgAuthorRating`）
- Cache TTL 节省 tokens（`sumCacheReadTokens`）

**设计**：
- 默认折叠，显示一行摘要（如"本次对话 12 次引用 · 空引用率 8%"）
- 点击展开显示详细数字
- **不占用主 UI 空间** — 折叠状态零占位

---

## 第三部分：Cache TTL 可见化

**目标**：让用户感知到缓存节省了 tokens。

**文件**：`src/components/workspace/chat-input.tsx` 或 `use-ai-chat.ts` streaming 完成处理

**时机**：streaming `done` 事件时，`cacheReadTokens > 0` 且本次会话首次触发时。

**显示**：在输入框下方（chat area 底部）淡入淡出提示：
> "已节省约 {N} tokens（1小时缓存）"

- 3 秒后淡出
- 仅显示一次（`hasShownCacheHint` session flag）
- 失败静默

---

## 第四部分：schema 确认

**文件**：`src/lib/db/project-db.ts`

确认 `ABTestMetric` 表包含：
- `emptyCitationRate?: number`
- `authorRating?: number`

目前 schema 已定义，验证写入链路存在。

---

## 文件变更清单

| 文件 | 操作 |
|---|---|
| `src/components/workspace/ai-config-dialog.tsx` | 修改 — 删除 thinking 行 |
| `src/lib/ai/experiment-flags.ts` | 修改 — 确认 default 无 thinking |
| `src/lib/hooks/use-chat-telemetry.ts` | 修改 — 补完 emptyCitationRate 写入 |
| `src/components/workspace/message-bubble.tsx` | 修改 — 增加 authorRating 星星 UI |
| `src/components/workspace/citations-analytics-panel.tsx` | 新增 |
| `src/components/workspace/chat-input.tsx` | 修改 — 增加 cache 节省提示 |

---

## 验收标准

1. AI Config Dialog 的 Experiment Flags 不再显示 thinking 复选框
2. Citations 开启后，每次 AI 回复写 `emptyCitationRate`（0 或 1）
3. 带有 citations 的 assistant 消息底部有 5 星评分，点击可记录
4. Chat 面板底部有可折叠的分析摘要栏
5. 首次 cache hit 时，输入框下方显示节省 tokens 提示
6. 所有改动通过 `npm run lint`，现有测试通过
