# TODOS.md

Deferred work from /autoplan review of v0.3 Sharpen the Spine (2026-04-20).

## P2 — Post-v0.3

### Chapter-level RAG indexing — partially addressed in T7 rescope
- **What:** Move from world-entry-only embeddings to full chapter content embeddings. Chunked per chapter (500-1000 CJK chars per chunk), reuse existing `Embedder` interface + `vector-store`.
- **Why:** Unlocks the 12-month trajectory bet ("AI reads your 5M 字"). Currently AI has WorldEntry context but not chapter continuity.
- **Pros:** Citations can reference specific earlier chapter passages. Contradictions can detect cross-chapter plot holes. Hybrid search meaningfully improves.
- **Cons:** Storage growth ~10x; embedding call volume increases proportionally.
- **Context:** T7 rescope (accepted at /autoplan gate 2026-04-20) delivers: `indexChapters()` + `lastIndexedAt` observability field. Downstream work = wiring chapter-search into AI context-injection.
- **Depends on:** T7 landing; then chapter-search must integrate with `use-context-injection.ts` token budget (currently 4000 tokens, all WE — needs split).

### editedPct precise diff-algorithm spec
- **What:** Document exact algorithm for T1's `draftEditedPct` computation. Three options: char-count delta, fast-diff LCS, semantic diff.
- **Why:** Different algorithms give wildly different results for the same edit. Reproducibility requires a spec.
- **Pros:** Telemetry data is comparable across users and time.
- **Cons:** Adds ~1 day documentation work.
- **Context:** /autoplan Phase 1 CEO-7B picked fast-diff or char-count delta (NOT LCS). Document which + why + edge cases (insertion-only, deletion-only, mixed).
- **Depends on:** T1 implementation decision.

### T8 cache-hit-rate display
- **What:** Show `(cacheReadTokens / (cacheReadTokens + inputTokens)) * 100%` aggregated over 30 days in dev-stats drawer.
- **Why:** After T10 flips `extendedCacheTtl` default on, users can't verify they're actually getting the 1-hour cache. BYOK users need this for cost-tracking.
- **Pros:** Proves T10 value concretely. ~15 min CC.
- **Cons:** None.
- **Context:** /autoplan CEO-8A recommended adding this.
- **Depends on:** T8 dev-stats panel landing.

## P3 — v0.4 candidates

### 多 provider UI 简化
- **What:** Hide OpenAI-compatible provider configuration behind an "Advanced" accordion in AIConfigDialog. Default UI shows Anthropic only.
- **Why:** Current UI exposes both equally; 90% of users are on Anthropic. Anthropic-only simplification reduces first-run friction.
- **Pros:** Cleaner onboarding. Drop visual weight in the most-accessed dialog.
- **Cons:** Power users (DeepSeek/SiliconFlow/LiteLLM) need to click one more level.
- **Context:** Pre-existing deferral from plan. v0.4 candidate.
- **Depends on:** None.

### T1 structured draft signal (upgrade from heuristic)
- **What:** Replace `detectDraft()` heuristics with a structured field from the AI provider stream (e.g., Claude tool-use with explicit `offer_draft` tool).
- **Why:** Current heuristic ("以下是草稿" / "插入到编辑器" / "续写如下" substring match) has false negatives and collides with natural prose.
- **Pros:** Reliability. False-negatives drop to ~0.
- **Cons:** Changes Anthropic tool-use surface; only works with Anthropic provider.
- **Context:** /autoplan ENG-2A noted this. Ship T1 with heuristic first; validate adoption numbers; then invest in structured signal if adoption is real.
- **Depends on:** T1 telemetry data showing draft adoption is a real user behavior.

## Notes

- This file is seeded by /autoplan per ENG-1B (it didn't exist before v0.3 review).
- Future /autoplan invocations will append to this file.
- Items removed from this list when shipped — don't leave stale lines.
