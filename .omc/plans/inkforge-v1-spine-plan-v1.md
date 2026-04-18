# Ralplan Consensus Plan: InkForge v1 Spine Hardening

**Input spec**: `.omc/specs/deep-interview-inkforge-v1-spine-audit.md` (Deep Interview, 6 轮, ambiguity 7.5%)
**Mode**: `--direct` (interview already done) + `--consensus` (Planner → Architect → Critic)
**Date**: 2026-04-19
**Model execution note**: Agent subsystem upstream failures ("1M 上下文" 500, nil-pointer panic) prevented spawning separate Planner / Architect / Critic sub-agents. Consensus roles performed **inline and sequentially** by the main session with explicit role switches. Redo with formal agents recommended when infrastructure recovers.

---

## 🔎 Brownfield Reality Correction

The Deep Interview spec assumed the AI layer was using plain messages API without prompt caching. **Code read proves otherwise**:

| Spec Assumption | Code Reality (verified this session) |
|---|---|
| AC-2 caching not implemented | ✅ **Already implemented**: `anthropic.ts:96-114` attaches `cache_control: { type: 'ephemeral' }` to both `baseInstruction` and `worldBibleContext` blocks; `prompts.ts` designs `SegmentedSystemPrompt` specifically for cache reuse |
| No cache metric tracking | ✅ **Already tracked**: `use-ai-chat.ts:215-218, 329-338` records `cacheReadTokens` and `cacheWriteTokens` per call; `project-db.ts:119-134` (v11) has `aiUsage` table persisting these |
| DB schema v4 (per CLAUDE.md) | ⚠️ **Actually v11**: `project-db.ts` shows version chain up to v11. CLAUDE.md is stale — must update as part of this plan |
| World-bible passed as plain text | ⚠️ **True for now**: `prompts.ts:73-79` still embeds world-bible as a `text` block inside `system: []`, not as a `document` block in `messages[].content`. **This is the actual blocker for Citations API** |
| Rolling summary / compaction | ✅ **Already implemented**: `use-ai-chat.ts:262-305` summarizes older messages every 6 turns |
| Sliding window | ✅ `WINDOW_SIZE = 10` at `use-ai-chat.ts:163` |
| Tool use (suggest_entry / suggest_relation / report_contradiction) | ✅ Already wired via `ALL_TOOL_SCHEMAS` |

**Net effect on plan**: AC-2 shrinks from "build caching" to "extend caching" (1-hour TTL header + cache-hit-rate UI + verification test). **AC-1 Citations API remains the largest net-new surface** — it requires migrating world-bible from `system` text block to `messages[].content` document block with `citations: { enabled: true }`.

---

## Stage 1 · Planner — Initial Plan + RALPLAN-DR Summary

### RALPLAN-DR Summary

**Principles** (5)
1. **Native primitives over custom logic** — use Anthropic's Citations API, not a home-grown citation parser
2. **Build on existing foundation** — current segmented prompt + rolling summary + RAG + tool use + aiUsage are already correct; avoid greenfield rewrites
3. **Feature flags gate risk** — no breaking user changes without A/B gradation
4. **Experimental != deleted** — surface pruning isolates, never removes, keeping future reactivation cheap
5. **Tests track spine, not all functionality** — AC-1/AC-2/AC-5 are spine-critical; coverage investment ranks there first

**Decision Drivers** (top 3)
1. **Structural grounding beats prompt begging** — Citations API produces verifiable source linkage; any lexical-blacklist approach is fragile and reopens the "AI flavor" debate on every model update
2. **Scale verification is the existence threshold** — if RAG query p95 > 800ms at 500×300, the spine fails regardless of any other AC passing
3. **Two IndexedDB databases + BYOK** — the migration path must respect per-project data isolation and avoid force-syncing AI config across tabs

**Viable Options** (≥2)

