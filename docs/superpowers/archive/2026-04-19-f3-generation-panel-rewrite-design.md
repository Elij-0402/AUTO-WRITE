# F3 生成面板重写 — 设计文档

**版本：** v1.0
**日期：** 2026-04-19
**负责人：** 产品管理
**状态：** 待用户审核

---

## 1. 背景与目标

### 现状问题

当前 `use-chapter-generation.ts` 存在以下问题：

1. **多 Provider 支持缺失** — 直接 fetch OpenAI 协议，Anthropic 用户无法使用章节生成
2. **无审核流程** — AI 输出直接插入编辑器，用户无法审核
3. **多段落结构丢失** — 生成的多个段落被压缩成一段
4. **无 timeout 机制** — `streamChat()` 无内置超时，异常情况无保障

### 设计目标

1. 重写 `use-chapter-generation.ts`，统一调用 `streamChat()` AI 层
2. 实现**抽屉审核模式** — 生成内容在抽屉中展示，用户 Accept/Reject/Regenerate
3. 保留**流式响应**，支持多段落结构
4. 补充 timeout、retry、内容校验机制

---

## 2. 整体架构

```
用户触发生成
     │
     ▼
useChapterGeneration ──► 统一 AI 层 streamChat()
     │                         │
     │                    provider 检测
     │                         │
     ▼                         ▼
生成状态管理 ◄────── 流式响应 ◄── Anthropic / OpenAI-compatible
     │
     ▼
GenerationDrawer ◄─────── 抽屉容器
     │
     ▼
Accept → 插入编辑器当前位置
Reject → 关闭抽屉
Regenerate → 重新调用 streamChat()
```

---

## 3. 上下文注入（标准模式）

### 注入内容

```
系统提示前缀：
  【当前章节】标题 + 章节概述
  【上文摘要】上一段内容（≤ 500 字，用于衔接）
  【世界观核心】人物/地点/规则 各取 Top 2-3

用户消息：
  "请根据上述上下文，生成【章节标题】的完整内容..."
```

### Token 预算

- 总计 4000 tokens（与 AI 聊天面板一致）
- 优先级：章节信息 > 上文摘要 > 世界百科

---

## 4. 生成流程

| 步骤 | 动作 |
|------|------|
| 1 | 用户点击「AI 生成」按钮（编辑器工具栏） |
| 2 | 前置校验：API Key / 章节标题 / 章节概述 |
| 3 | 构建 prompt（注入上下文） |
| 4 | 调用 `streamChat()`，传入带 timeout 的 AbortSignal |
| 5 | 流式内容显示在抽屉中 |
| 6 | 用户审阅：Accept / Reject / Regenerate |
| 7 | Accept 后，`editorRef.insertContent()` 插入当前位置 |

---

## 5. 错误处理（完整列表）

### 前置校验（已有）

| 场景 | 处理 |
|------|------|
| API Key 缺失 | `status: 'error'` + 引导用户去设置 |
| Base URL 缺失（OpenAI-compatible） | 同上 |
| 章节不存在 | 同上 |
| 章节概述为空 | 同上 |

### 生成进行中（已有）

| 场景 | 处理 |
|------|------|
| Provider 返回 error 事件 | catch 后 `status: 'error'` + 提示消息 |
| 用户主动取消（AbortError） | `status: 'idle'` + 清除流式内容 |
| Provider 抛出异常（网络失败） | catch 后 `status: 'error'` |

### 需新增

| 场景 | 处理 |
|------|------|
| Provider 无响应（30s timeout） | AbortSignal timeout，`status: 'error'` + 「请求超时，请重试」 |
| 瞬时失败（429/503） | 最多 1 次自动重试，仍失败则 error |
| 生成内容为空 | 检测 `content.trim().length === 0`，提示「生成结果为空」 |
| 生成内容非中文 | 检测 `\p{Han}`，提示「内容疑似非中文，可重新生成」 |
| Provider JSON 解析失败 | 静默返回 `{}` → 触发空内容检测 |

### 上下文注入

| 场景 | 处理 |
|------|------|
| 上文摘要为空 | 仅传章节标题 + 概述 |
| 上文摘要过长 | 截断至最后 500 字 |
| 无世界百科条目 | 跳过注入 |

---

## 6. UI 组件

| 组件 | 职责 |
|------|------|
| `GenerationButton` | 触发按钮，置于编辑器工具栏，generating 时 disabled |
| `GenerationDrawer` | 抽屉容器，承载流式内容 + 操作按钮 |
| `DiffPreview` | 生成内容展示区（支持多段落渲染） |

### 抽屉交互

| 按钮 | 行为 |
|------|------|
| Accept | `editorRef.insertContent()` 插入当前位置，`state.status = 'idle'` |
| Reject | 关闭抽屉，`state.status = 'idle'` |
| Regenerate | 重新调用 `streamChat()`，`state.status = 'generating'` |

---

## 7. 关键实现细节

### 7.1 AbortSignal Timeout

```ts
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30_000)

try {
  for await (const event of streamChat({ signal: controller.signal })) {
    // ...
  }
} finally {
  clearTimeout(timeout)
}
```

### 7.2 多段落保留

- 前端按 `\n\n` 分割段落
- 渲染时使用 `<p>` 标签，保持段落结构

### 7.3 内容完整性检测

```ts
function validateContent(content: string): string | null {
  if (content.trim().length === 0) return '生成结果为空，请调整概述后重试'
  if (!/\p{Han}/u.test(content)) return '检测到内容可能不符合中文写作习惯'
  return null
}
```

---

## 8. 与 F1 AI 差异卡片的关系

F3 抽屉审核模式与 F1（AI 差异卡片）为**同一模式的不同表现形式**：

| 场景 | 组件复用 |
|------|---------|
| 生成结果审核 | `GenerationDrawer` 复用 `DiffDrawer` 逻辑 |
| Chat 草稿审核 | `AIChatPanel` 已有 diff 逻辑 |

未来考虑合并为统一的 `ReviewDrawer` 组件。

---

## 9. 成功标准

1. ✅ Anthropic 和 OpenAI-compatible 用户都能正常使用章节生成
2. ✅ 生成内容支持多段落结构
3. ✅ 流式响应实时显示
4. ✅ 用户可 Accept/Reject/Regenerate
5. ✅ 30s 超时机制生效
6. ✅ 429/503 瞬时失败有 1 次重试
7. ✅ 空内容/非中文内容有明确提示
