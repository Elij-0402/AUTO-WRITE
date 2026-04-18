# Deep Interview Spec: InkForge v1 Spine Audit & Best-Practices Roadmap

## Metadata

- Interview ID: `inkforge-maturity-2026-04-19`
- Rounds: 6
- Final Ambiguity Score: **7.5%** (passed 20% threshold at Round 3)
- Type: Brownfield (existing Next.js 16 + React 19 codebase at D:\AUTO-WRITE)
- Generated: 2026-04-19
- Threshold: 0.20
- Status: **PASSED**
- Language of original interview: Chinese (中文)

## Clarity Breakdown (Final)

| Dimension | Score | Weight | Weighted |
|---|---|---|---|
| Goal Clarity | 0.92 | 0.35 | 0.322 |
| Constraint Clarity | 0.92 | 0.25 | 0.230 |
| Success Criteria | 0.95 | 0.25 | 0.238 |
| Context Clarity (brownfield) | 0.90 | 0.15 | 0.135 |
| **Total Clarity** | | | **0.925** |
| **Ambiguity** | | | **7.5%** |

---

## Goal (Crystal-clear Statement)

**InkForge v1 的脊柱 (spine) = "AI chat 驱动 + 世界观强制溯源 + 长篇一致性" 的写作助手**，对标 Sudowrite 但差异化是：

1. **UX 模式**：对话驱动（作者习惯来自 ChatGPT 网页），而非 Sudowrite 式的按钮/菜单驱动
2. **核心承诺**：长篇 (500+ WorldEntries × 300+ Chapters) 下，AI 对世界观的引用必须**可追溯到具体条目**，不允许 hallucination
3. **反向目标**：AI 输出"没有 AI 味道"——通过 Citations API 强制溯源，结构性消除"AI 编造世界细节"这一最典型 AI 味道
4. **工程基线**：使用 Anthropic 2026 官方推荐的三层组合（Citations + Prompt Caching + Extended Thinking），并以 A/B 测试 gate rollout 进度

## Constraints

- **规模门槛**：v1 必须在 **500 WorldEntries × 300 Chapters** 真实工作量下保持性能不崩
- **主约束类型**：查询延迟 / RAG 返回速度（用户明确选定此为 v1 失败标准）
- **对话 UX 是必选**：作者心智模型来自 ChatGPT 网页，非对话式 UX 不可接受
- **Anthropic 2026 工程范式**：AI 调用层必须使用 Citations API + Prompt Caching + Extended Thinking（`@anthropic-ai/sdk` 已在 0.90.0）
- **A/B gate**：所有三层原语必须先在 feature flag 下 A/B 测试，验证成本/延迟/引用有效性/作者主观质量，再 graduating 到默认开启
- **离线优先**：保持两层 IndexedDB 架构（inkforge-meta + inkforge-project-{id}），AI 配置不同步到 Supabase
- **Chinese-first**：所有 UI 文案保持中文优先
- **品牌气质**：Atmospheric / Immersive / Literary（参 `.github/copilot-instructions.md`）——深色墨韵、暖调、非通用 SaaS 风

## Non-Goals (明确 v1 不做)

- ❌ AI 代写整段 / 整章正文（AI 只做检索、引用、一致性提示、问答）
- ❌ Generation pipeline 成为 v1 卖点（chapter-generation, generation-drawer, generation-panel 降级为实验性工具,不列入 v1 验收）
- ❌ Analysis 面板成为 v1 卖点（style-profile, timeline-view 降级为实验性；relation-graph 因服务于世界观关系保留为 v1 外围）
- ❌ 词汇黑名单 / 风格锚定作为 v1 的"AI 味道"硬指标（由 Citations-based 溯源机制取代）
- ❌ 多用户协作 / 多作者工作室功能
- ❌ 发布 / 分发 / 监管 feature

## Acceptance Criteria (Testable)