**Option A — Full three-layer rollout (spec's original recommendation)**
- Pros: Maximum Anthropic-native engineering; aligns with user's "2026 best practices" ask; citations + caching + thinking compound benefits
- Cons: Surface area across `providers/anthropic.ts`, `prompts.ts`, `use-ai-chat.ts`, `project-db.ts` (schema bump), `ai-usage-queries.ts`, UI `message-bubble.tsx`; 7-10 day estimate
- Risk: Extended thinking costs tokens; if poorly gated, BYOK users see bills spike

**Option B — Citations-only MVP (Simplifier)**
- Pros: Smallest structural change delivering spine value ("world-bible grounding"); caching already exists; thinking can wait
- Cons: Leaves half the "2026 best practices" story on the table; user explicitly asked for all three
- Risk: Shipping an MVP that doesn't visibly meet user's "best practices" mandate

**Option C — Citations + Extended-cache-TTL + A/B harness** ⭐ **RECOMMENDED**
- Pros: Delivers the novel capability (Citations); upgrades existing caching to 1-hour TTL (meaningful for long writing sessions); A/B harness lets thinking be added safely in a follow-up; respects the "A/B gate" constraint user set in Round 6
- Cons: Extended Thinking is deferred to a v1.1 but scoped in this plan
- Risk: Minimal — citations is a pure additive migration if wrapped in a feature flag

**Invalidation of Option A**: The user's Round 6 answer ("接受但要 A/B 测试") invalidates rolling all three layers into a non-gated launch. Option A is viable **as a final destination**, not as the v1 scope.

**Invalidation of Option B**: The user explicitly asked for "2026 最新 harness anthropic 工程构建的工程学设计" — Citations alone is not "harness-level." A/B tracking and cache TTL optimization are part of engineering maturity.

**Chosen**: **Option C** — Citations API (new) + extended-cache-TTL upgrade + A/B harness. Extended Thinking scoped for v1.1 with feature flag already in place.

---

## Stage 2 · Architect Review

**Architect stance**: Steelman the antithesis, surface tradeoff tensions, propose synthesis.

**Strongest antithesis to Option C**:
> "The user wanted all three layers. Shipping only Citations + cache TTL leaves the spec visibly incomplete. If InkForge positions against Sudowrite with '2026 engineering,' Extended Thinking is the reasoning differentiator — Sudowrite doesn't use it either. Deferring it to v1.1 lets a competitor ship first."

**Rebuttal**: Extended Thinking's benefit in this product is concentrated in consistency-check (`check_consistency` tool flow), which is a **narrow trigger** — not every message. A/B harness lets us **measure** citation grounding's consistency-gain first; if post-launch data shows residual hallucination rate above goal, thinking lands in v1.1 with targeted data. Shipping thinking blind adds ~$0.003-0.01/call in thinking tokens with no validated gain.

**Real tradeoff tension**:
- **Token cost vs engineering completeness**: thinking is 3-5× more expensive per consistency check; without A/B data we can't tell BYOK users whether the cost is worth it
- **Schema migration safety vs minimal diff**: world-bible moving from `system` text to `messages[].content` document is a prompt structural change; it affects cache-key — existing 5-min cache entries get invalidated on first deploy (one-time hit, recovers within minutes)
- **Citations rendering in UI vs current `message-bubble.tsx` simplicity**: citations are a content-block-level concept; UI must split rendering into cited vs non-cited spans

**Principle violations flagged**: None — Option C respects all five principles.

**Synthesis**:
- Adopt Option C as scope
- Add **explicit v1.1 follow-up for Extended Thinking** with an Architect-defined trigger condition: "When A/B data from 100+ consistency checks shows residual hallucination rate > 5%, enable thinking on `check_consistency` flow"
- Add a **one-time cache-warmup telemetry** the first deploy to confirm cache recovery time

**Architect Verdict**: **Approve Option C with synthesis additions** → forward to Critic.

---

## Stage 3 · Critic Evaluation

**Critic stance**: Enforce principle-option consistency, fair alternatives, risk-mitigation clarity, testable acceptance criteria, concrete verification steps.

**Principle-option consistency check**: ✅ All 5 principles traceable to the plan (native primitive use, builds on existing, flag-gated, experimental isolation, spine-focused testing).

**Fair alternative coverage**: ✅ Options A/B/C all presented with real pros/cons; invalidation rationale given.

**Risk-mitigation clarity**: ⚠️ Partial. The plan doesn't address:
1. What happens if Citations API returns zero citations for a message that **should** have citations (false-negative / grounding failure)?
2. What if users on Haiku 3 (unsupported) or OpenAI-compatible provider (no citations support) — does the plan preserve their path?
3. Dexie schema bump requires migration; what's the rollback plan if v12 upgrade corrupts data?

**Testable acceptance criteria**: ⚠️ Mostly yes, but:
- AC-1's "≥ 95% responses contain valid citations" needs the fixture dataset specified (20 entries is fine, but the 10-question set must be deterministic and checked into repo)
- AC-5's p95 < 800ms needs the hardware baseline (dev machine vs CI runner) specified

**Concrete verification steps**: ✅ File paths given, test files named, but no specific commands. Should include:
- `pnpm test src/lib/ai/citations.integration.test.ts` as the named verifier for AC-1
- `pnpm test src/lib/rag/scale.perf.test.ts -- --reporter=verbose` for AC-5

**Critic Verdict**: **ITERATE** — plan is close but missing (a) fallback handling for unsupported providers, (b) schema rollback, (c) fixture determinism, (d) concrete verification commands. Revise and re-run Architect+Critic.

---

## Stage 4 · Revised Planner Output (after Critic iteration)

### Added risk mitigations

**R1 — Citations false-negative (grounding failure)**
- Detect via `emptyCitationRate` metric (already in AC-4). Target: < 10% per conversation
- UI treatment: if a message has 0 citations despite referencing known WorldEntry names (detected by the existing `extractKeywords` function in `use-context-injection.ts`), show a subtle "未溯源" badge rather than blocking display
- Escalation: if average emptyCitationRate > 20% across 50 messages, auto-disable citations flag for that user cohort and alert

**R2 — Unsupported provider fallback**
- Citations API is Anthropic-only in scope; OpenAI-compatible provider stays on current text-block system prompt (documented in spec Non-Goals section)
- Feature flag `experimentFlags.citations` auto-derived as `false` when `config.provider !== 'anthropic'`
- No code path breaks for OpenAI-compatible users

**R3 — Dexie schema rollback**
- v12 migration only **adds** tables/columns; never removes or renames existing ones
- New tables: `abTestMetrics` (per-message experiment group + metrics)
- Modified tables: none. `aiUsage` already has `cacheReadTokens` / `cacheWriteTokens`; we reuse as-is
- Rollback: user can downgrade to v11 by clearing IndexedDB for that project (data loss warning shown); no auto-rollback, but schema changes are purely additive so v11 code reading a v12 DB will simply ignore new tables

### Fixture determinism (for AC-1 verification)

- **File**: `src/lib/ai/__fixtures__/citations-golden.json`
- 20 WorldEntries (mix: 8 characters, 5 locations, 4 rules, 3 timeline events) with Chinese-realistic names, descriptions
- 10 pre-written user questions referencing these entries (e.g., "李四的眼睛是什么颜色？")
- 10 pre-recorded expected citation outputs (document_index + start_block_index ranges)
- Test runner compares actual Claude response citations to expected ranges with tolerance ±2 blocks (for rephrasing resilience)

### Concrete verification commands

```bash
# AC-1 Citations integration test
pnpm test src/lib/ai/citations.integration.test.ts

# AC-5 Scale performance test (non-CI; dev machine baseline documented)
pnpm test src/lib/rag/scale.perf.test.ts -- --reporter=verbose

# AC-4 A/B harness smoke
pnpm test src/lib/ai/ab-metrics.test.ts

# AC-7 Hygiene
pnpm lint && pnpm test
```

### Hardware baseline for AC-5

- **Target machine**: dev laptop with ≥ 16GB RAM + M-series or Intel i7-equivalent CPU
- **Browser**: Chromium 130+ (Playwright default)
- **Ignored**: network latency (RAG hybrid-search is local IndexedDB-bound; Anthropic API calls are gated separately in AC-3 follow-up)

---

## Stage 5 · Critic Re-evaluation (iteration 2)

**Re-check**:
- ✅ R1/R2/R3 mitigations clear
- ✅ Fixture determinism specified with file path
- ✅ Verification commands concrete
- ✅ Hardware baseline documented

**Critic Verdict**: **APPROVE** → ready for ADR.

---

## Final ADR (Architecture Decision Record)

**Decision**: Implement InkForge v1 spine using **Option C — Citations API + Extended Cache TTL + A/B Harness**. Extended Thinking scoped as v1.1 with data-driven trigger.

**Drivers**:
1. Structural grounding via Anthropic's native Citations API is the strongest anti-hallucination primitive available
2. User's A/B-gate mandate from Round 6 requires measurable rollout, not blind deployment
3. Existing brownfield foundation (segmented caching, aiUsage, tool use, rolling summary) is correct and extendable — don't rewrite what works

**Alternatives considered**:
- Option A (full three-layer): deferred on A/B-gate grounds
- Option B (Citations-only): falls short of "2026 engineering" mandate
- Lexical blacklist for AI-slop: rejected on evidence (superficial, no native primitive)
- Style anchoring: rejected on ROI (KL-divergence pipeline is high-cost)

**Why chosen**:
- Citations delivers 80% of spine value (grounding)
- Cache TTL upgrade is a one-line header change with high-value long-session impact
- A/B harness makes Extended Thinking (v1.1) addition risk-free

**Consequences**:
- **Positive**: Clear differentiation vs Sudowrite (neither has citations-enforced grounding); cost-neutral improvements (citations' `cited_text` doesn't count as output tokens); forward-compatible with Extended Thinking
- **Negative**: Schema v12 bump requires migration testing; OpenAI-compatible users see no grounding improvement (acceptable — Non-Goal)
- **Neutral**: Requires UI refactor in `message-bubble.tsx` for citation rendering

**Follow-ups**:
1. **v1.1**: Enable Extended Thinking on `check_consistency` flow if emptyCitationRate or residual-hallucination data warrants
2. **v1.2**: Consider Files API for world-bibles > 500KB (current inline limit)
3. **v1.3**: Citations-gated "draft insertion" button in editor (UI follows v1 AI data)

---

## Phased Implementation Breakdown

### Phase A — Hygiene + Foundation (Day 1, ~2 hours)
**Files**:
- `src/components/workspace/new-entry-dialog.tsx` (lines 54, 56): remove unused `setAlias` / `setPersonality`
- `src/components/workspace/ai-chat-panel.tsx` (lines 102, 103): remove unused `setExistingEntry` / `setDuplicateEntryName`
- `CLAUDE.md`: update "schema version 4" → "schema version 11" + note new experimentFlags

**Gate**: `pnpm lint` green, `pnpm test` green.
**Risk**: None.
**Rollback**: `git revert`.

### Phase B — A/B Harness Scaffolding (Day 1-2, ~4 hours)
**New files**:
- `src/lib/ai/experiment-flags.ts` — type definitions + default flag resolver
- `src/lib/db/ab-metrics-queries.ts` — new `abTestMetrics` table queries
- `src/lib/ai/experiment-flags.test.ts`

**Modified files**:
- `src/lib/db/project-db.ts`: add schema v12 with `abTestMetrics` table (additive only)
- `src/lib/hooks/use-ai-config.ts`: expose `experimentFlags` from AIConfig
- `src/lib/hooks/use-ai-chat.ts`: log per-message metric with `experimentGroup`
- `src/components/workspace/ai-config-dialog.tsx`: 3 toggles (citations / extended-cache-ttl / thinking — thinking stub visible but disabled)

**Gate**: New table created in fake-indexeddb tests without existing data loss; config dialog renders toggles; messages log `experimentGroup`.
**Risk**: Schema migration; mitigated by additive-only.
**Rollback**: Hide toggles; v12 can be ignored by v11 code (additive safe).

### Phase C — Citations API Migration (Day 2-4, ~10 hours) ⭐ **Largest phase**
**Files**:
- `src/lib/ai/providers/anthropic.ts` (rewrite ~60 lines): when `experimentFlags.citations === true`, move world-bible from `system` text block to `messages[-1].content` as `{ type: "document", source: { type: "content", content: [...entries...] }, citations: { enabled: true }, cache_control: { type: "ephemeral" } }`. Each WorldEntry becomes 1 content block (use existing `formatEntryForContext` from `use-context-injection.ts`).
- `src/lib/ai/prompts.ts`: extend `SegmentedSystemPrompt` to carry `worldBibleAsDocument` variant alongside current text version. Callers pick based on flag.
- `src/lib/ai/events.ts`: extend `AIEvent` with new event type `citation` carrying `{ documentIndex, startBlockIndex, endBlockIndex, citedText }`.
- `src/lib/hooks/use-ai-chat.ts`: handle `citations_delta` in stream; attach `citations[]` to the assistant `ChatMessage`.
- `src/lib/db/project-db.ts`: extend `ChatMessage` with optional `citations?: Citation[]` field (schema v12.1, additive to message record — no table change).
- `src/components/workspace/message-bubble.tsx`: render cited spans as clickable links that scroll/highlight the referenced WorldEntry in the world-bible tab.

**New files**:
- `src/lib/ai/citations.ts` — citation parser + validation
- `src/lib/ai/__fixtures__/citations-golden.json` — 20-entry fixture + 10-question test set
- `src/lib/ai/citations.integration.test.ts` — AC-1 verifier (uses Anthropic API mock or replay fixture)
- `src/components/workspace/citation-chip.tsx` — reusable citation UI primitive

**Gate**: AC-1 verifier ≥ 95% pass rate on fixture. Existing `use-ai-chat.test.ts` still green (citations flag false path unchanged).
**Risk (R1)**: False-negative grounding — mitigated by emptyCitationRate metric + soft "未溯源" badge fallback.
**Risk (R2)**: OpenAI-compatible path — mitigated by auto-false flag; code path unchanged for those users.
**Rollback**: Flip `experimentFlags.citations` to false in AIConfig default; code path reverts to text-block system prompt.

### Phase D — Extended Cache TTL (Day 4, ~2 hours)
**Files**:
- `src/lib/ai/providers/anthropic.ts`: when `experimentFlags.extendedCacheTtl === true`, add `anthropic-beta: extended-cache-ttl-2025-04-11` header via `client.messages.stream(params, { headers })`
- `src/lib/db/ai-usage-queries.ts`: add `computeCacheHitRate(events: AIUsageEvent[]): number` (cacheRead / (cacheRead + input))

**New files**:
- `src/components/analysis/ai-usage-dashboard.tsx` — minimal cache hit rate + cost-by-day chart for `/projects/[id]/analysis`

**Gate**: 1-hour TTL request succeeds (no 4xx); dashboard shows non-zero cache hit rate after 2 consecutive messages.
**Risk**: Beta header may be deprecated; mitigate with feature flag + fallback to default TTL.
**Rollback**: Toggle flag off.

### Phase E — Scale Fixture + Perf Tests (Day 4-5, ~4 hours)
**New files**:
- `scripts/seed-stress-fixture.ts` — creates a test project with 500 WorldEntries + 300 Chapters + 2000 Relations, deterministic seed
- `src/lib/rag/scale.perf.test.ts` — loads fixture, runs 100 hybrid-search queries, asserts p95 < 800ms

**Modified files**:
- `package.json`: add `seed:stress` script
- `src/lib/rag/hybrid-search.ts`: only if perf test fails; investigate index or embedder batching

**Gate**: p95 < 800ms at fixture scale on documented hardware baseline.
**Risk**: Current `embedder.ts` may not scale; if fails, bump to Phase E.1 refactor.
**Rollback**: N/A (test-only).

### Phase F — Surface Pruning (Day 5, ~3 hours)
**Approach**: **Do not move files**. Add `experimentalFlags.showGenerationPipeline` / `showStyleProfile` / `showTimelineView` defaults to `false`; hide UI entry points. Code stays in place.

**Files**:
- `src/app/projects/[id]/layout.tsx` or equivalent: gate generation-panel, style-profile tab, timeline-view tab
- `src/components/workspace/workspace-topbar.tsx`: hide "生成" entry if flag off
- `src/components/project/project-settings-form.tsx`: add opt-in "实验性功能" section

**Gate**: Fresh-install user does not see generation-pipeline or style-profile in default UI.
**Risk**: Existing users with mental muscle memory for these panels — mitigate with settings-level opt-in preserving prior selections
**Rollback**: Toggle flags true by default.

### Phase G — Documentation Cleanup (Day 5, ~1 hour)
**Files**:
- `CLAUDE.md`: schema v11 correction + new experimentFlags section + Citations API note
- `.github/copilot-instructions.md`: no change (brand guide still accurate)
- Spec file annotations: cross-link to this plan

**Gate**: `pnpm lint && pnpm test` green; `git diff CLAUDE.md` reflects schema v11 + experimentFlags block

### Total estimated effort
**~26 hours** (3-4 working days for one focused engineer). A/B-gated deployment means no external-user-visible changes until toggles are graduated to default.

---

## Risk Register (Top 5)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Citations API returns empty citations on messages that should have them | M | M | `emptyCitationRate` metric + soft "未溯源" badge (not blocking); auto-disable if > 20% over 50 msgs |
| 2 | Schema v12 migration corrupts existing user data | L | H | Additive-only migration (no column drops/renames); v12-aware code reads v11 gracefully; full backup warning in dialog |
| 3 | Extended-cache-ttl beta header gets deprecated | M | L | Flag-gated; fallback to 5-min default; monitor Anthropic changelog |
| 4 | Scale fixture test too lenient / hardware-dependent | M | M | Hardware baseline documented; CI-baseline separate from dev-baseline; manual re-verification in PR review |
| 5 | UI citation chips break chat readability at high citation density | L | M | Progressive disclosure (3 chip limit per message, "+N more" overflow); user survey after Phase C graduation |

---

## Testing Strategy

### Unit
- `experiment-flags.test.ts` — flag resolution with provider-awareness (Anthropic true / OpenAI-compatible auto-false)
- `citations.test.ts` — citation parser, validation against fixture
- `ab-metrics.test.ts` — aggregate computations

### Integration
- `citations.integration.test.ts` — AC-1 verifier
- `scale.perf.test.ts` — AC-5 verifier
- Existing `use-ai-chat.test.ts` + `prompts.test.ts` must stay green through all phases

### E2E (Playwright)
- `e2e/citations-grounding.spec.ts` — new: create project → add 3 WorldEntries → open chat → ask question → assert citation chip appears and click navigates to entry
- `e2e/surface-pruning.spec.ts` — new: fresh install → assert generation / style-profile hidden; opt-in → assert visible

### Existing test paths verified unchanged
- `meta-db.test.ts`, `project-db.test.ts`, `chapter-queries.test.ts` — schema v12 migration-tested through fake-indexeddb
- `sync-queue.test.ts`, `field-mapping.test.ts` — unchanged; `abTestMetrics` table intentionally not synced (local experiment data)

---

## Concrete File-by-File Change List

| File | Change | Size estimate |
|---|---|---|
| `src/components/workspace/new-entry-dialog.tsx` | Remove unused vars | -4 lines |
| `src/components/workspace/ai-chat-panel.tsx` | Remove unused vars | -4 lines |
| `src/lib/ai/experiment-flags.ts` | NEW — flag types + resolver | +80 lines |
| `src/lib/ai/experiment-flags.test.ts` | NEW — unit tests | +120 lines |
| `src/lib/db/project-db.ts` | Schema v12 with `abTestMetrics` | +40 lines |
| `src/lib/db/ab-metrics-queries.ts` | NEW — queries | +60 lines |
| `src/lib/hooks/use-ai-config.ts` | Expose experimentFlags | +20 / -5 lines |
| `src/lib/hooks/use-ai-chat.ts` | Log per-message metric + handle citations | +80 / -10 lines |
| `src/lib/ai/providers/anthropic.ts` | Citations + extended TTL + document injection | +120 / -30 lines |
| `src/lib/ai/prompts.ts` | `worldBibleAsDocument` variant | +60 / -10 lines |
| `src/lib/ai/events.ts` | `citation` event type | +30 lines |
| `src/lib/ai/citations.ts` | NEW — parser + validator | +100 lines |
| `src/lib/ai/__fixtures__/citations-golden.json` | NEW — 20-entry fixture | +500 lines (data) |
| `src/lib/ai/citations.integration.test.ts` | NEW — AC-1 verifier | +180 lines |
| `src/lib/ai/citations.test.ts` | NEW — unit test | +100 lines |
| `src/lib/db/ai-usage-queries.ts` | Add `computeCacheHitRate` | +20 lines |
| `src/components/workspace/message-bubble.tsx` | Render cited spans + chips | +60 / -10 lines |
| `src/components/workspace/citation-chip.tsx` | NEW — UI primitive | +80 lines |
| `src/components/workspace/ai-config-dialog.tsx` | 3 experiment toggles | +60 lines |
| `src/components/analysis/ai-usage-dashboard.tsx` | NEW — dashboard | +150 lines |
| `scripts/seed-stress-fixture.ts` | NEW — 500×300 seed | +120 lines |
| `src/lib/rag/scale.perf.test.ts` | NEW — p95 assertion | +100 lines |
| `src/components/project/project-settings-form.tsx` | Experimental-features section | +50 lines |
| `src/app/projects/[id]/layout.tsx` (or topbar) | Gate experimental panels | +30 lines |
| `CLAUDE.md` | Schema v11 + experimentFlags block | +30 / -5 lines |
| `package.json` | Add `seed:stress` script | +1 line |

**Total net lines**: ~+2100 / -100. Feature-flag-gated, additive-only schema, spine-focused tests.

---

## Execution Handoff

**Next step**: Autopilot Phase 2 (Execution) using this plan as input. Phase 0 (Expansion) and Phase 1 (Planning) are skipped — Deep Interview + this ralplan output already cover them.

**Invocation**: The main session will invoke `Skill("oh-my-claudecode:autopilot")` with this plan file path and `--skip-phases 0,1` to go directly to parallel execution.

**Autopilot's expected Phase 2 behavior**:
- Group phases by parallelizability: A + G standalone; B + C + D sequential (schema + code); E + F independent
- Spawn Ralph + Ultrawork workers for each phase
- Run Phase 3 (QA cycling) against the concrete verification commands listed in this plan
- Run Phase 4 (multi-perspective validation) against the 5 principles + ADR
- Phase 5 (cleanup): revert unused experimental scaffolding if tests fail

**If Agent subsystem is still failing**, autopilot will execute **inline** — the main session performs Phase 2 by batch-editing files per the plan, running tests between phases, and reporting progress.

---

**Plan status**: ✅ **APPROVED by Critic** (iteration 2). Ready for autopilot execution.
