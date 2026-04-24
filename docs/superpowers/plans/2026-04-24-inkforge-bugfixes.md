# InkForge 缺陷修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 InkForge 项目中高优先级和中优先级的安全性和可靠性缺陷

**Architecture:** 按优先级逐个修复问题，每个问题独立完成并提交。优先修复安全问题（SSRF），然后修复同步引擎缺陷，最后改进错误处理。

**Tech Stack:** TypeScript, Dexie.js, Supabase, IndexedDB

---

## 文件变更概览

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lib/ai/providers/openai-compatible.ts` | 修改 | SSRF 防护 + usage 事件 |
| `src/lib/ai/find-entry-by-name.ts` | 修改 | 修复匹配逻辑 |
| `src/lib/sync/sync-engine.ts` | 修改 | 添加 messages 同步 |
| `src/lib/sync/sync-queue.ts` | 修改 | 添加重试机制 |
| `src/lib/hooks/use-context-injection.ts` | 修改 | 改进 token 计算 |

---

## Task 1: SSRF 防护修复

**目标:** 在 `streamOpenAICompatible` 中调用 SSRF 验证

**Files:**
- Modify: `src/lib/ai/providers/openai-compatible.ts:20-32`

**Steps:**

- [ ] **Step 1: 添加 SSRF 验证调用**

在 `streamOpenAICompatible` 函数中，`normalizeBaseUrl` 调用之后，添加 SSRF 验证：

```typescript
// 在第 20 行之后添加
validateURLForSSRF(`${baseUrl}/chat/completions`)
```

完整修改后的代码块：

```typescript
export async function* streamOpenAICompatible(
  params: ProviderStreamParams
): AsyncIterable<AIEvent> {
  const { config, segmentedSystem, messages, signal } = params
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  validateURLForSSRF(`${baseUrl}/chat/completions`)  // 新增
  const systemPrompt = flattenSystemPrompt(segmentedSystem)
  // ... 后续代码不变
```

- [ ] **Step 2: 添加 validateURLForSSRF import**

在文件顶部 import 部分添加：

```typescript
import { validateURLForSSRF } from '../ssrf-guard'
```

- [ ] **Step 3: 运行测试验证**

Run: `pnpm test -- src/lib/ai/providers/openai-compatible.test.ts`
Expected: PASS (如果测试文件存在)

- [ ] **Step 4: 提交**

```bash
git add src/lib/ai/providers/openai-compatible.ts
git commit -m "fix(ai): add SSRF validation to openai-compatible provider"
```

---

## Task 2: OpenAI-compatible provider 添加 usage 事件

**目标:** 从 API 响应中提取 token 使用量并发送 usage 事件

**Files:**
- Modify: `src/lib/ai/providers/openai-compatible.ts:66-81`

**Steps:**

- [ ] **Step 1: 修改 SSE 解析逻辑以提取 usage**

找到 `for (const line of frames)` 循环，在其中添加 usage 提取：

```typescript
// 在第 71-76 行后添加 usage 提取
let lastUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null
// ... 现有代码 ...

// 在 yield done 之前添加：
if (lastUsage) {
  yield {
    type: 'usage',
    inputTokens: lastUsage.prompt_tokens ?? 0,
    outputTokens: lastUsage.completion_tokens ?? 0,
    totalTokens: lastUsage.total_tokens ?? 0,
  }
}
```

完整替换 SSE 解析循环部分：

```typescript
let lastUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })

  const frames = buffer.split('\n')
  buffer = frames.pop() ?? ''

  for (const line of frames) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue
    const payload = trimmed.slice(5).trim()
    if (payload === '[DONE]') continue
    try {
      const parsed = JSON.parse(payload)
      const delta = parsed.choices?.[0]?.delta?.content
      if (typeof delta === 'string' && delta.length > 0) {
        yield { type: 'text_delta', delta }
      }
      // 提取 usage 信息（通常在最后一个 chunk 中）
      if (parsed.usage) {
        lastUsage = parsed.usage
      }
    } catch {
      // Ignore malformed fragments
    }
  }
}

if (lastUsage) {
  yield {
    type: 'usage',
    inputTokens: lastUsage.prompt_tokens ?? 0,
    outputTokens: lastUsage.completion_tokens ?? 0,
    totalTokens: lastUsage.total_tokens ?? 0,
  }
}

yield { type: 'done' }
```

- [ ] **Step 2: 确认 AIEvent 类型支持 usage**

检查 `src/lib/ai/events.ts` 是否已定义 `usage` 事件类型。如果需要，添加：

```typescript
// 在 AIEvent 类型联合中添加
| { type: 'usage'; inputTokens: number; outputTokens: number; totalTokens: number }
```

- [ ] **Step 3: 运行测试**

Run: `pnpm test -- src/lib/ai/providers/`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/lib/ai/providers/openai-compatible.ts src/lib/ai/events.ts
git commit -m "feat(ai): emit usage events in openai-compatible provider"
```

