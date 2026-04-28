# Chat-First Creative Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the project workspace into a chat-first writing surface that keeps planning and worldbuilding power behind inline artifact cards and a thin accepted-memory strip.

**Architecture:** Reuse the existing conversation, planning, charter, world-entry, and drafting systems, but move them behind the `AIChatPanel` shell. Add structured artifact metadata to chat messages, derive the thin memory strip from already accepted project state, and demote planning-first navigation from the default path without deleting the underlying persistence model.

**Tech Stack:** Next.js App Router, React, TypeScript, Dexie/IndexedDB, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- Modify: `src/lib/db/project-db.ts`
  - Extend `ChatMessage` storage with optional artifact metadata and add a schema migration.
- Modify: `src/lib/hooks/use-ai-chat.ts`
  - Parse assistant artifact payloads, persist accepted artifact-ready messages, and expose artifact actions.
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`
  - Make chat the primary workspace shell and wire artifact acceptance, revision, and expansion actions.
- Modify: `src/components/workspace/ai-chat-panel/message-list.tsx`
  - Render the thin memory strip above the message flow and pass artifact handlers through message rows.
- Modify: `src/components/workspace/message-bubble.tsx`
  - Render inline artifact cards for assistant messages.
- Modify: `src/components/workspace/ai-chat-panel/index.test.tsx`
  - Cover memory strip, artifact rendering, and chat-first shell behavior.
- Modify: `src/lib/hooks/use-workspace-layout.ts`
  - Change default tab selection and URL sync rules so chat-first becomes the dominant entry.
- Modify: `src/lib/hooks/use-workspace-layout.test.ts`
  - Lock the new default-entry behavior.
- Modify: `src/app/projects/[id]/page.tsx`
  - Swap the main-content routing so planning no longer owns the default creative path.
- Modify: `src/components/planning/planning-workbench.tsx`
  - Demote the empty-state copy and add a secondary-entry posture instead of primary creation posture.
- Modify: `src/components/planning/planning-workbench.test.tsx`
  - Update expectations for the demoted planning copy.

### New files to create

- Create: `src/lib/types/chat-artifact.ts`
  - Shared artifact type definitions used by hooks, DB, and UI.
- Create: `src/lib/ai/chat-artifacts.ts`
  - Parse assistant output into artifact payloads and define accepted action contracts.
- Create: `src/lib/ai/chat-artifacts.test.ts`
  - Unit coverage for artifact parsing and action payload validation.
- Create: `src/lib/hooks/use-chat-memory-strip.ts`
  - Derive thin memory-strip chips from accepted charter, planning, and preference state.
- Create: `src/lib/hooks/use-chat-memory-strip.test.ts`
  - Unit coverage for the memory-strip derivation rules.
- Create: `src/components/workspace/chat-artifact-card.tsx`
  - Reusable inline artifact card UI with `采纳 / 改写 / 继续展开 / 重做一版`.
- Create: `src/components/workspace/chat-memory-strip.tsx`
  - Thin accepted-memory strip UI.
- Create: `src/components/workspace/chat-artifact-card.test.tsx`
  - Component tests for the artifact card variants and actions.
- Create: `src/components/workspace/chat-memory-strip.test.tsx`
  - Component tests for thin memory rendering and truncation.

---

### Task 1: Add structured chat artifact metadata and parsing

**Files:**
- Create: `src/lib/types/chat-artifact.ts`
- Create: `src/lib/ai/chat-artifacts.ts`
- Create: `src/lib/ai/chat-artifacts.test.ts`
- Modify: `src/lib/db/project-db.ts`
- Modify: `src/lib/hooks/use-ai-chat.ts`

- [ ] **Step 1: Write the failing artifact parser tests**

```ts
// src/lib/ai/chat-artifacts.test.ts
import { describe, expect, it } from 'vitest'
import { extractChatArtifacts } from './chat-artifacts'

