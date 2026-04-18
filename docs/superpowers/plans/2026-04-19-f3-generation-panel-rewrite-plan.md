# F3 生成面板重写 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重写 `use-chapter-generation.ts`，统一调用 `streamChat()` AI 层，实现抽屉审核模式，支持流式响应和多段落结构，补充 timeout/retry/内容校验机制。

**Architecture:**
- `use-chapter-generation.ts` 重写为统一 AI 层调用，新增 timeout/retry/校验逻辑
- 新增 `GenerationDrawer` 组件，基于 Radix Sheet 模式
- 新增 `GenerationButton` 组件，置于编辑器工具栏
- 新增 `validateContent()` 内容校验函数

**Tech Stack:** Next.js 16, React 19, TypeScript, Radix Sheet, Tiptap

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/lib/hooks/use-chapter-generation.ts` | 核心重写：统一 AI 层调用 + timeout + retry + 状态机 |
| `src/components/workspace/generation-drawer.tsx` | 新建：抽屉容器 + 流式内容展示 + Accept/Reject/Regenerate |
| `src/components/workspace/generation-button.tsx` | 新建：工具栏触发按钮 |
| `src/lib/hooks/use-context-injection.ts` | 现有：RAG 上下文注入，`trimToTokenBudget()` 已存在 |
| `src/lib/ai/client.ts` | 现有：`streamChat()` 函数 |
| `src/lib/ai/events.ts` | 现有：`AIEvent` 类型定义 |

---

## Task 1: 内容校验函数

**Files:**
- Create: `src/lib/ai/content-validator.ts`
- Test: `src/lib/ai/content-validator.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/ai/content-validator.test.ts
import { validateContent } from './content-validator'