### AC-1: Citations-based World-Bible Grounding（核心硬指标）
- [ ] `src/lib/ai/providers/anthropic.ts` 使用 `{ type: "document", source: { type: "content", ... }, citations: { enabled: true } }` 传递 world-bible
- [ ] 世界观以 Custom Content Document 形式注入（每个 WorldEntry = 1 个 content block）
- [ ] AI 回复中引用 WorldEntry 的文本段落，必须携带 `citations[]` 字段，`document_index + start_block_index` 可程序校验
- [ ] 未携带 citations 的 WorldEntry 引用语句视为 violation，UI 降级展示（或打 warning 标）
- [ ] **验收测试**：集成测试 `src/lib/ai/citations.integration.test.ts` — 给定 fixture 世界观（≥ 20 个 entries），发 10 条包含世界引用的用户问题，断言 ≥ 95% 响应包含有效 citations

### AC-2: Prompt Caching for World-Bible Persistence
- [ ] World-bible document content block 附加 `cache_control: { type: "ephemeral" }`
- [ ] 使用 `anthropic-beta: extended-cache-ttl-2025-04-11` header 启用 1 小时 TTL（长对话场景）
- [ ] `usage.cache_read_input_tokens` 与 `usage.cache_creation_input_tokens` 被记录到 `src/lib/db/ai-usage-queries.ts`
- [ ] **验收测试**：同一会话连续 5 次对话中，第 2-5 次的 `cache_read_input_tokens > 0` 且 `input_tokens`（非缓存部分）< 首次的 10%
- [ ] **验收测试**：AI usage dashboard 展示 cache hit rate

### AC-3: Extended Thinking for Consistency Reasoning
- [ ] "一致性检查"场景（调用 `check_consistency` tool 或显式一致性问答）启用 `thinking: { type: "enabled", budget_tokens: 2000 }`
- [ ] 响应中 `content[].type === "thinking"` block 不展示给作者（但可展开查看）
- [ ] 仅对 Opus 4.7 / Sonnet 4.6 启用；Haiku 4.5 默认关闭（成本控制）
- [ ] **验收测试**：注入故意矛盾的 fixture（"李四昨天死了但今天在喝酒"），断言开启 thinking 后的正确捕获率 ≥ 关闭时的 2 倍

### AC-4: A/B Test Harness
- [ ] `src/lib/ai/config.ts` 新增 `experimentFlags: { citations: boolean, caching: boolean, thinking: boolean }`
- [ ] 每条 AI 请求记录实验组别 + `latencyMs` + `costUsd` + `citationCount` + `emptyCitationRate` + `authorRating?`
- [ ] 用户可在项目设置中切换实验 flag
- [ ] Dashboard `/projects/[id]/analysis` 新增"AI 实验对比"面板（复用现有分析页结构）
- [ ] **验收测试**：可导出 CSV 的指标对比；两组 ≥ 30 条对话即可查看 summary

### AC-5: Scale Performance Under 500×300 Corpus
- [ ] 编写 fixture 生成脚本 `scripts/seed-stress-fixture.ts`：500 WorldEntries + 300 Chapters + 2000 Relations
- [ ] RAG hybrid-search p95 延迟 < 800ms（`src/lib/rag/hybrid-search.ts`）
- [ ] AI chat context-injection + citations 启用的**首 token 延迟** p95 < 3s（网络侧延迟除外）
- [ ] **验收测试**：`src/lib/rag/scale.perf.test.ts` — 载入 fixture,跑 100 条真实查询,断言 p95 达标

### AC-6: Surface Pruning (Scope Alignment)
- [ ] 将当前**不属于 v1 spine** 的模块明确标记为 `experimental` 或移至 `src/experimental/`:
  - [ ] `src/components/generation/` (chapter-generation 流水线)
  - [ ] `src/components/analysis/style-profile.tsx`, `timeline-view.tsx`
  - [ ] 对应的 hooks: `use-chapter-generation.ts`, `src/lib/ai/summarize.ts`