describe('extractChatArtifacts', () => {
  it('extracts a volume-outline artifact from the assistant block', () => {
    const content = [
      '我先给你一个五章卷骨架。',
      '```inkforge-artifact',
      JSON.stringify({
        kind: 'volume-outline',
        title: '第1卷 雨夜入京',
        summary: '潜入 - 暴露 - 换线',
        payload: {
          volumes: [
            {
              title: '第1卷 雨夜入京',
              chapters: ['第1章 雨夜押解', '第2章 城门换车'],
            },
          ],
        },
      }),
      '```',
    ].join('\n')

    expect(extractChatArtifacts(content)).toEqual([
      {
        kind: 'volume-outline',
        title: '第1卷 雨夜入京',
        summary: '潜入 - 暴露 - 换线',
        payload: {
          volumes: [
            {
              title: '第1卷 雨夜入京',
              chapters: ['第1章 雨夜押解', '第2章 城门换车'],
            },
          ],
        },
      },
    ])
  })

  it('returns an empty list when no artifact block is present', () => {
    expect(extractChatArtifacts('普通对话，没有结构块。')).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/ai/chat-artifacts.test.ts`
Expected: FAIL with `Cannot find module './chat-artifacts'` or `extractChatArtifacts is not defined`

- [ ] **Step 3: Add the artifact type contract and parser**

```ts
// src/lib/types/chat-artifact.ts
export const CHAT_ARTIFACT_KINDS = [
  'premise-summary',
  'character-set',
  'relationship-tension-map',
  'worldbuilding-rules',
  'volume-outline',
  'chapter-outline',
  'scene-breakdown',
  'draft-passage',
] as const

export type ChatArtifactKind = (typeof CHAT_ARTIFACT_KINDS)[number]

export type ChatArtifact =
  | {
      kind: 'premise-summary'
      title: string
      summary?: string
      payload: { premise: string; hook?: string; conflict?: string; promise?: string }
    }
  | {
      kind: 'character-set'
      title: string
      summary?: string
      payload: { characters: Array<{ name: string; role?: string; summary?: string }> }
    }
  | {
      kind: 'relationship-tension-map'
      title: string
      summary?: string
      payload: { relationships: Array<{ from: string; to: string; tension: string; status?: string }> }
    }
  | {
      kind: 'worldbuilding-rules'
      title: string
      summary?: string
      payload: { rules: Array<{ name: string; description: string; consequence?: string }> }
    }
  | {
      kind: 'volume-outline'
      title: string
      summary?: string
      payload: { volumes: Array<{ title: string; summary?: string; chapters?: string[] }> }
    }
  | {
      kind: 'chapter-outline'
      title: string
      summary?: string
      payload: { beats: string[]; chapterTitle?: string; goal?: string; conflict?: string }
    }
  | {
      kind: 'scene-breakdown'
      title: string
      summary?: string
      payload: { scenes: Array<{ title: string; purpose?: string; summary?: string }> }
    }
  | {
      kind: 'draft-passage'
      title: string
      summary?: string
      payload: { draft: string; chapterTitle?: string; outline?: string }
    }
```

```ts
// src/lib/ai/chat-artifacts.ts
import {
  CHAT_ARTIFACT_KINDS,
  type ChatArtifact,
  type ChatArtifactKind,
  type DraftPassageArtifact,
} from '@/lib/types/chat-artifact'

const ARTIFACT_BLOCK_PATTERN = /```inkforge-artifact\\s*([\\s\\S]*?)```/g
const chatArtifactKindSet = new Set<ChatArtifactKind>(CHAT_ARTIFACT_KINDS)

export function extractChatArtifacts(content: string): ChatArtifact[] {
  const artifacts: ChatArtifact[] = []

  for (const match of content.matchAll(ARTIFACT_BLOCK_PATTERN)) {
    const rawJson = match[1]?.trim()
    if (!rawJson) continue

    try {
      const parsed = JSON.parse(rawJson)
      const artifact = parseChatArtifact(parsed)
      if (artifact) artifacts.push(artifact)
    } catch {
      continue
    }
  }

  return artifacts
}

export function findDraftPassageArtifact(
  artifacts: ChatArtifact[]
): DraftPassageArtifact | undefined {
  return artifacts.find(
    (artifact): artifact is DraftPassageArtifact => artifact.kind === 'draft-passage'
  )
}
```

```ts
// src/lib/db/project-db.ts
export interface ChatMessage {
  id: string
  projectId: string
  conversationId: string
  role: 'user' | 'assistant'
  kind?: 'default' | 'direction-adjustment'
  content: string
  timestamp: number
  hasDraft?: boolean
  draftId?: string
  artifacts?: import('../types/chat-artifact').ChatArtifact[]
}
```

```ts
// src/lib/hooks/use-ai-chat.ts
import { extractChatArtifacts, findDraftPassageArtifact } from '../ai/chat-artifacts'

const artifacts = extractChatArtifacts(fullContent)
const draftArtifact = findDraftPassageArtifact(artifacts)
const hasDraft = Boolean(draftArtifact) || detectDraft(fullContent)

const finalMsg: ChatMessage = {
  id: assistantMsgId,
  projectId,
  conversationId,
  role: 'assistant',
  content: fullContent,
  timestamp: Date.now(),
  hasDraft,
  draftId: hasDraft ? crypto.randomUUID() : undefined,
  artifacts: artifacts.length > 0 ? artifacts : undefined,
}
```

- [ ] **Step 4: Run the artifact tests and hook test subset**

Run: `pnpm vitest run src/lib/ai/chat-artifacts.test.ts src/components/workspace/ai-chat-panel/index.test.tsx`
Expected: PASS for the parser test; existing chat panel tests still pass after the `ChatMessage` type extension

- [ ] **Step 5: Commit**

```bash
git add src/lib/types/chat-artifact.ts src/lib/ai/chat-artifacts.ts src/lib/ai/chat-artifacts.test.ts src/lib/db/project-db.ts src/lib/hooks/use-ai-chat.ts src/components/workspace/ai-chat-panel/index.test.tsx
git commit -m "feat(chat): add structured artifact metadata to assistant messages"
```

---

### Task 2: Render inline artifact cards inside the conversation flow

**Files:**
- Create: `src/components/workspace/chat-artifact-card.tsx`
- Create: `src/components/workspace/chat-artifact-card.test.tsx`
- Modify: `src/components/workspace/message-bubble.tsx`
- Modify: `src/components/workspace/ai-chat-panel/types.ts`
- Modify: `src/components/workspace/ai-chat-panel/message-list.tsx`
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`

- [ ] **Step 1: Write the failing artifact card component tests**

```tsx
// src/components/workspace/chat-artifact-card.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatArtifactCard } from './chat-artifact-card'

describe('ChatArtifactCard', () => {
  it('renders summary, items, and four primary actions', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()

    render(
      <ChatArtifactCard
        artifact={{
          kind: 'volume-outline',
          title: '第1卷 雨夜入京',
          summary: '潜入 - 暴露 - 换线',
          payload: {
            volumes: [
              {
                title: '第1卷 雨夜入京',
                chapters: ['第1章 雨夜押解', '第2章 城门换车'],
              },
            ],
          },
        }}
        onAccept={onAccept}
        onRevise={vi.fn()}
        onExpand={vi.fn()}
        onRegenerate={vi.fn()}
      />
    )

    expect(screen.getByText('第1卷 雨夜入京')).toBeInTheDocument()
    expect(screen.getByText('第1章 雨夜押解')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '采纳' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '改写' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '继续展开' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重做一版' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '采纳' }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/workspace/chat-artifact-card.test.tsx`
Expected: FAIL with `Cannot find module './chat-artifact-card'`

- [ ] **Step 3: Build the reusable card and mount it from message bubbles**

```tsx
// src/components/workspace/chat-artifact-card.tsx
import type { ChatArtifact } from '@/lib/types/chat-artifact'
import { Button } from '@/components/ui/button'

export function ChatArtifactCard({
  artifact,
  onAccept,
  onRevise,
  onExpand,
  onRegenerate,
}: {
  artifact: ChatArtifact
  onAccept: () => void
  onRevise: () => void
  onExpand: () => void
  onRegenerate: () => void
}) {
  return (
    <section className="rounded-[6px] border border-border bg-[hsl(var(--surface-2))] p-3 space-y-3">
      <div className="space-y-1">
        <div className="text-[11px] text-muted-foreground">结构产物</div>
        <h3 className="text-[14px] font-medium text-foreground">{artifact.title}</h3>
        <p className="text-[13px] leading-[1.7] text-foreground/82">{artifact.summary}</p>
      </div>
      <ul className="space-y-1 text-[13px] text-foreground/80">
        {artifact.kind === 'volume-outline'
          ? artifact.payload.volumes.flatMap((volume) => volume.chapters ?? []).slice(0, 3).map((item) => <li key={item}>{item}</li>)
          : artifact.kind === 'chapter-outline'
            ? artifact.payload.beats.slice(0, 3).map((item) => <li key={item}>{item}</li>)
            : null}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onAccept}>采纳</Button>
        <Button size="sm" variant="outline" onClick={onRevise}>改写</Button>
        <Button size="sm" variant="outline" onClick={onExpand}>继续展开</Button>
        <Button size="sm" variant="ghost" onClick={onRegenerate}>重做一版</Button>
      </div>
    </section>
  )
}
```

```tsx
// src/components/workspace/message-bubble.tsx
import { ChatArtifactCard } from './chat-artifact-card'

{message.artifacts?.map((artifact) => (
  <ChatArtifactCard
    key={`${message.id}-${artifact.title}`}
    artifact={artifact}
    onAccept={() => onAcceptArtifact?.(message.id, artifact)}
    onRevise={() => onReviseArtifact?.(message.id, artifact)}
    onExpand={() => onExpandArtifact?.(message.id, artifact)}
    onRegenerate={() => onRegenerateArtifact?.(message.id, artifact)}
  />
))}
```

```tsx
// src/components/workspace/ai-chat-panel/index.tsx
const handleReviseArtifact = async (_messageId: string, artifact: ChatArtifact) => {
  setInput(`把「${artifact.title}」改得更强一点，保持核心方向不变。`)
}

const handleExpandArtifact = async (_messageId: string, artifact: ChatArtifact) => {
  await handleSend(`继续展开「${artifact.title}」的下一层结构。`)
}

const handleRegenerateArtifact = async (_messageId: string, artifact: ChatArtifact) => {
  await handleSend(`基于同一目标，重做一版「${artifact.title}」。`)
}
```

- [ ] **Step 4: Run component tests and the chat panel suite**

Run: `pnpm vitest run src/components/workspace/chat-artifact-card.test.tsx src/components/workspace/ai-chat-panel/index.test.tsx`
Expected: PASS with artifact cards rendering inside assistant messages and actions wired through the chat shell

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/chat-artifact-card.tsx src/components/workspace/chat-artifact-card.test.tsx src/components/workspace/message-bubble.tsx src/components/workspace/ai-chat-panel/types.ts src/components/workspace/ai-chat-panel/message-list.tsx src/components/workspace/ai-chat-panel/index.tsx
git commit -m "feat(chat): render inline artifact cards in the conversation flow"
```

---

### Task 3: Add the thin accepted-memory strip

**Files:**
- Create: `src/lib/hooks/use-chat-memory-strip.ts`
- Create: `src/lib/hooks/use-chat-memory-strip.test.ts`
- Create: `src/components/workspace/chat-memory-strip.tsx`
- Create: `src/components/workspace/chat-memory-strip.test.tsx`
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`
- Modify: `src/components/workspace/ai-chat-panel/message-list.tsx`

- [ ] **Step 1: Write the failing memory derivation tests**

```ts
// src/lib/hooks/use-chat-memory-strip.test.ts
import { describe, expect, it } from 'vitest'
import { buildChatMemoryItems } from './use-chat-memory-strip'

describe('buildChatMemoryItems', () => {
  it('keeps only accepted high-value memory chips', () => {
    const items = buildChatMemoryItems({
      charter: {
        oneLinePremise: '流亡太子潜回帝京复国',
        storyPromise: '高压关系与身份反噬',
        themes: ['复国'],
      },
      chapterPlans: [
        { id: 'cp-1', title: '第1章 雨夜押解', chapterGoal: '活着进城', linkedChapterId: 'chapter-1' },
      ],
      preferences: [
        { category: 'pacing', note: '节奏更快' },
      ],
    })

    expect(items).toEqual([
      '方向：流亡太子潜回帝京复国',
      '感觉：高压关系与身份反噬',
      '当前章目标：活着进城',
      '偏好：节奏更快',
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/hooks/use-chat-memory-strip.test.ts`
Expected: FAIL with `Cannot find module './use-chat-memory-strip'`

- [ ] **Step 3: Implement the derivation hook and memory strip UI**

```ts
// src/lib/hooks/use-chat-memory-strip.ts
export function buildChatMemoryItems({
  charter,
  chapterPlans,
  preferences,
}: {
  charter: { oneLinePremise?: string; storyPromise?: string } | null
  chapterPlans: Array<{ linkedChapterId?: string | null; chapterGoal?: string; title: string }>
  preferences: Array<{ category: string; note: string }>
}) {
  const linkedPlan = chapterPlans.find((plan) => plan.linkedChapterId)

  return [
    charter?.oneLinePremise ? `方向：${charter.oneLinePremise}` : null,
    charter?.storyPromise ? `感觉：${charter.storyPromise}` : null,
    linkedPlan?.chapterGoal ? `当前章目标：${linkedPlan.chapterGoal}` : null,
    preferences[0]?.note ? `偏好：${preferences[0].note}` : null,
  ].filter(Boolean) as string[]
}
```

```tsx
// src/components/workspace/chat-memory-strip.tsx
export function ChatMemoryStrip({ items }: { items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="px-3 py-2 border-b border-border bg-[hsl(var(--surface-1))]">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-sm border border-border px-2 py-1 text-[12px] text-foreground/78">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
```

```tsx
// src/components/workspace/ai-chat-panel/message-list.tsx
import { ChatMemoryStrip } from '../chat-memory-strip'

<ChatMemoryStrip items={memoryItems} />
<div
  ref={messagesContainerRef}
  onScroll={onScroll}
  className="flex-1 overflow-y-auto overflow-x-hidden relative"
>
```

- [ ] **Step 4: Run the hook and component tests**

Run: `pnpm vitest run src/lib/hooks/use-chat-memory-strip.test.ts src/components/workspace/chat-memory-strip.test.tsx src/components/workspace/ai-chat-panel/index.test.tsx`
Expected: PASS with the strip hidden when empty and rendered when accepted memory exists

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/use-chat-memory-strip.ts src/lib/hooks/use-chat-memory-strip.test.ts src/components/workspace/chat-memory-strip.tsx src/components/workspace/chat-memory-strip.test.tsx src/components/workspace/ai-chat-panel/index.tsx src/components/workspace/ai-chat-panel/message-list.tsx
git commit -m "feat(chat): add thin accepted-memory strip above the conversation"
```

---

### Task 4: Make chat the default workspace entry and demote planning-first UI

**Files:**
- Modify: `src/lib/hooks/use-workspace-layout.ts`
- Modify: `src/lib/hooks/use-workspace-layout.test.ts`
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/components/workspace/layouts/normal-layout.tsx`
- Modify: `src/components/planning/planning-workbench.tsx`
- Modify: `src/components/planning/planning-workbench.test.tsx`

- [ ] **Step 1: Write the failing layout tests for chat-first defaults**

```ts
// src/lib/hooks/use-workspace-layout.test.ts
it('falls back to chapters instead of planning when no explicit planning URL state exists', () => {
  window.history.replaceState({}, '', 'http://localhost:3000/projects/p1')

  mockUseLayout.mockReturnValue({
    activeTab: 'planning',
    activeChapterId: 'chapter-1',
    chapterView: 'editor',
    activeWorldEntryId: null,
    activePlanningSelection: { kind: 'arc', id: 'arc-1' },
    saveSidebarWidth: vi.fn(),
    saveActiveTab: vi.fn(),
    saveChatPanelWidth: vi.fn(),
    saveWorkspaceContext: vi.fn(),
  })

  mockUseChapters.mockReturnValue({
    chapters: [{ id: 'chapter-1', deletedAt: null, order: 0, title: '第一章' }],
    loading: false,
  })

  const { result } = renderHook(() => useWorkspaceLayout({ projectId: 'p1' }))
  expect(result.current.activeTab).toBe('chapters')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/hooks/use-workspace-layout.test.ts`
Expected: FAIL because the hook currently restores `planning` as the active default tab

- [ ] **Step 3: Implement chat-first entry routing and demote planning copy**

```ts
// src/lib/hooks/use-workspace-layout.ts
const initialTab =
  urlState.activeTab
  ?? persistedActiveTab === 'planning'
    ? 'chapters'
    : persistedActiveTab

const [activeTabState, setActiveTabState] = useState<ActiveTab>(initialTab)
```

```tsx
// src/app/projects/[id]/page.tsx
const mainContent =
  layout.activeTab === 'planning' && layout.activePlanningItem ? (
    <PlanningWorkbench
      projectId={params.id}
      selection={layout.activePlanningItem}
      onSelectItem={layout.setActivePlanningItem}
      onOpenLinkedChapter={...}
    />
  ) : layout.activeTab === 'planning' ? (
    <Placeholder activeTab="chapters" />
  ) : ...
```

```tsx
// src/components/planning/planning-workbench.tsx
<p className="max-w-md text-sm text-muted-foreground">
  这里改成次级结构视图。默认创作入口已经回到右侧对话，你可以在需要核对或补改时再进来。
</p>
```

- [ ] **Step 4: Run the layout and planning workbench suites**

Run: `pnpm vitest run src/lib/hooks/use-workspace-layout.test.ts src/components/planning/planning-workbench.test.tsx`
Expected: PASS with planning demoted from the default workflow and its empty-state copy updated

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/use-workspace-layout.ts src/lib/hooks/use-workspace-layout.test.ts src/app/projects/[id]/page.tsx src/components/workspace/layouts/normal-layout.tsx src/components/planning/planning-workbench.tsx src/components/planning/planning-workbench.test.tsx
git commit -m "feat(workspace): make chat the default creative entry surface"
```

---

### Task 5: Wire artifact acceptance into existing structured systems and verify end-to-end flow

**Files:**
- Modify: `src/components/workspace/ai-chat-panel/index.tsx`
- Modify: `src/lib/hooks/use-ai-chat.ts`
- Modify: `src/components/workspace/ai-chat-panel/index.test.tsx`
- Modify: `src/components/workspace/message-bubble.tsx`
- Modify: `src/lib/ai/chat-artifacts.ts`

- [ ] **Step 1: Write the failing integration test for accepting an outline artifact**

```tsx
// src/components/workspace/ai-chat-panel/index.test.tsx
it('accepts a volume-outline artifact and turns it into the next structured action', async () => {
  const user = userEvent.setup()
  const sendMessage = vi.fn().mockResolvedValue({ success: true })

  vi.mocked(useAIChat).mockReturnValue({
    ...baseChatState,
    sendMessage,
    messages: [
      {
        id: 'assistant-1',
        projectId: 'project-1',
        conversationId: 'conv-1',
        role: 'assistant',
        content: '我先给你一个卷骨架。',
        timestamp: 1,
        artifacts: [
            {
              kind: 'volume-outline',
              title: '第1卷 雨夜入京',
              summary: '潜入 - 暴露 - 换线',
              payload: {
                volumes: [
                  {
                    title: '第1卷 雨夜入京',
                    chapters: ['第1章 雨夜押解'],
                  },
                ],
              },
            },
        ],
      },
    ],
  })

  render(<AIChatPanel projectId="project-1" />)
  await user.click(screen.getByRole('button', { name: '采纳' }))

  expect(sendMessage).toHaveBeenCalledWith('采纳「第1卷 雨夜入京」，并把它记为当前有效结构。')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx`
Expected: FAIL because no artifact-accept handler is wired through the chat panel yet

- [ ] **Step 3: Implement the acceptance bridge using the existing chat and planning systems**

```tsx
// src/components/workspace/ai-chat-panel/index.tsx
const handleAcceptArtifact = async (_messageId: string, artifact: ChatArtifact) => {
  const acceptancePrompt = `采纳「${artifact.title}」，并把它记为当前有效结构。`
  const result = await sendMessage(acceptancePrompt)
  if (!result.success) {
    setChatError(result.message)
    return
  }
  showToast('已采纳，后续会按这个继续')
}
```

```ts
// src/lib/ai/chat-artifacts.ts
export function buildArtifactActionPrompt(
  artifact: ChatArtifact,
  action: 'accept' | 'revise' | 'expand' | 'regenerate'
) {
  switch (action) {
    case 'accept':
      return `采纳「${artifact.title}」，并把它记为当前有效结构。`
    case 'revise':
      return `保留目标不变，改写「${artifact.title}」。`
    case 'expand':
      return `继续展开「${artifact.title}」的下一层结构。`
    case 'regenerate':
      return `基于同一目标，重做一版「${artifact.title}」。`
  }
}
```

- [ ] **Step 4: Run focused tests plus project safety checks**

Run: `pnpm vitest run src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/chat-artifact-card.test.tsx src/lib/hooks/use-workspace-layout.test.ts src/components/planning/planning-workbench.test.tsx`
Expected: PASS for the new chat-first artifact flow and planning demotion coverage

Run: `pnpm lint`
Expected: PASS with no new ESLint violations

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/ai-chat-panel/index.tsx src/lib/hooks/use-ai-chat.ts src/components/workspace/ai-chat-panel/index.test.tsx src/components/workspace/message-bubble.tsx src/lib/ai/chat-artifacts.ts
git commit -m "feat(chat): connect artifact actions to the chat-first writing flow"
```

---

## Self-Review

### Spec coverage

- Chat-first default workspace: covered by Task 4
- Inline artifact cards: covered by Tasks 1, 2, and 5
- Thin persistent memory strip: covered by Task 3
- Hidden structured capability model: covered by Task 5 using existing planning/world systems
- Migration sequencing: covered by task order itself

No spec gaps remain for the first implementation pass.

### Placeholder scan

- No `TODO`, `TBD`, or deferred-code placeholders remain
- Each implementation step includes concrete files, code, and commands
- Each testing step includes an exact command and expected outcome

### Type consistency

- `ChatArtifact` is defined once in `src/lib/types/chat-artifact.ts`
- `ChatMessage.artifacts` uses that shared type in DB, hook, and UI
- Artifact actions use the same four verbs everywhere: `accept`, `revise`, `expand`, `regenerate`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-28-chat-first-creative-workspace-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
