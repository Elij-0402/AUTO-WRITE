# Phase 1: AI Writing Assistant — Draft Generation & Consistency Scanning

Generated: 2026-04-22
Status: Implemented
Branch: featuredev

## Overview

Phase 1 delivers two complementary AI-powered writing assistance features:

1. **Chapter Draft Generation** — AI generates structured chapter drafts from outline
2. **Proactive Consistency Scanning** — AI scans chapters against world bible entries for contradictions

These two features work together: draft generation creates content with world bible context injection, while consistency scanning detects contradictions in existing content.

---

## Feature A: Chapter Draft Generation

### Problem

InkForge had AI-powered chat with world bible context injection, but users could not generate structured chapter drafts. The `draft-card.tsx` UI existed but no generation pipeline.

### Solution

A new `chapter_draft` tool and `useChapterDraftGeneration` hook that generates chapter drafts via `streamChat()`, with automatic text insertion into the Tiptap editor.

### Architecture

```
User clicks "Generate Draft"
  → ChapterDraftDialog (outline input, word count, title)
  → useChapterDraftGeneration.startGeneration()
  → streamChat() with CHAPTER_DRAFT_SCHEMA tool
  → AI generates draft with world bible context
  → Draft extracted from tool_call or text fallback
  → EditorHandle.insertText() inserts at cursor
  → User accepts/dismisses via draft card UI
```

### New Files

| File | Purpose |
|------|---------|
| `src/lib/ai/tools/schemas.ts` | Added `CHAPTER_DRAFT_SCHEMA` |
| `src/lib/ai/prompts.ts` | Added `CHAPTER_DRAFT_INSTRUCTION` |
| `src/lib/hooks/use-chapter-draft-generation.ts` | Draft generation hook |
| `src/components/workspace/chapter-draft-dialog.tsx` | Draft generation UI |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/ai/providers/anthropic.ts` | Extended `buildSystemBlocks` for `chapterDraftContext` |
| `src/components/workspace/workspace-topbar.tsx` | Added "Generate Draft" button |
| `src/app/projects/[id]/page.tsx` | Integrated ChapterDraftDialog |

### Key Interfaces

```typescript
// Hook return
interface UseChapterDraftGenerationReturn {
  state: 'idle' | 'generating' | 'draft_ready' | 'accepted' | 'dismissed'
  draft: string | null
  error: string | null
  progress: string | null
  startGeneration: (opts: { chapterId: string | null; outline: string; targetWordCount?: [number, number]; chapterTitle?: string }) => Promise<void>
  acceptDraft: () => void
  dismissDraft: () => void
  cancelGeneration: () => void
}
```

### State Machine

```
idle → generating → draft_ready → accepted
                              ↘ dismissed
```

### Prompt Segment

`CHAPTER_DRAFT_INSTRUCTION` is injected as a separate system prompt segment, combining:
- BASE_INSTRUCTION (writing assistant role)
- worldBibleContext (relevant world entries)
- CHAPTER_DRAFT_INSTRUCTION (draft generation task)

### Draft Extraction

Two extraction strategies:
1. **Tool extraction**: AI calls `chapter_draft` tool, draft extracted from tool input
2. **Text fallback**: If tool not called, search for "以下是草稿" marker in response text

### Integration

- "Generate Draft" button in workspace topbar (PenLine icon)
- ChapterDraftDialog: outline textarea, word count presets (1000-2000 / 2000-3000 / 3000-5000 / custom), optional title
- On accept: `editor.insertText(draft)` at current cursor position

---

## Feature D: Proactive Consistency Scanning

### Problem

Contradiction detection only fired during chat (via `report_contradiction` tool). Users had to manually describe plot points in chat to discover inconsistencies.

### Solution

Direct API scanning that reads chapter content + world entries, returns structured violations, persists to `contradictions` table with 7-day dedup.

### Architecture

```
User opens Scanner tab
  → Selects chapter(s) or "scan all"
  → startScan(chapterIds)
  → For each chapter: scanConsistency() via Direct API
  → AI returns JSON array of violations
  → Filter by exemptions + 7-day dedup
  → Persist to contradictions table
  → Display grouped results UI
