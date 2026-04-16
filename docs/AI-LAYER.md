# AI 层

## 设计目标

1. **Provider 无关**：同一套调用代码，切换 Anthropic 原生 / OpenAI 兼容端点。
2. **Prompt caching 优先**：世界观上下文标注 `cache_control: ephemeral`，项目会话内命中率 >90%。
3. **结构化输出**：建议、矛盾用 tool use 返回，告别正则解析。
4. **BYOK**：用户自带 API Key，产品不托管任何模型费用。

## 目录结构

```
src/lib/ai/
├── client.ts              ← 对外唯一入口 streamChat()
├── events.ts              ← 统一事件流 AIEvent
├── prompts.ts             ← 分段系统提示词（支持 cache breakpoints）
├── providers/
│   ├── anthropic.ts       ← @anthropic-ai/sdk + tool use + caching
│   ├── openai-compatible.ts
│   └── types.ts
└── tools/
    ├── schemas.ts         ← suggest_entry / suggest_relation / report_contradiction
    └── schemas.test.ts
```

## 事件流

所有 provider 都 yield `AIEvent`：

```ts
type AIEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_call'; id: string; name: string; input: object }
  | { type: 'usage'; inputTokens?, outputTokens?, cacheReadTokens?, cacheWriteTokens? }
  | { type: 'done'; stopReason? }
  | { type: 'error'; message: string }
```

调用示例（见 `src/lib/hooks/use-ai-chat.ts`）：

```ts
const events = streamChat(config, { segmentedSystem, messages, signal })
for await (const event of events) {
  if (event.type === 'text_delta') { /* ... */ }
  else if (event.type === 'tool_call') { /* 渲染建议卡 */ }
}
```

## 系统提示词分段

`SegmentedSystemPrompt` 拆成三块以支持 cache 断点：

1. **BASE_INSTRUCTION** — 全局稳定，始终缓存。
2. **worldBibleContext** — 项目会话内稳定，始终缓存。
3. **runtimeContext** — 每轮对话变化（如选中文段），不缓存。

Anthropic provider 将前两块标记 `cache_control: { type: 'ephemeral' }`。OpenAI 兼容端点不支持缓存，`flattenSystemPrompt()` 把三块拼成纯字符串。

## Tool use

三个工具（schema 见 `src/lib/ai/tools/schemas.ts`）：

| 工具 | 目的 | 触发 UI |
| --- | --- | --- |
| `suggest_entry` | 建议新建世界观条目 | NewEntrySuggestionCard |
| `suggest_relation` | 建议在两个已有条目间建立关系 | RelationshipSuggestionCard |
| `report_contradiction` | 报告草稿与已记录设定的矛盾 | ConsistencyWarningCard |

Claude 在回复同一条对话时可以自由组合：输出流可能先有若干 `text_delta`，然后一个 `tool_call`，再继续 `text_delta`。`use-ai-chat` 把 `tool_call` 累计到 `pendingSuggestions` / `pendingContradictions`，回复结束时一次性 setState。

## Fallback 行为

OpenAI 兼容端点不保证支持 function calling。该 provider 只 yield `text_delta`，use-ai-chat 对这条路径走回 `parseAISuggestions`（正则解析，`src/lib/ai/suggestion-parser.ts`）。精度和 Claude 路径有差距，UI 上会标识"未启用结构化输出"。

## 配置（AIConfigDialog）

- Provider 选择：两张卡片（Anthropic / OpenAI 兼容），选 Anthropic 时展示 ✨ 徽标表明支持 tool use + caching。
- BaseURL 可留空使用默认（`https://api.anthropic.com` / `https://api.openai.com`）。
- Anthropic 路径的"验证凭证"用 `max_tokens: 1` 空消息探测；OpenAI 路径用 `GET /v1/models` 探测。

## 浏览器限制

Anthropic SDK 初始化设置 `dangerouslyAllowBrowser: true`。这是合理的：BYOK 模型下密钥本来就存储在用户浏览器的 IndexedDB 里。