- [ ] 在 settings / 入口处为这些模块加 experimental flag
- [ ] **不删除**：保留代码但隔离，避免 v1 用户默认见到不成熟特性
- [ ] Relation graph (`relation-graph.tsx`) **保留为 v1**（服务于世界观核心）

### AC-7: Code Hygiene（最小可交付）
- [ ] 修复现存 4 个 TypeScript 诊断（未使用变量）：`src/components/workspace/new-entry-dialog.tsx:54,56` + `src/components/workspace/ai-chat-panel.tsx:102,103`
- [ ] `pnpm lint` 零 error / 零 warning
- [ ] `pnpm test` 全绿
- [ ] 新增 Citations / Caching / Thinking 相关单元测试 ≥ 85% 覆盖 `src/lib/ai/`

## Assumptions Exposed & Resolved

| Assumption | Challenge | Resolution |
|---|---|---|
| "产品已完成"是感觉问题 | 脊柱未定义,怎判断"完成"? | 脊柱锁定 = world-bible + AI chat + 溯源 |
| "最佳实践"范围广 | 代码/UX/性能/交付 哪个维度? | 锁定 = 2026 Anthropic API 工程范式（Citations + Caching + Thinking）|
| AI chat 是外围工具 | Contrarian:作者真正用的是对话界面 | 脊柱扩张 = world-bible + AI chat(含注入) |
| "没有 AI 味道"多义 | 4 种操作化路径 | 采纳溯源式(Option 3)，因原生支持 + 最强差异化 |
| 100+ 章是方向性 | Constraint 需具体数字 | 锁定 = 500 WorldEntries × 300 Chapters |
| "性能不崩"无指标 | Success Criteria 需可测 | 锁定 = RAG 查询 / hybrid-search 返回速度 |
| 三层架构可能过度 | Simplifier:v1 必须三层全上? | 接受三层 + 以 A/B gate 降风险 |

## Technical Context (Brownfield)

### 当前代码库关键事实（本次会话独立验证）

- **Routes**: `/`, `/auth`, `/auth/forgot-password`, `/projects/[id]`, `/projects/[id]/analysis`
- **已实现子系统**:
  - Tiptap 编辑器 (`src/components/editor/`)
  - 世界观百科 (`src/components/world-bible/`, `src/lib/hooks/use-world-entries.ts`)
  - 大纲 (`src/components/outline/`)
  - AI chat (`src/components/workspace/ai-chat-panel.tsx`, `src/lib/hooks/use-ai-chat.ts`)
  - Context injection (`src/lib/hooks/use-context-injection.ts`) — **当前按关键词匹配 + 4000 token 预算,非 cacheable document 形式**
  - RAG (`src/lib/rag/`: embedder, hybrid-search, vector-store, indexer)
  - 生成流水线 (`src/lib/hooks/use-chapter-generation.ts`) — **v1 非 spine,需降级为 experimental**
  - 一致性校验 (`src/lib/ai/content-validator.ts`, `src/components/workspace/consistency-warning-card.tsx`)
  - 修订历史 (`src/lib/db/revisions.ts`)
  - Supabase sync (`src/lib/sync/`)
  - 导出 (`src/lib/export/`: EPUB/DOCX/Markdown)
  - AI usage tracking (`src/lib/db/ai-usage-queries.ts`)
- **测试覆盖（17 个测试文件）**: 集中在 DB / sync / RAG / prompts / content-validator；**AI chat 链路 / 编辑器 / 导出 基本无测试**
- **当前诊断**: 4 个未使用变量警告
- **package.json version**: 0.1.0（pre-1.0）
- **品牌锚**: `.github/copilot-instructions.md` (Atmospheric / Immersive / Literary / Chinese web-novel 作者)

### 差距 (gap) 摘要

