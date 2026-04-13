# Pitfalls Research

**Domain:** AI Novel Writing Workstation (Chinese-first, BYOK, multi-panel)
**Researched:** 2026-04-13
**Confidence:** MEDIUM (domain knowledge synthesized from official docs, ProseMirror/TipTap issues, and training data)

## Critical Pitfalls

### Pitfall 1: Context Window Overflow from World Bible Auto-Injection

**What goes wrong:**
The core differentiator—auto-injecting world bible context before AI generation—silently overflows LLM context windows. A novel with 30 character profiles (each 200-500 chars), 15 locations, 10 rules, and the current chapter text can easily exceed 8K-32K tokens. Chinese text compounds this: most CJK characters tokenize to 2-3 tokens in GPT-series models, meaning a 500-character Chinese character entry consumes 1000-1500 tokens. The AI then truncates input silently or produces incoherent output with no error signal to the user.

**Why it happens:**
Developers treat "auto-inject context" as a simple string concatenation problem. They sum up relevant entries and append to the prompt without calculating token budgets. Different models have different tokenizers—Claude tokenizes Chinese differently from GPT-4, which tokenizes differently from Gemini. There is no universal "character count × factor" that works across providers.

**How to avoid:**
- Implement a **token budget system**: before assembling the prompt, estimate tokens for each world bible entry. Use the specific provider's tokenizer (tiktoken for OpenAI, Anthropic's tokenizer for Claude) to count accurately.
- Implement **priority-based truncation**: when context exceeds budget, drop lower-priority entries (e.g., minor locations) before core entries (current chapter, active characters).
- Always leave **~15% headroom** from the stated context limit—models produce degraded output near limits.
- Display a **context usage indicator** in the UI so users understand what context the AI received.

**Warning signs:**
- AI output contradicts world bible entries that "should have been injected"
- AI generates content about characters it was never told about (hallucinated from truncation)
- Token counting uses `.length` (character count) instead of actual tokenization
- No UI showing how much context budget is consumed

**Phase to address:**
Phase 2 (AI Integration) — this is foundational architecture, not a later optimization. The token budget system must be designed before any AI generation feature is built.

---

### Pitfall 2: ProseMirror/TipTap Performance Collapse on Long Novels

**What goes wrong:**
Novels are 50k-500k+ words. ProseMirror is an immutable document model—every keystroke creates a new document state object. With React integration (TipTap), each state update triggers React reconciliation. At 50k+ words, operations that are O(n) over the document (like `isActive()` checks, selection updates, decoration recalculations) cause visible input lag (200ms-3s per keystroke). TipTap GitHub issue #4492 documents that `ReactNodeViewRenderer` causes drastic performance degradation with large text.