```

### New Files

| File | Purpose |
|------|---------|
| `src/lib/ai/scan-consistency.ts` | Direct API scanning function |
| `src/lib/hooks/use-consistency-scan.ts` | Scanning hook with state management |
| `src/components/analysis/consistency-scanner.tsx` | Scanner UI component |

### Modified Files

| File | Change |
|------|--------|
| `src/app/projects/[id]/analysis/page.tsx` | Added "scanner" tab with ShieldCheck icon |

### Key Interfaces

```typescript
// Violation type
interface ConsistencyViolation {
  entryName: string
  entryType: 'character' | 'location' | 'rule' | 'timeline'
  description: string
  severity: 'high' | 'medium' | 'low'
}

// Hook return
interface UseConsistencyScanReturn {
  state: 'idle' | 'scanning' | 'results_ready' | 'error'
  results: ConsistencyViolation[]
  progress: { current: number; total: number } | null
  startScan: (chapterIds: string[]) => Promise<void>
  exemptResult: (violation: ConsistencyViolation) => Promise<void>
  cancelScan: () => void
  clearResults: () => void
}
```

### Direct API Mode

Unlike chat-based detection (which uses `streamChat()` with tool callbacks), scanning uses Direct API:

```typescript
const response = await fetch(config.baseUrl + '/messages', {
  method: 'POST',
  headers: { 'x-api-key': config.apiKey, ... },
  body: JSON.stringify({
    model: config.model,
    max_tokens: 4096,
    system: scanSystemPrompt,
    messages: [{ role: 'user', content: `请扫描章节"${chapterTitle}"...` }]
  })
})
```

This avoids modifying `streamChat()` internals and is appropriate since scanning doesn't need streaming.

### Scan System Prompt

```
【一致性扫描任务】
你是一个严格的世界观审计员...

【章节内容】
标题：${chapterTitle}
内容：${chapterContent}

${worldBibleBlock}

【输出格式】
JSON 数组，每个矛盾包含 entryName, entryType, description, severity
```

### Deduplication Strategy

Two dedup mechanisms:
1. **Exemption key** — `consistencyExemptions` table has `{exemptionKey: "${entryName}:${entryType}"}`, permanently exempts entry type
2. **7-day window** — `contradictions` table dedups by `entryName + description` within 7 days

### UI Design

Scanner tab shows:
- Chapter selector dropdown + "scan all" checkbox
- Progress bar during scan
- Results grouped by entry name
- Each violation shows severity badge, description, "豁免" button
- Empty state when no violations found

---

## Shared Patterns

### API Key Validation

Both features validate `config.apiKey` before proceeding:
- If missing: sets error state with "还没设置 API 密钥"
- If OpenAI-compatible without baseUrl: sets error with "还没填写接口地址"

### Abort Handling

Both hooks support cancellation via `AbortController`:
- `cancelGeneration()` / `cancelScan()` aborts in-flight requests
- AbortError caught and handled gracefully (returns to idle)

### World Bible Context

Both features inject world bible entries into AI prompts:
- Draft generation: `buildSegmentedSystemPrompt()` with `chapterDraftInstruction`
- Scanning: `buildWorldBibleBlock()` inline in system prompt

---

## Testing Notes

Manual testing checklist:
- [ ] Draft generation: open project → click "生成草稿" → enter outline → verify draft inserted
- [ ] Draft cancellation: start generation → click cancel → verify returns to idle
- [ ] Scanner: create world entries → write contradictory chapter → run scan → verify violations detected
- [ ] Scanner exemption: scan → click "豁免" → verify entry removed from results
- [ ] Scanner cancellation: start full scan → cancel mid-way → verify partial results cleared

---

## Known Issues

- Pre-existing type error in `chapter-draft-dialog.tsx:86` (not introduced by this phase)
- OpenAI-compatible provider support untested for scan-consistency Direct API path

---

## Future Work (Phase 2)

- **F: Real-time inline consistency warnings** — local rule engine in Tiptap editor
- **B: Semantic context injection** — replace keyword matching with embeddings

---

## Files Changed

```
src/lib/ai/tools/schemas.ts                        [modified]
src/lib/ai/prompts.ts                             [modified]
src/lib/ai/providers/anthropic.ts                 [modified]
src/lib/ai/scan-consistency.ts                    [new]
src/lib/hooks/use-chapter-draft-generation.ts      [new]
src/lib/hooks/use-consistency-scan.ts              [new]
src/components/workspace/workspace-topbar.tsx     [modified]
src/components/workspace/chapter-draft-dialog.tsx   [new]
src/components/analysis/consistency-scanner.tsx    [new]
src/app/projects/[id]/page.tsx                    [modified]
src/app/projects/[id]/analysis/page.tsx             [modified]
```