---

## Task 3: 修复 findEntryIdByName 匹配逻辑

**目标:** 修复过于宽松的匹配，防止误匹配

**Files:**
- Modify: `src/lib/ai/find-entry-by-name.ts:9`

**Steps:**

- [ ] **Step 1: 修改匹配逻辑**

将 `name.includes(e.name)` 改为更严格的匹配：

```typescript
export function findEntryIdByName(
  entriesByType: EntriesByType,
  name: string
): string | null {
  for (const entries of [entriesByType.character, entriesByType.location, entriesByType.rule, entriesByType.timeline]) {
    // 精确匹配或完整词匹配（前后有边界）
    const found = entries.find((e: WorldEntry) => {
      if (e.name === name) return true
      // 使用单词边界匹配，避免"王二小"匹配"王小"
      const escapedName = e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(^|\\s)${escapedName}($|\\s)`, 'g')
      return regex.test(name)
    })
    if (found) return found.id
  }
  return null
}
```

- [ ] **Step 2: 运行测试**

Run: `pnpm test -- src/lib/ai/find-entry-by-name.test.ts`
Expected: PASS

如果没有测试文件，创建测试并验证：

```typescript
// src/lib/ai/find-entry-by-name.test.ts
import { describe, it, expect } from 'vitest'
import { findEntryIdByName } from './find-entry-by-name'

describe('findEntryIdByName', () => {
  it('精确匹配应该成功', () => {
    const entriesByType = {
      character: [{ id: '1', name: '王小', type: 'character' as const }],
      location: [],
      rule: [],
      timeline: [],
    }
    expect(findEntryIdByName(entriesByType, '王小')).toBe('1')
  })

  it('"王二小" 不应该匹配 "王小"', () => {
    const entriesByType = {
      character: [{ id: '1', name: '王小', type: 'character' as const }],
      location: [],
      rule: [],
      timeline: [],
    }
    expect(findEntryIdByName(entriesByType, '王二小')).toBe(null)
  })
})
```

- [ ] **Step 3: 提交**

```bash
git add src/lib/ai/find-entry-by-name.ts
git commit -m "fix(ai): fix overly permissive name matching in findEntryIdByName"
```

---

## Task 4: Sync 引擎添加 messages 表同步

**目标:** 在 `performInitialSync` 和 `flushSyncQueue` 中处理 messages 表

**Files:**
- Modify: `src/lib/sync/sync-engine.ts:116, 145-264`

**Steps:**

- [ ] **Step 1: 添加 messages 到 cloudTables 数组**

在 `performInitialSync` 函数的 `cloudTables` 数组中添加 `'messages'`：

```typescript
const cloudTables = ['project_index', 'chapters', 'world_entries', 'relations', 'messages', 'conversations']
```

- [ ] **Step 2: 添加 messages 同步逻辑**

在 `performInitialSync` 的数据处理部分，找到 `cloudTable === 'conversations'` 的分支后，添加：

```typescript
} else if (cloudTable === 'messages') {
  const local = mapCloudToLocal('messages', record) as Record<string, unknown>
  await projectDb.messages.put({
    id: local.id as string,
    projectId: local.projectId as string,
    conversationId: local.conversationId as string,
    role: local.role as 'user' | 'assistant',
    content: local.content as string,
    createdAt: Number(local.createdAt ?? Date.now()),
    updatedAt: Number(local.updatedAt ?? Date.now()),
  })
  merged++
}
```

- [ ] **Step 3: 验证数据库 schema 支持 messages 表**

检查 `src/lib/db/project-db.ts` 确认 `messages` 表已定义。如果不存在，需要添加：

```typescript
messages: '++id, projectId, conversationId, [projectId+conversationId]',
```

- [ ] **Step 4: 运行测试**

Run: `pnpm test -- src/lib/sync/`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/sync/sync-engine.ts src/lib/db/project-db.ts
git commit -m "fix(sync): add messages table to initial sync and queue flush"
```

---

## Task 5: 同步队列添加自动重试机制

**目标:** 失败同步项自动重试，而不是永久卡住

**Files:**
- Modify: `src/lib/sync/sync-queue.ts:94-105`

**Steps:**

- [ ] **Step 1: 修改 markFailed 函数添加重试逻辑**

替换 `markFailed` 函数：