**Why it happens:**
- ProseMirror's `doc.content.size` grows linearly; many operations traverse the full document
- React re-renders on every transaction—custom NodeViews using React components are especially dangerous
- Decorations, suggestions, and plugins that inspect the full document on every update compound the problem
- The `isActive()` method traverses the schema to check marks/nodes—on `selectAll()` it freezes the UI for seconds (issue #1930)
- Chinese text makes this worse: CJK characters occupy 3 bytes in UTF-8 but 1 visual "column"; cursor positioning calculations are slower

**How to avoid:**
- **Never store an entire novel in a single ProseMirror document.** Load only one chapter at a time. Store chapters separately in the data model; swap the editor content when navigating between chapters.
- Use vanilla DOM NodeViews (`addNodeView()` returning `{dom, contentDOM}`) instead of `ReactNodeViewRenderer` for any node that appears frequently in long documents.
- Debounce any operation that traverses the full document (`isActive`, word count, decoration updates).
- Use ProseMirror's built-in `DecorationSet` efficiently—never recreate it from scratch on every transaction; use `map()` to update positions incrementally.
- Consider a **chapter-per-editor-instance** approach: instantiate one TipTap editor per visible chapter, not one editor for the whole book.

**Warning signs:**
- Single ProseMirror document holds >20k characters
- `ReactNodeViewRenderer` used for common nodes (paragraphs, headings)
- Word count or `isActive()` runs synchronously on every keystroke
- Editor re-renders the entire document on each transaction

**Phase to address:**
Phase 1 (Editor Foundation) — the chapter-per-editor architecture decision must be made before writing any editor code. Retrofitting this after building a single-document approach requires a full rewrite of the editor layer.

---

### Pitfall 3: BYOK Multi-Provider API Integration Fragmentation

**What goes wrong:**
Each LLM provider has different streaming protocols, error schemas, rate-limit headers, model naming conventions, and even different JSON structures for function calling. OpenAI uses `data: [DONE]` for stream termination; Anthropic uses `event: message_stop`. OpenAI sends `content_block_delta` events; Anthropic sends `content_block_delta` with `text` vs `input_json_delta`. Error codes differ: OpenAI returns `429 Too Many Requests` with `Retry-After` header; Anthropic returns `429` with `rate_limit_reset` in JSON body. Supporting 5+ providers means 5+ edge cases per feature, and bugs multiply.

**Why it happens:**
Developers start with "it's just HTTP streaming" and write a generic SSE parser. Then they discover each provider's quirks one by one: OpenAI's `stream_options: {include_usage: true}`, Anthropic's different auth header format (`x-api-key` vs `Authorization: Bearer`), Google's non-SSE streaming format, local models (Ollama/vLLM) that may not support streaming at all. Each quirk becomes a special case in the codebase.

**How to avoid:**
- **Use an abstraction layer from day one.** Libraries like `ai` (Vercel AI SDK) or `openai` (with custom baseURL) provide provider-agnostic interfaces. Invest in a thin adapter layer early.
- **Define your own internal error types** that map from provider-specific errors. Never let provider API response shapes leak into your UI code.
- **Test each provider's streaming behavior independently.** Create integration tests that verify: stream start, content chunks, stream end, error mid-stream, rate limit, timeout.
- **Handle the `baseURL` configuration carefully.** Users providing custom endpoints (Ollama, litellm, etc.) may serve OpenAI-compatible APIs but with subtle incompatibilities. Validate the endpoint on configuration save.
- **Implement provider capability detection.** Not all models support the same features (function calling, JSON mode, system messages). Query provider endpoints or maintain a capability registry.

**Warning signs:**
- API response parsing logic has `if (provider === 'openai')` scattered throughout
- Streaming errors crash the entire chat session
- "Unsupported model" errors appear with no recovery path
- No timeout handling on streaming connections—requests hang forever on network issues

**Phase to address:**
Phase 2 (AI Integration) — the provider abstraction layer is the foundation for all AI features. Build it first, before any AI chat or generation UI.

---

### Pitfall 4: Consistency Checking Produces Unreliable Results (False Positives/Negatives)

**What goes wrong:**
The "AI主动矛盾检查" feature sounds great in theory but is practically unreliable. False positives (AI flags content as contradictory when it isn't) annoy power users who know their own story. False negatives (AI misses real contradictions) undermine the entire value proposition. The problem gets worse with more world bible content injected—the LLM has conflicting signals from dozens of character descriptions. Chinese web novel readers are extremely sensitive to plot holes ("毒点"), so false negatives are product-killing.

**Why it happens:**
- LLMs are not reliable fact-checkers over long context—they lose track of statements made earlier in the same prompt
- The "check this passage against these 50 character profiles" prompt invites hallucinated contradictions
- Chinese language ambiguity increases false positives (same character different interpretation)
- Users expect deterministic output from what is fundamentally probabilistic

**How to avoid:**
- **Treat consistency checking as "suggested warnings" not "verified errors."** Never auto-flag text as definitively contradictory; always present as "AI noticed a potential inconsistency—please verify."
- **Scope checks narrowly.** Don't check a passage against the entire world bible. Check against only directly referenced characters/locations in the current passage (entity extraction → targeted check).
- **Allow user dismissal with memory.** When a user dismisses a false positive, record it so the same "contradiction" isn't flagged again. Let users mark world bible entries as "intentionally contradicted in later chapters."
- **Implement confidence thresholds.** Have the AI rate its own confidence in each flagged inconsistency. Only surface high-confidence flags; keep low-confidence ones as optional "subtle hints."
- **Never block the user's workflow.** Consistency warnings should be sidebar notifications, not modal dialogs or inline marks that disrupt writing.

**Warning signs:**
- AI flags dozens of "contradictions" per chapter, most of which are false
- Users start ignoring all consistency warnings (alert fatigue)
- No mechanism to suppress repeated false positives
- Consistency check runs on every keystroke instead of on-demand or on chapter save

**Phase to address:**
Phase 3 (AI Features) — consistency checking should be implemented after world bible and AI chat are working. Start with on-demand checking (not real-time), and expand to background checks only after false positive rate is acceptable.

---

### Pitfall 5: Multi-Panel State Synchronization Leads to Stale Context

**What goes wrong:**
The multi-panel workspace (world bible, outline, editor, AI chat) must share state. When a user edits a character's description in the world bible panel, the AI chat should reference the updated description, not the old one. When AI generates a chapter outline, the editor should reflect it. In practice, each panel holds its own React state, and updates propagate asynchronously. Race conditions lead to AI generating text based on stale character data, or the outline panel showing a different chapter order than the editor.

**Why it happens:**
- React state updates are batched and asynchronous; panels don't instantly see each other's changes
- AI generation is asynchronous; by the time the response arrives, the user may have edited the world bible again
- ProseMirror's transaction system is isolated within each editor instance
- No single source of truth for "which version of the world bible is current"

**How to avoid:**
- **Single source of truth with a global store** (Zustand, Jotai, or similar). World bible entries, outline data, and current chapter content should live in one store, not scattered across component state.
- **Use optimistic updates with confirmation.** When a user edits a world bible entry, immediately update the store and propagate to all panels. Confirm with server async.
- **Stamp AI requests with a context version.** When sending a prompt to the LLM, include a context version hash. When the response arrives, check if the context has changed since the request was sent. If it has, either re-run with fresh context or warn the user.
- **Debounce panel updates, not state updates.** UI rendering can be debounced, but the state store must always be current.
- **Implement Pub/Sub for cross-panel events.** "Character X updated" → all panels subscribe and react.

**Warning signs:**
- AI generates text referencing old character traits after user updated them
- Each panel manages its own copy of world bible data
- No visible "syncing..." or "context outdated" indicator
- ProseMirror `onUpdate` directly mutates local state without updating global store

**Phase to address:**
Phase 1 (Editor + Layout) — the state management architecture must be designed before building panels. Retroactively moving from local state to global store requires rewriting every panel component.

---

### Pitfall 6: Cloud Sync Destroys Novel Content via Conflict Resolution Failures

**What goes wrong:**
Cloud sync for novels is deceptively hard. Novels are serial content—a single conflict in one chapter can corrupt the entire project. Last-write-wins destroys work. Manual merge is impractical for 50k+ word documents. Offline editing followed by online sync without proper conflict detection leads to silent data loss. Chinese text makes diffing harder because character-level diffs are meaningless; word-level diffs don't apply to Chinese (no spaces).

**Why it happens:**
- CRDTs (Yjs, Automerge) are designed for collaborative real-time editing, not for single-author offline/online sync
- ProseMirror's Yjs binding works for real-time collab but adds complexity for single-user sync
- Conflict resolution at the JSON level (ProseMirror doc JSON) produces invalid documents
- Auto-save without versioning means the last synced version always wins
- Network errors during save can leave the client and server in different states

**How to avoid:**
- **For v1 (single author), skip real-time CRDT sync.** Use a simpler model: chapters are atomic units. Save chapter-level versions with timestamps. On conflict, offer both versions for manual selection.
- **Implement aggressive auto-save with version history.** Save to local storage every 5 seconds; push to server on chapter switch or explicit save. Keep at least 10 recent versions per chapter.
- **Use ProseMirror Step-based sync, not whole-doc sync.** Send steps (operations) to the server, not the entire document JSON. This makes conflict detection precise ("these 5 steps conflict") rather than coarse ("the whole document changed").
- **Never auto-merge conflicted text.** Always surface conflicts to the user. Merge UI can be simple: "Server version | Your version → choose."
- **For Chinese text diffing, use character-level diff with paragraph-level grouping.** Space-based word splitting doesn't work for Chinese; use `diff-match-patch` or similar character-level algorithms.

**Warning signs:**
- Auto-save overwrites server data with local data on reconnect
- No version history or rollback mechanism
- "Sync conflict" results in the entire document being overwritten
- Chapter boundaries are not sync boundaries (whole novel is one sync unit)

**Phase to address:**
Phase 4 (Cloud Sync & Auth) — sync architecture must be designed in Phase 4, but the chapter-per-editor decision from Phase 1 directly enables clean sync boundaries. The data model must support versioning from the start.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store entire novel in one ProseMirror doc | Faster initial development | Performance collapse at 30k+ chars, impossible to sync per-chapter | Never — this is architecturally wrong for a novel editor |
| Use `.length` for token counting | Simple implementation | Silent context overflow, incorrect budget calculations, broken AI output | Prototype only, never in production |
| React state per panel (no global store) | Faster initial UI development | Stale state bugs, impossible cross-panel sync, race conditions with AI | First 2 weeks of prototyping only |
| Hardcode OpenAI API format | Ship BYOK feature faster | Cannot support other providers, massive refactor when adding Claude/local models | Never — build the abstraction from day one |
| Skip Chinese IME composition handling | Faster editor MVP | Broken input for Chinese users (duplicated characters, lost input, cursor jumping) | Never — Chinese IME is core, not an edge case |
| Use `handlePaste` without sanitization for AI output insertion | Faster AI integration | Malformed ProseMirror doc state, potential XSS if rendering HTML | Never — always sanitize AI output before inserting |
| Single undo/redo stack for all operations | Simpler history management | AI generation undoes character-by-character instead of as a block | Prototype only — need grouped transactions for AI ops |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TipTap + React | Using `ReactNodeViewRenderer` for common nodes (paragraph, heading) | Use vanilla DOM NodeViews for high-frequency nodes; reserve React NodeViews for complex interactive nodes only |
| TipTap + AI streaming | Inserting each AI token as a separate ProseMirror transaction | Buffer AI tokens and batch insert every 50-100ms or per-sentence. Group as a single "AI generation" undo step using `tr.setMeta('aiGeneration', true)` |
| TipTap + Chinese IME | Handling `beforeinput` events during IME composition | Use ProseMirror's built-in composition handling; don't interfere with `composing` state. Test with Chinese Pinyin, Wubi, and Cangjie IMEs. |
| OpenAI Streaming SSE | Assuming all providers use identical SSE format | Parse each provider's format separately in the adapter layer. Anthropic uses `event: message_start` etc.; OpenAI uses `data: [DONE]`. |
| ProseMirror + Global State | Syncing editor transactions to Zustand on every keystroke | Debounce state sync (e.g., 300ms) or sync on `blur`/`save`. Keystroke-level sync causes cascading re-renders. |
| Token Counting (OpenAI) | Using `text.length / 4` to estimate tokens for Chinese | Use `tiktoken` (OpenAI) or the provider's tokenizer. Chinese characters average 2-3 tokens each in GPT-4, not 0.25 (1/4). |
| Token Counting (Anthropic) | Reusing OpenAI token counts for Claude | Claude's tokenizer is different. A 500-character Chinese passage may be 800 tokens in GPT-4 but 1000 in Claude. Use provider-specific tokenizers. |
| Cloud Sync + Offline | Auto-push to server on every transaction | Queue changes locally, push on chapter switch / explicit save / periodic interval (e.g., every 30s). Handle push failures with retry queue. |
| Chinese Word Count | Using `.split(' ').length` to count words | Chinese has no spaces between words. Use character count for CJK, or use a segmentation library (jieba, Intl.Segmenter) for word count. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Single ProseMirror doc for whole novel | Keystroke lag >200ms at 30k chars; total freeze at 100k chars | Chapter-per-editor model; load one chapter at a time | 20k+ characters in single editor |
| `isActive()` on every transaction | UI freezes on `Ctrl+A` (selectAll); 2-3 second hangs | Debounce `isActive`-like checks; cache results; only check on selection change | Any document size with many mark types |
| Full DecorationSet rebuild per transaction | Editing lag proportional to decoration count | Use `DecorationSet.map()` to incrementally update positions | 50+ decorations (highlights, comments, etc.) |
| Token-counting on every keystroke for context budget | Typing lag as context budget recalculates synchronously | Pre-calculate token counts for world bible entries on save; only recalculate current chapter text on-demand with debounce | Any document size with 10+ world bible entries |
| Word count via DOM traversal on every keystroke | Visible lag while typing | Use ProseMirror `doc.content.size` for character count; debounce word count updates; use `Intl.Segmenter` for CJK | Any document, but noticeable at 10k+ chars |
| Streaming AI text insertion per token | Flickering, cursor jumps, bloated undo history (one step per token) | Buffer tokens; insert batches; group as single undo step | Always — even short generations produce 100+ tokens |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing user API keys in localStorage | Keys stolen by XSS, extensions, or malicious scripts | Encrypt keys before storage; use HttpOnly cookies if possible; never log keys; warn users about risks; consider ephemeral key sessions |
| Rendering AI HTML output directly in ProseMirror | XSS via crafted AI responses; malformed doc state | Always parse AI output through ProseMirror's schema — never use `editor.commands.setContent()` with raw HTML from AI. Use `insertContent` with schema validation. |
| No rate limiting on AI requests from client | User (or compromised account) can exhaust their own API keys rapidly; potential for abuse if you later host models | Implement client-side throttling (e.g., max 1 request per 5 seconds); show estimated cost before generation; add confirmation for long generation tasks |
| Sending full world bible to LLM API | Token costs explode; privacy risk (user's creative IP sent to third parties) | Summarize entries before sending; let users control what's sent; warn about privacy implications in UI |
| No input sanitization on custom base URL | SSRF via malicious base URL configuration; API key sent to attacker-controlled endpoint | Validate base URL format (must be HTTPS, no private IPs); test connectivity before saving; warn users about risks of custom endpoints |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| AI generates text directly into the editor | Users can't review before committing; accidental overrides of manual edits; "AI feels invasive" | As PROJECT.md states: "草稿在聊天面板展示，手动采纳到编辑器" (draft in chat panel, manual accept to editor). NEVER auto-insert AI output into the active document. |
| No context budget indicator | Users don't understand why AI "forgot" something from the world bible | Show a "context usage" bar (e.g., "12,400 / 16,000 tokens used") before each AI request, with breakdown of what's included |
| Consistency warnings as modal dialogs | Writing flow disrupted; users dismiss without reading | Use subtle inline markers or sidebar panels; allow dismissal; aggregate at chapter level |
| Chinese character count displayed as "word count" | Confusing for Chinese web novel authors who track 字数 (character count) | Display 字数 (character count) prominently; offer word count (via segmentation) as secondary info. Chinese authors think in characters, not words. |
| No "what context is the AI seeing?" transparency | Users lose trust when AI makes errors; can't debug why AI contradicts world bible | Show expandable "AI Context" section listing which world bible entries, outline points, and chapter text were included in the prompt |
| Forcing chapter renumbering in UI | Web novel authors often rearrange chapters; renumbering causes confusion with external references | Use stable chapter IDs; display order can change without changing IDs. Support drag-reorder. |
| AI streaming with no cancel button | Users stuck watching irrelevant generation for 30+ seconds; wasted API tokens | Always show a "Stop generating" button during streaming inference. Let users cancel and re-prompt. |

## "Looks Done But Isn't" Checklist

- [ ] **AI Context Injection:** Context is injected but not visible — verify users can see WHAT context the AI received (expandable context panel)
- [ ] **Token Budget:** Token counting works for English but not Chinese — verify with Chinese text token counting using the correct tokenizer per provider
- [ ] **BYOK Streaming:** Streaming works for OpenAI but not Anthropic/Google/local — verify multi-provider streaming with actual API calls before declaring BYOK "done"
- [ ] **Chinese IME:** Editor works with direct character input but not with Chinese Pinyin/Wubi IME — verify composition events don't duplicate characters, lose input, or jump cursor
- [ ] **Undo/Redo:** Undo works for manual typing but undoes AI generation character-by-character — verify AI-generated content is grouped as a single undo step
- [ ] **Editor Performance:** Editor is snappy with a 5000-character chapter but lags at 50,000 — performance test with realistic Chinese novel chapters (20k+ chars)
- [ ] **Cloud Sync:** Sync works while online but silently loses data during offline→online transition — verify conflict detection and resolution
- [ ] **Multi-Panel Sync:** World bible update appears in world bible panel but AI chat still uses old data — verify cross-panel state propagation end-to-end
- [ ] **Export:** Markdown export works but EPUB loses Chinese formatting — verify all export formats with actual Chinese novel content
- [ ] **Consistency Check:** Check works on a 3-entry world bible but times out or hallucinates on 30-entry world bible — test with realistic-scale world bibles

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Single ProseMirror doc for whole novel | HIGH (full editor rewrite) | Migrate to chapter-per-editor model; extract chapter splitting logic; rewrite all document-level operations to work per-chapter |
| No token budget system | MEDIUM (add token counting + truncation) | Add provider-specific tokenizers; implement priority-based context selection; add context budget UI; rebuild prompt assembly pipeline |
| Hardcoded OpenAI API format | MEDIUM (refactor adapter layer) | Create provider abstraction; refactor all API calls through abstraction; add per-provider streaming/error/rate-limit handling; test all providers |
| No Chinese IME handling | MEDIUM (fix composition handling) | Add composition detection (`editor.composing` state); suppress ProseMirror transaction handling during composition; test with multiple IMEs |
| React state per panel (no global store) | HIGH (refactor state management) | Introduce global store; migrate all panels from local state to global store; implement Pub/Sub for cross-panel events; test state propagation timing |
| No version history for sync | MEDIUM (add versioning layer) | Add chapter version storage; implement conflict detection UI; add version comparison view; test offline→online scenarios |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Context window overflow | Phase 2 (AI Integration) | Test with 50-entry world bible + long chapter; verify token budget indicator shows accurate counts |
| ProseMirror long doc performance | Phase 1 (Editor Foundation) | Load 20k+ char Chinese chapter; verify <50ms keystroke latency; confirm chapter-per-editor architecture |
| BYOK multi-provider fragmentation | Phase 2 (AI Integration) | Stream from OpenAI, Anthropic, and a local model; verify all succeed with proper error handling |
| Consistency check false positives | Phase 3 (AI Features) | Run consistency check on 10 Chinese chapters with 20 world bible entries; verify <20% false positive rate |
| Multi-panel stale state | Phase 1 (Editor Foundation) | Edit character in world bible; verify AI chat panel reflects change within 1 second |
| Cloud sync conflict | Phase 4 (Cloud Sync) | Simulate offline edit → online sync conflict; verify user can choose between versions without data loss |
| Chinese IME composition | Phase 1 (Editor Foundation) | Type Chinese with Pinyin, Wubi, and Cangjie IMEs; verify no duplicated characters or cursor jumps |
| Token counting for Chinese | Phase 2 (AI Integration) | Count tokens for 500-char Chinese passage with OpenAI tokenizer; verify accuracy within 5% |
| AI output auto-insertion | Phase 2 (AI Integration) | Generate AI text; verify it appears in chat panel, NOT in editor, until user explicitly accepts |
| Undo/redo for AI generation | Phase 2 (AI Integration) | Generate AI text, accept to editor, press Ctrl+Z; verify entire AI block undoes in one step |
| API key security | Phase 4 (Cloud Sync) | Inspect localStorage; verify keys are not in plaintext; test XSS protection |

## Sources

- ProseMirror official guide and reference manual (prosemirror.net/docs)
- TipTap GitHub issues: #4492 (ReactNodeViewRenderer performance), #1930 (isActive() slow on selectAll), #7055 (DragHandle perf on large docs)
- UTF-8 encoding specifics for CJK (3 bytes per Chinese character, tokenization varies by provider)
- Unicode normalization (NFC vs NFD) — Mac filesystem uses NFD, Windows/Linux use NFC
- ProseMirror transaction and step model documentation
- Domain knowledge: Chinese web novel writing conventions, 字数 tracking, IME composition handling
- Vercel AI SDK documentation (provider-agnostic streaming patterns)
- Sudowrite architecture analysis (chat-then-generate UX pattern)

---
*Pitfalls research for: InkForge — AI小说专业工作台*
*Researched: 2026-04-13*