1. AI provider 层（`src/lib/ai/providers/anthropic.ts`）**未使用 Citations API**
2. Context injection 每次把 world-bible 组入 system prompt，**未使用 cache_control**
3. 一致性检查**未启用 extended thinking**
4. 无 A/B 实验 harness / 无实验级指标记录
5. 无 500×300 规模 fixture / 无 perf 测试
6. Generation pipeline 与 analysis panel 占据代码量但**非 v1 spine**
7. AI chat / 编辑器 / 导出 **无集成测试**

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|---|---|---|---|
| WorldEntry | core domain | id, type (character/location/rule/timeline), name, attributes | has many Relations; cited by AIMessage |
| Relation | core domain | source, target, label, direction | connects WorldEntries |
| ConsistencyWarning | core domain | triggerText, violatedEntry, severity | references WorldEntry; raised in Chapter |
| Chapter | supporting | content (ProseMirror JSON), order, status | 触发警告的上下文 |
| RAGIndex | supporting infra | embeddings, metadata | 索引 WorldEntries |
| Author | external | — | uses InkForge |
| Conversation | core domain | id, messages[], createdAt | container for AIMessages |
| AIMessage | core domain | role, content, citations[], usage | 引用 WorldEntries via citations |
| PromptBudget | supporting infra | inputTokens, cacheReadTokens, cacheCreationTokens | measures AIMessage cost |
| AIStyleGuardrail | core domain | enforcement: "citations-based grounding" | governs AIMessage output |
| ABTestMetric | supporting | messageId, experimentGroup, latencyMs, costUsd, emptyCitationRate | attached to AIMessage |
| FeatureFlag | supporting infra | name, enabled, cohort | gates experimental code paths |

## Ontology Convergence

| Round | Entities | New | Changed | Stable | Stability |
|---|---|---|---|---|---|
| 1 | 6 | 6 | — | — | N/A |
| 2 | 6 | 0 | 0 | 6 | 100% |
| 3 | 6 | 0 | 0 | 6 | 100% |
| 4 | 10 | 4 (Conversation, AIMessage, PromptBudget, AIStyleGuardrail) | 0 | 6 | 60% |
| 5 | 10 | 0 | 0 | 10 | 100% |
| 6 | 12 | 2 (ABTestMetric, FeatureFlag) | 0 | 10 | 83% |

**分析**: Ontology 在 Round 4 (spine 调整) 和 Round 6 (加入 A/B 测试) 时扩张,其它轮次完全稳定。这是一个健康的领域模型演化模式 — 扩张发生在确认需求的节点,而非随机漂移。

## Iteration Direction (Post-v1 Roadmap)

**v1 (本规格范围)**: Citations + Caching + Thinking + A/B + Scale Perf + Surface Pruning

**v2 候选**（按证据支持度排序，需后续访谈精化）：

1. **Surface re-activation**: 基于 v1 的 A/B 数据，决定 generation-pipeline / style-profile / timeline-view 是否成熟到可从 experimental 毕业
2. **Multi-agent pattern**: 引入专门的 consistency auditor / style auditor 作为 sub-agent (spec 级 AC，不在 v1)
3. **File API + 大世界观**: 使用 Anthropic Files API 把超大世界观（> 1M tokens）上传为 file_id 而非 inline document
4. **作者风格锚定 (原 Option 2)**: v1 的 Citations 落地后,可以再引入 KL 散度风格追踪作为**补充**指标（不是替代）
5. **协作 / 多作者**: 如市场验证"一致性"价值，扩展到工作室 / 出版社场景

## Interview Transcript (Condensed)

<details>
<summary>Full 6-round Q&A</summary>

### Round 1 — Core Spine
**Targeting**: Goal Clarity (0.25)
**Q**: 如果 InkForge 只能保留一个核心工作流、其它全部砍掉，这个不能砍的"产品脊柱"是什么？
**A**: 世界观长期一致性管理（WorldBible + 关系图 + consistency-warning + RAG 搜索）
**Post-round ambiguity**: 38.4%