```typescript
/**
 * Mark items as failed and schedule automatic retry.
 * Uses exponential backoff: retry after 30s, 1m, 5m, 15m, max 1 hour.
 */
const RETRY_DELAYS_MS = [30_000, 60_000, 300_000, 900_000, 3_600_000]

export async function markFailed(ids: string[]): Promise<void> {
  const db = await getQueueDB()
  const tx = db.transaction('queue', 'readwrite')
  for (const id of ids) {
    const item = await tx.store.get(id)
    if (item) {
      item.failed = true
      // 计算重试延迟
      const retryCount = (item as unknown as { retryCount?: number }).retryCount ?? 0
      const nextRetryAt = Date.now() + (RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)] ?? 3_600_000)
      ;(item as unknown as { retryCount?: number; nextRetryAt?: number }).retryCount = retryCount + 1
      ;(item as unknown as { nextRetryAt?: number }).nextRetryAt = nextRetryAt
      await tx.store.put(item)
    }
  }
  await tx.done
}

/**
 * Get items that are ready for retry (failed and past retry time).
 */
export async function getRetryableItems(): Promise<SyncQueueItem[]> {
  const db = await getQueueDB()
  const allItems = await db.getAll('queue')
  const now = Date.now()
  return allItems.filter(item => {
    if (!item.failed) return false
    const nextRetryAt = (item as unknown as { nextRetryAt?: number }).nextRetryAt
    return !nextRetryAt || nextRetryAt <= now
  })
}

/**
 * Reset failed status and clear retry count for manual retry.
 */
export async function resetForRetry(ids: string[]): Promise<void> {
  const db = await getQueueDB()
  const tx = db.transaction('queue', 'readwrite')
  for (const id of ids) {
    const item = await tx.store.get(id)
    if (item) {
      item.failed = false
      ;(item as unknown as { retryCount?: number; nextRetryAt?: number }).retryCount = 0
      ;(item as unknown as { nextRetryAt?: number }).nextRetryAt = undefined
      await tx.store.put(item)
    }
  }
  await tx.done
}
```

- [ ] **Step 2: 修改 flushSyncQueue 以包含重试项**

更新 `getPendingChanges` 调用以也获取可重试的项：

```typescript
// 在 flushSyncQueue 函数中，第 41 行附近
const pending = [...await getPendingChanges(), ...await getRetryableItems()]
```

- [ ] **Step 3: 更新 sync-engine.ts 中调用 markFailed 的地方**

确保 `flushSyncQueue` 导入并使用新的 `resetForRetry`。在首次成功同步失败项后调用 `resetForRetry`。

- [ ] **Step 4: 运行测试**

Run: `pnpm test -- src/lib/sync/sync-queue.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/sync/sync-queue.ts src/lib/sync/sync-engine.ts
git commit -m "feat(sync): add automatic retry with exponential backoff for failed syncs"
```

---

## Task 6: 改进 Token 计算精度

**目标:** 使用更精确的 token 估算方法

**Files:**
- Modify: `src/lib/hooks/use-context-injection.ts:152`

**Steps:**

- [ ] **Step 1: 添加中文友好的 token 计算函数**

在文件顶部添加中文 token 估算函数：

```typescript
/**
 * Chinese-friendly token estimation.
 * Chinese characters average ~1.5 tokens, English words ~1.3 tokens.
 * This provides better accuracy than the simple /1.5 approximation.
 */
function estimateTokens(text: string): number {
  // 移除 markdown 格式字符
  const cleaned = text.replace(/[#*_`~\[\]()]/g, '')
  
  let chineseChars = 0
  let englishWords = 0
  let currentWord = ''
  
  for (const char of cleaned) {
    if (/[一-鿿]/.test(char)) {
      // 中文字符
      if (currentWord.length > 0) {
        englishWords += 1
        currentWord = ''
      }
      chineseChars++
    } else if (/\s/.test(char)) {
      if (currentWord.length > 0) {
        englishWords += 1
        currentWord = ''
      }
    } else {
      currentWord += char
    }
  }
  
  if (currentWord.length > 0) {
    englishWords += 1
  }
  
  // 中文按 1.5 tokens/字符，英文按 1.3 tokens/词
  return Math.ceil(chineseChars * 1.5 + englishWords * 1.3)
}
```

- [ ] **Step 2: 替换原有的粗略计算**

将第 152 行的：
```typescript
const entryTokens = Math.ceil(_formatEntryForContext(entry).length / 1.5)
```

替换为：
```typescript
const entryTokens = estimateTokens(_formatEntryForContext(entry))
```

- [ ] **Step 3: 运行测试**

Run: `pnpm test -- src/lib/hooks/use-context-injection.test.ts`
Expected: PASS

如果没有测试文件，验证整体功能正常：
Run: `pnpm test -- src/lib/`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/lib/hooks/use-context-injection.ts
git commit -m "perf: improve token estimation with Chinese-friendly algorithm"
```

---

## 实施检查清单

完成所有 Tasks 后，执行以下验证：

- [ ] `pnpm lint` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm build` 成功

---

## 后续建议（不在本次计划范围内）

以下问题建议在后续迭代中解决：

1. **键盘快捷键** - 添加 Ctrl+S 保存、Ctrl+Z 撤销等
2. **离线指示器** - UI 显示当前网络状态
3. **Toast 时长** - 调整消息显示时间
4. **组件拆分** - ai-chat-panel (408行) 和 page.tsx (251行) 过大

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