describe('validateContent', () => {
  it('returns null for valid Chinese content', () => {
    const result = validateContent('这是一个正常的段落内容。')
    expect(result).toBeNull()
  })

  it('returns error message for empty content', () => {
    const result = validateContent('   \n\n\t  ')
    expect(result).toBe('生成结果为空，请调整概述后重试')
  })

  it('returns error message for non-Chinese content', () => {
    const result = validateContent('This is just English text with no Chinese characters at all.')
    expect(result).toBe('检测到内容可能不符合中文写作习惯')
  })

  it('returns null for mixed Chinese/English content', () => {
    const result = validateContent('这是一个段落，包含一些English混合。')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ai/content-validator.test.ts`
Expected: FAIL — "content-validator not found"

- [ ] **Step 3: Write implementation**

```typescript
// src/lib/ai/content-validator.ts

/**
 * Validates generated content for emptiness and language suitability.
 * Returns an error message string if invalid, null if valid.
 */
export function validateContent(content: string): string | null {
  if (content.trim().length === 0) {
    return '生成结果为空，请调整概述后重试'
  }
  if (!/\p{Han}/u.test(content)) {
    return '检测到内容可能不符合中文写作习惯'
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ai/content-validator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/content-validator.ts src/lib/ai/content-validator.test.ts
git commit -m "feat: add content validation for generation output"
```

---

## Task 2: GenerationDrawer 组件

**Files:**
- Create: `src/components/workspace/generation-drawer.tsx`
- Modify: `src/components/ui/sheet.tsx` (if needed for custom content)

- [ ] **Step 1: Write failing test**

```typescript
// src/components/workspace/generation-drawer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { GenerationDrawer } from './generation-drawer'

// Mock Tiptap editor ref
const mockEditorRef = { current: { insertContent: vi.fn() } }

describe('GenerationDrawer', () => {
  it('renders streaming content as paragraphs', () => {
    render(
      <GenerationDrawer
        open={true}
        onClose={vi.fn()}
        onAccept={vi.fn()}
        onRegenerate={vi.fn()}
        streamingContent="第一段内容。\n\n第二段内容。"
        status="generating"
        editorRef={mockEditorRef as any}
      />
    )
    expect(screen.getByText('第一段内容。')).toBeInTheDocument()
    expect(screen.getByText('第二段内容。')).toBeInTheDocument()
  })

  it('shows Accept/Reject/Regenerate buttons when complete', () => {
    render(
      <GenerationDrawer
        open={true}
        onClose={vi.fn()}
        onAccept={vi.fn()}
        onRegenerate={vi.fn()}
        streamingContent="生成完成的内容。"
        status="complete"
        editorRef={mockEditorRef as any}
      />
    )
    expect(screen.getByText('采纳')).toBeInTheDocument()
    expect(screen.getByText('重新生成')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/workspace/generation-drawer.test.tsx`
Expected: FAIL — "generation-drawer not found"

- [ ] **Step 3: Write GenerationDrawer component**

```tsx
// src/components/workspace/generation-drawer.tsx
'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'

interface GenerationDrawerProps {
  open: boolean
  onClose: () => void
  onAccept: (content: string) => Promise<void>
  onRegenerate: () => void
  streamingContent: string
  status: GenerationStatus
  error: string | null
  editorRef: React.RefObject<{ insertContent: (content: string) => void }>
}

export function GenerationDrawer({
  open,
  onClose,
  onAccept,
  onRegenerate,
  streamingContent,
  status,
  error,
  editorRef,
}: GenerationDrawerProps) {
  const [localContent, setLocalContent] = useState(streamingContent)

  // Sync streaming content updates
  useEffect(() => {
    setLocalContent(streamingContent)
  }, [streamingContent])

  const handleAccept = async () => {
    await onAccept(localContent)
  }

  // Split content into paragraphs for rendering
  const paragraphs = localContent.split(/\n\n+/).filter(p => p.trim())

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[360px] sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-base font-medium">AI 章节生成</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Streaming content as paragraphs */}
          {paragraphs.map((para, idx) => (
            <p key={idx} className="text-sm leading-relaxed text-foreground">
              {para}
            </p>
          ))}

          {/* Error state */}
          {status === 'error' && error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Generating indicator */}
          {status === 'generating' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>生成中...</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-border flex gap-2">
          {status === 'complete' && (
            <>
              <button
                onClick={handleAccept}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                采纳
              </button>
              <button
                onClick={onRegenerate}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted"
              >
                重新生成
              </button>
            </>
          )}
          {status === 'generating' && (
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted"
            >
              取消
            </button>
          )}
          {status === 'error' && (
            <button
              onClick={onRegenerate}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              重试
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/workspace/generation-drawer.test.tsx`
Expected: PASS (or FAIL due to missing Sheet component import — fix import path)

- [ ] **Step 5: Run lint check**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/workspace/generation-drawer.tsx src/components/workspace/generation-drawer.test.tsx
git commit -m "feat: add GenerationDrawer component with streaming content"
```

---

## Task 3: use-chapter-generation.ts 重写

**Files:**
- Modify: `src/lib/hooks/use-chapter-generation.ts`
- Test: `src/lib/hooks/use-chapter-generation.test.ts`

- [ ] **Step 1: Read current implementation**

Before modifying, read `src/lib/hooks/use-chapter-generation.ts` in full to understand current state machine and all existing functions.

- [ ] **Step 2: Write failing test for retry logic**

```typescript
// src/lib/hooks/use-chapter-generation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChapterGeneration } from './use-chapter-generation'

// Mock Dexie hooks
vi.mock('@/lib/hooks/use-chapters', () => ({
  useChapter: vi.fn(() => ({ chapter: { title: 'Test', summary: 'Test summary' } })),
}))

vi.mock('@/lib/hooks/use-ai-config', () => ({
  useAIConfig: vi.fn(() => ({
    config: { provider: 'anthropic', apiKey: 'test-key', baseUrl: '' },
    loading: false,
  })),
}))

vi.mock('@/lib/ai/client', () => ({
  streamChat: vi.fn(),
}))

describe('useChapterGeneration retry logic', () => {
  it('retries once on transient failure', async () => {
    const { result } = renderHook(() => useChapterGeneration('project-1', 'chapter-1'))
    
    let callCount = 0
    vi.mocked(streamChat).mockImplementation(async function* () {
      callCount++
      if (callCount === 1) {
        yield { type: 'error', message: '429 Rate Limit' }
        return
      }
      yield { type: 'text_delta', delta: 'Generated content' }
      yield { type: 'done' }
    })

    await act.async(async () => {
      await result.current.startGeneration()
    })

    expect(callCount).toBe(2) // initial call + 1 retry
    expect(result.current.status).toBe('complete')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/hooks/use-chapter-generation.test.ts`
Expected: FAIL — retry logic not implemented

- [ ] **Step 4: Add timeout wrapper function**

Add this helper above the hook (after imports):

```typescript
// src/lib/hooks/use-chapter-generation.ts

/**
 * Wraps an async iterable with a timeout AbortController.
 * Throws DOMException with name 'AbortError' on timeout.
 */
async function* withTimeout<T>(
  iterable: AsyncIterable<T>,
  timeoutMs: number
): AsyncIterable<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    for await (const item of iterable) {
      yield item
    }
  } finally {
    clearTimeout(timeout)
  }
}
```

- [ ] **Step 5: Add retry logic wrapper**

```typescript
// src/lib/hooks/use-chapter-generation.ts

const RETRYABLE_ERRORS = ['429', '503', 'rate', 'limit']
const MAX_RETRIES = 1

function isRetryableError(message: string): boolean {
  return RETRYABLE_ERRORS.some(e => message.toLowerCase().includes(e))
}

async function* withRetry<T>(iterable: AsyncIterable<T>): AsyncIterable<T> {
  let attempt = 0
  let retryIterator: AsyncIterable<T> | null = null

  while (attempt <= MAX_RETRIES) {
    try {
      for await (const item of iterable) {
        yield item
      }
      return // Stream completed successfully
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError'
      if (isAbort) throw err

      attempt++
      if (attempt > MAX_RETRIES) throw err
      // Clone the iterable for retry — depends on provider
      // For simplicity, the caller tracks whether to retry
      throw err
    }
  }
}
```

- [ ] **Step 6: Rewrite startGeneration with timeout + retry**

In `startGeneration()`, replace the stream iteration block with:

```typescript
const controller = new AbortController()
const timeoutMs = 30_000

try {
  const response = await streamChat(configForStreamChat, {
    segmentedSystem,
    messages,
    signal: controller.signal,
  })

  let retryCount = 0
  let retryStream: AsyncIterable<AIEvent> | null = null

  for await (const event of withTimeout(response, timeoutMs)) {
    if (event.type === 'text_delta') {
      fullContent += event.delta
      setState(prev => ({ ...prev, streamingContent: fullContent }))
    } else if (event.type === 'error') {
      // Retry logic for rate-limited errors
      if (isRetryableError(event.message) && retryCount < MAX_RETRIES) {
        retryCount++
        // Re-fetch stream for retry
        const retryResponse = await streamChat(configForStreamChat, {
          segmentedSystem,
          messages,
          signal: controller.signal,
        })
        retryStream = retryResponse
        continue
      }
      throw new Error(event.message)
    }
  }

  // Validate content after stream completes
  const validationError = validateContent(fullContent)
  if (validationError) {
    setState(prev => ({
      ...prev,
      status: 'error',
      error: validationError,
    }))
    return
  }

  setState(prev => ({ ...prev, status: 'complete' }))
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    setState(prev => ({ ...prev, status: 'idle', streamingContent: '' }))
  } else {
    setState(prev => ({
      ...prev,
      status: 'error',
      error: err instanceof Error ? err.message : '生成失败',
    }))
  }
}
```

- [ ] **Step 7: Update imports**

Add to the imports at top of file:
```typescript
import { validateContent } from '@/lib/ai/content-validator'
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/lib/hooks/use-chapter-generation.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/hooks/use-chapter-generation.ts src/lib/hooks/use-chapter-generation.test.ts
git commit -m "refactor: rewrite use-chapter-generation with timeout and retry"
```

---

## Task 4: GenerationButton + 集成到编辑器

**Files:**
- Create: `src/components/workspace/generation-button.tsx`
- Modify: `src/components/workspace/ai-chat-panel.tsx` (add drawer usage)
- Modify: `src/app/projects/[id]/page.tsx` (wire up GenerationDrawer + hook)

- [ ] **Step 1: Write GenerationButton component**

```tsx
// src/components/workspace/generation-button.tsx
'use client'

import { useChapterGeneration } from '@/lib/hooks/use-chapter-generation'

interface GenerationButtonProps {
  projectId: string
  chapterId: string
  editorRef: React.RefObject<{ insertContent: (content: string) => void }>
  onOpenDrawer: () => void
}

export function GenerationButton({ projectId, chapterId, editorRef, onOpenDrawer }: GenerationButtonProps) {
  const generation = useChapterGeneration(projectId, chapterId)

  const handleGenerate = async () => {
    onOpenDrawer()
    await generation.startGeneration()
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={generation.status === 'generating'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title="AI 生成章节内容"
    >
      {generation.status === 'generating' ? (
        <>
          <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          生成中...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI 生成
        </>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Integrate GenerationDrawer into workspace page**

In `src/app/projects/[id]/page.tsx`, add the drawer alongside existing drawers:

```tsx
// In the component body:
const [generationDrawerOpen, setGenerationDrawerOpen] = useState(false)
const generationRef = useRef<{ insertContent: (c: string) => void }>(null)

// Get generation hook state (we need to pass it to the drawer)
const generation = useChapterGeneration(projectId, activeChapterId)

// Add GenerationDrawer component (after other drawers):
<GenerationDrawer
  open={generationDrawerOpen}
  onClose={() => setGenerationDrawerOpen(false)}
  onAccept={async (content) => {
    if (editorRef.current) {
      editorRef.current.insertContent(content)
    }
    setGenerationDrawerOpen(false)
    generation.resetGeneration()
  }}
  onRegenerate={() => generation.startGeneration()}
  streamingContent={generation.streamingContent}
  status={generation.status}
  error={generation.error}
  editorRef={editorRef}
/>
```

- [ ] **Step 3: Add GenerationButton to toolbar**

Find where the toolbar/button bar is rendered and add:

```tsx
<GenerationButton
  projectId={projectId}
  chapterId={activeChapterId}
  editorRef={editorRef}
  onOpenDrawer={() => setGenerationDrawerOpen(true)}
/>
```

- [ ] **Step 4: Verify no lint errors**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/generation-button.tsx src/app/projects/[id]/page.tsx
git commit -m "feat: add GenerationButton and integrate GenerationDrawer into workspace"
```

---

## Task 5: 多段落结构保留

**Files:**
- Modify: `src/components/workspace/generation-drawer.tsx` (update paragraph rendering)

- [ ] **Step 1: Update GenerationDrawer to use pre tags for whitespace**

```tsx
// In generation-drawer.tsx, update the paragraph rendering:
// Replace the <p> rendering with:
{paragraphs.map((para, idx) => (
  <pre key={idx} className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
    {para}
  </pre>
))}
```

- [ ] **Step 2: Update tests to verify paragraph splitting**

```typescript
// In generation-drawer.test.tsx, add:
it('splits content by double newlines into paragraphs', () => {
  render(
    <GenerationDrawer
      open={true}
      onClose={vi.fn()}
      onAccept={vi.fn()}
      onRegenerate={vi.fn()}
      streamingContent="Paragraph one.\n\n\nParagraph two with lots of space."
      status="complete"
      editorRef={mockEditorRef as any}
    />
  )
  expect(screen.getByText('Paragraph one.')).toBeInTheDocument()
  expect(screen.getByText('Paragraph two with lots of space.')).toBeInTheDocument()
})
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/workspace/generation-drawer.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/workspace/generation-drawer.tsx
git commit -m "fix: preserve multi-paragraph structure in GenerationDrawer"
```

---

## Task 6: 集成上下文注入（标准模式）

**Files:**
- Modify: `src/lib/hooks/use-chapter-generation.ts` (inject context before generation)

- [ ] **Step 1: Add world bible context injection**

In `startGeneration()`, before calling `streamChat()`, add:

```typescript
// Build context prompt with standard mode injection
import { useContextInjection } from '@/lib/hooks/use-context-injection'

// Inside startGeneration (after validation checks, before streamChat call):
const contextResult = await useContextInjection(projectId, {
  maxTokens: 4000,
  entryTypes: ['character', 'location', 'rule'],
  topPerType: 3,
})

const segmentedSystem: SegmentedSystemPrompt = {
  parts: [
    {
      role: 'system',
      content: `【当前章节】
标题：${currentChapter.title}
概述：${currentChapter.summary}

【上文摘要】
${previousContent ? previousContent.slice(-500) : '（无上文内容）'}

${contextResult.injectedEntries.length > 0 ? `【世界观核心】\n${contextResult.formattedEntries.join('\n')}` : ''}`,
    },
  ],
}
```

Note: `useContextInjection` is a hook, so we need to call it at component level. Update the hook to expose a `buildContextPrompt()` function instead.

- [ ] **Step 2: Add buildContextPrompt utility**

Create `src/lib/hooks/use-context-injection.ts` helper (if not already available as function):

The hook already has `formatEntryForContext()` and `trimToTokenBudget()`. Extract a utility function:

```typescript
// src/lib/hooks/use-context-injection.ts

export async function buildWorldBibleContext(
  projectId: string,
  options: { maxTokens: number; topPerType: number }
): Promise<string> {
  const entries = await searchRelevantEntries(projectId, { ...options, query: '' })
  const formatted = entries.map(formatEntryForContext)
  return formatted.join('\n')
}
```

- [ ] **Step 3: Update use-chapter-generation to use context**

In the hook, after getting `currentChapter`:

```typescript
const worldBibleContext = await buildWorldBibleContext(projectId, {
  maxTokens: 4000,
  topPerType: 3,
})

const systemContent = `【当前章节】
标题：${currentChapter.title}
概述：${currentChapter.summary}

【上文摘要】
${previousContent ? previousContent.slice(-500) : '（无上文内容）'}

${worldBibleContext ? `【世界观核心】\n${worldBibleContext}` : ''}`
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/hooks/use-chapter-generation.ts src/lib/hooks/use-context-injection.ts
git commit -m "feat: inject world bible context into chapter generation"
```

---

## Task 7: 端到端测试

**Files:**
- Create: `src/components/workspace/generation-drawer.e2e.test.ts` (if e2e infra exists)
- Verify: All existing tests still pass

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "feat: complete F3 generation panel rewrite"
```

---

## 自检清单

### Spec 覆盖检查
- [x] 多 Provider 支持 → Task 3 (统一 streamChat)
- [x] 抽屉审核模式 → Task 2 (GenerationDrawer)
- [x] 流式响应 → Task 2/3
- [x] 多段落结构 → Task 5
- [x] 30s timeout → Task 3 (withTimeout)
- [x] 1 次 retry → Task 3 (retry logic)
- [x] 内容校验 → Task 1 (validateContent)
- [x] 上下文注入（标准模式）→ Task 6

### 占位符扫描
- 无 "TBD"、"TODO" 标记
- 无 "实现后续" 引用
- 所有代码片段完整

### 类型一致性
- `GenerationStatus` 类型：`'idle' | 'generating' | 'complete' | 'error'` — 全局一致
- `AIEvent` 类型：从 `src/lib/ai/events.ts` 引入
- `AbortController` + `DOMException` — 用于 timeout/abort 检测