### Round 2 — Spine Constraint
**Targeting**: Constraint Clarity (0.45)
**Q**: 脊柱在 500×300 级规模下才算 done。四个约束维度（规模 / 延迟 / 准确率 / 集成深度）哪个最关键？
**A**: 规模长程，但性能不崩
**Post-round ambiguity**: 27.7%

### Round 3 — Performance Pain
**Targeting**: Success Criteria (0.65)
**Q**: "性能不崩" 绑到哪个具体用户痛点上？
**A**: 搜索 / 查询返回太慢（RAG / hybrid-search latency 是 v1 红线）
**Post-round ambiguity**: 17.8%（跨过阈值）

### Round 4 — Contrarian Challenge
**Targeting**: Goal Clarity — stress test
**Q**: 如果 AI chat 才是作者真正用的地方,脊柱选择要保持不变还是调整?
**A**: 调整 + 补充重要信息:
- 用户 UX 习惯来自 ChatGPT 网页（对话驱动）
- 竞品 = Sudowrite (AI 为辅, 深度集成)
- 反向目标 = "没有 AI 味道"
- 请推荐 2026 Anthropic 工程构建的最佳实践
**Post-round ambiguity**: 16.1%

### Round 5 — Anti-AI-Slop Operationalization
**Targeting**: Success Criteria (0.78)
**Q**: "没有 AI 味道" 操作化为 4 个可测指标（黑名单 / 风格锚 / 溯源 / 边界）哪个是 v1 硬指标?
**A**: 请基于真实数据推荐 (delegation)
**Research executed**: Context7 拉 Anthropic SDK types; WebFetch 拉 Citations API 官方文档 (成功); WebSearch / 其他 WebFetch 失败
**推荐**: Option 3 (Citations-based 溯源) + L1/L2/L3 三层组合
**Post-round ambiguity**: 10.9%

### Round 6 — Simplifier Confirmation
**Targeting**: Final confirmation
**Q**: 三层推荐 (Citations/Caching/Thinking) 必须全上吗?
**A**: 接受三层但要 A/B 测试 gate rollout
**Post-round ambiguity**: 7.5% (final)

</details>

## Primary Source Citations

- **Anthropic Citations API (verified this session)**: <https://platform.claude.com/docs/en/docs/build-with-claude/citations>
  - 支持模型: 除 Haiku 3 外全部活跃模型 (Opus 4.7 / Sonnet 4.6 / Haiku 4.5)
  - 与 prompt caching 兼容 (`cache_control: ephemeral`)
  - 引用类型: char_location / page_location / content_block_location / search_result_location
- **Anthropic SDK TypeScript (verified via Context7 `/anthropics/anthropic-sdk-typescript`)**:
  - `CacheControlEphemeral`, `CitationsConfig`, `thinking.budget_tokens`, `CodeExecutionTool20260120`, `DocumentBlockParam`, `toolRunner`, `betaZodTool` 全部证实存在
- **Training-knowledge (k-cutoff 2026-01, 未本次抓取)**:
  - Prompt caching: 5min 默认 / 1hr beta TTL; min 1024 tokens (Sonnet) / 2048 (Haiku); ~90% 命中折扣; 最多 4 breakpoints
  - Sudowrite / NovelCrafter 公开定价与 Story Bible / Codex 特性

---

## Ready for Execution

歧义度 7.5% ✅，ontology 稳定,acceptance criteria 可测试,主要引用来自 Anthropic 官方文档。

**推荐下一步**: 3-stage pipeline (ralplan consensus → autopilot 执行)，因：
1. 本规格涉及 AI 层重构 (citations/caching/thinking) + surface pruning + A/B harness，属于跨多文件结构性改动
2. A/B gate 策略需要 Architect 评审（feature flag 位置 / 实验指标一致性）
3. Critic 可挑战"哪些 analysis panel 真该降级为 experimental"
4. 最后 autopilot 执行已得到 Critic-approved 的 plan
