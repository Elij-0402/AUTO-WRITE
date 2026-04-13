# Feature Research

**Domain:** AI Novel Writing Workstation (Chinese-first, Sudowrite competitor)
**Researched:** 2026-04-13
**Confidence:** MEDIUM — competitor features well-documented; Chinese AI writing tools partially verified through training data (no live access to Chinese tool sites)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Project/Novel management** | Every writing tool has project-level organization | LOW | One novel = one project. Flat chapter list (no volumes). Multiple projects per user. |
| **Chapter editor with basic formatting** | Core writing surface — users can't write without it | MEDIUM | Needs a rich-text editor (bold, italic, headings) with autosave. TipTap/ProseMirror-class editor. |
| **AI text generation (chat-based)** | The entire value proposition is AI-assisted writing | HIGH | Chat interface where user discusses with AI, AI generates drafts. User manually accepts/adopts drafts to editor. Not inline autocomplete. |
| **Chapter management (CRUD, reorder)** | Novelists organize by chapters — must support create, edit, reorder, delete | LOW | Drag-and-drop chapter list in sidebar. Flat structure (no volumes per PROJECT.md). |
| **AI context injection** | Without this, AI generates generic content — the #1 complaint about ChatGPT/Claude for creative writing | HIGH | Automatically inject relevant world-building entries, character info, and plot context into AI prompts. Core differentiator that must work from day 1. |
| **World-building / lore entries (characters, locations, rules)** | Sudowrite has Story Bible, NovelAI has Lorebook — table stakes for AI writing tools | MEDIUM | Structured entries for characters (name, appearance, personality, background, relationships), locations, rules/settings, timeline. Minimum viable set of entity types. |
| **Word count / statistics** | Web novel authors track daily output religiously (日更 word counts are cultural) | LOW | Real-time total word count, per-chapter word count, daily writing word count. Essential for Chinese web novel culture. |
| **Export (Markdown, DOCX, EPUB)** | Authors need to submit manuscripts to platforms, backup their work | MEDIUM | Multi-format export. Critical for author trust — "don't lock me in." |
| **User auth + cloud sync** | Cross-device writing is a hard requirement for Chinese authors who write on both desktop and phone | HIGH | Login system, all project data synced to cloud. No local-only mode for v1. |
| **Dark mode / theming** | Writers work at night; every modern writing tool offers this | LOW | At minimum light/dark modes. Sudowrite has 8 themes + 5 dark modes. |
| **Chinese language UI** | Target users are Chinese web novel authors who expect Chinese-first experience | LOW | All UI labels, menus, buttons in Simplified Chinese. AI prompts sent in Chinese. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI主动矛盾检查 (Proactive inconsistency detection)** | Core differentiator — no competitor does this well. AI reads generated content and flags contradictions against established lore. | VERY HIGH | Requires: (1) world-building entries with structured data, (2) AI call that compares generated text against lore, (3) UI to show contradictions to the user. Sudowrite has no equivalent. NovelAI relies on manual Memory/Author's Note. This is our kill feature. |
| **Auto-injected context (not manual @ref only)** | Lowers barrier to entry — AI automatically selects relevant lore entries instead of user having to manually @mention them | HIGH | Semantic matching of current writing context to world-building entries. RAG-style retrieval. Sudowrite's Story Bible sends all content every time (costly, doesn't scale). We should be smarter about context window budget. |
| **世界观百科关系图 (Lore relationship graph)** | Visualize relationships between characters, locations, events. Sudowrite has no graph view. | MEDIUM | Manual + AI-suggested relationships between entries. Graph visualization is eye-catching but complex to implement well. Could start with simple link list, evolve to visual graph in v2. |
| **AI chat with selected text** | Select a passage in editor → discuss it in AI chat panel. Essential for revision workflows | MEDIUM | Requires cross-panel communication between editor and chat. User highlights text, it appears as context in chat. All competitors lack this specific pattern (Sudowrite has Rewrite/Feedback on selection, but not chat-based discussion). |
| **Outline-to-chapter generation** | Sudowrite's Story Engine is their flagship feature. Not having this is a gap. | HIGH | From outline + world-building context, generate entire chapter drafts. Sudowrite does this well. We need at minimum a "generate chapter from outline" flow. |
| **BYOK (Bring Your Own Key)** | Eliminates our model cost; gives users control over model choice. No major writing tool does this except NovelAI (which uses their own models) | MEDIUM | Support OpenAI API, Claude API, and custom Base URLs. User provides API key + endpoint. Different pricing models per provider. We don't pay for inference. |
| **Chinese web novel workflow optimization** | Target market specificity — outline-driven serialization with daily update tracking | MEDIUM | Chapter targets, daily word count goals, writing streaks, serialization awareness. Most Western tools don't optimize for the 网文 (web novel) workflow. |
| **Multi-panel workspace** | See world-building, outline, editor, and AI chat simultaneously — unlike competitors' tab-based layouts | HIGH | Resizable panels, persistent across sessions. No competitor offers true multi-panel for novel writing (Scrivener does for screenwriting, but not AI-integrated). |
| **AI-suggested world-building entries** | AI reads your draft and suggests new lore entries ("You mentioned a character '老王' — should I create an entry?") | MEDIUM | Reduces world-building grind. Sudowrite's Story Bible can AI-generate entries, but doesn't proactively suggest them from your draft. NovelAI's Lore Generator is manual-trigger. |
| **Timeline / chronological tracking** | Web novels with complex events need timeline consistency, but no tool does this well | HIGH | Structured timeline view of events. Links to lore entries. AI can check timeline consistency. Very complex to do right — defer to v2 if needed. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Inline AI autocomplete (GitHub Copilot-style)** | Users coming from ChatGPT expect AI to write directly into the editor | Removes author control; AI can go off-track and pollute the manuscript; hard to undo gracefully; encourages lazy "AI writes, I accept" workflow that produces bad novels | Chat-then-follow pattern: AI generates in chat panel, user manually copies/adopts selected portions. Gives full control. |
| **Real-time collaborative writing** | Writing groups want to co-author | Massively increases backend complexity (CRDT/OT, presence, conflict resolution). V1 is single-author tool. Even Google Docs-style collab is a huge engineering lift | Cloud sync for single user. Collaborative writing = separate future product. |
| **AI style mimicry / voice training** | "Make it sound like me" or "write like 古龙" | Requires fine-tuning on user corpus; most users don't have enough data; fine-tuned models go stale; copyright concerns with famous author styles | Provide good system prompts and world-building context. BYOK lets power users choose models that suit their style. |
| **Publishing directly to 网文 platforms (起点, etc.)** | Authors want one-click publish | Each platform has different APIs, formatting requirements, ToS. Maintenance burden is enormous. Changes frequently. | Export to Markdown/DOCX/EPUB. Let authors copy-paste or use platform-specific tools. |
| **Image generation for character art** | Visual world-building is popular (NovelAI, Sudowrite Visualize) | Diverts from core writing value; expensive compute; IP/copyright minefield; huge engineering effort for quality results | Focus on text-first. Character art generation can be v2+ via external API integration. |
| **Version history / full Git-like revision control** | Writers worry about losing work and want to revert | Complex to implement well; most users never use more than basic undo; massive storage cost for cloud | Autosave + simple undo. Version history is explicitly Out of Scope per PROJECT.md. |
| **Built-in proprietary model** | Simpler UX, no API key setup | Fundamentally incompatible with BYOK model; would require massive inference infrastructure costs; locks users into our model quality | BYOK with good model-agnostic prompting. We add value through context management, not model quality. |
| **Plugin ecosystem** | Power users want extensibility | Premature optimization; increases surface area for bugs; takes engineering away from core features; Sudowrite's plugins are barely used by most users | Build core features right first. If demand exists post v1, consider API/webhooks. |

## Feature Dependencies

```
World-Building Entries (Characters, Locations, Rules)
    └──required──> AI Auto-Context Injection
                        └──required──> AI Consistency Checking
                                       (contradiction detection needs both
                                        world-building data AND context
                                        injection to work)

Chapter Outline
    └──required──> Outline-to-Chapter Generation
                       └──enhances──> AI Auto-Context Injection
                                      (outline provides structure for
                                       generation)

Multi-Panel Workspace
    └──required──> AI Chat with Selected Text
                   (cross-panel communication needed)

BYOK Model Support
    └──required──> All AI Features
                   (every AI call goes through user's API key)

User Auth + Cloud Sync
    └──required──> Cross-Device Access
                   └──required──> Project Management

AI Chat Interaction ──conflicts──> Inline AI Autocomplete
    (these represent fundamentally different UX paradigms;
     mixing both confuses users about who's "driving")

World-Building Relationship Graph ──requires──> World-Building Entries
    (can't visualize relationships without entries first)

Timeline Tracking ──requires──> World-Building + Chapter Structure
    (timeline needs events with temporal anchors)

Export ──requires──> Rich Text Editor ──requires──> Project Structure
    (chapters must exist before they can be exported)
```

### Dependency Notes

- **AI Auto-Context Injection requires World-Building Entries:** The injection system needs structured lore data to inject. Without lore entries, there's nothing to inject. This creates a critical onboarding challenge — users must populate lore before AI becomes truly useful.
- **AI Consistency Checking requires Context Injection:** You can't detect contradictions against lore if you don't know what lore exists in context. Injection is a prerequisite.
- **Multi-Panel Workspace enhances AI Chat with Selected Text:** The chat-select pattern only works if both editor and chat panels are visible simultaneously. This is why multi-panel is a prerequisite, not just nice-to-have.
- **BYOK is required by all AI features:** Every AI call routes through the user's API key. This is a fundamental architectural decision that affects everything.
- **AI Chat conflicts with Inline Autocomplete:** These represent opposite UX philosophies. Chat gives user control and deliberation. Autocomplete gives speed and flow. Mixing both creates mode confusion. PROJECT.md explicitly chose "Chat-then-generate" — stick with it.
- **Timeline Tracking requires World-Building + Chapter structure:** Events need temporal anchors. Without at minimum chapter ordering and lore entries with time data, timeline tracking is meaningless.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **BYOK Model Support** — No AI features work without it; architectural foundation
- [x] **Project/Novel Management** — Container for everything else
- [x] **Chapter Management (flat list)** — Core writing organization
- [x] **Rich Text Editor** — Writing surface with basic formatting, autosave
- [x] **World-Building Entries (characters, locations, rules)** — Structured lore that feeds AI
- [x] **AI Chat Interaction** — Chat interface where AI generates drafts based on context
- [x] **Draft-in-chat → Manual Adopt to Editor** — Core interaction pattern for AI output
- [x] **AI Auto-Context Injection** — Automatically read relevant lore entries when generating
- [x] **Multi-Panel Workspace** — Simultaneous view of world-building, outline, editor, AI chat
- [x] **User Auth + Cloud Sync** — Cross-device access is survival for Chinese authors
- [x] **Word Count Statistics** — Daily/total/per-chapter — cultural necessity
- [x] **Chinese-First UI** — All interface elements in Simplified Chinese
- [x] **Export (Markdown, DOCX, EPUB)** — Author trust requires no lock-in
- [x] **Dark Mode** — Minimum theming expectation

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **AI Proactive Inconsistency Detection** — The kill feature, but HIGH complexity. Validate core writing flow first, then add contradiction detection
- [ ] **Outline-to-Chapter Generation** — Sudowrite's Story Engine equivalent. Requires outline + chapter structure to be solid first
- [ ] **AI Chat with Selected Text** — Cross-panel selection-to-chat. Requires multi-panel workspace to be stable first
- [ ] **AI-Suggested World-Building Entries** — AI reads draft and suggests new entries. Requires reliable context injection pipeline
- [ ] **World-Building Entry Relationships (manual + AI-suggested)** — Links between entries. Start with manual, add AI suggestions
- [ ] **Chinese Web Novel Workflow (daily targets, streaks)** — Optimization for 网文 serialization culture
- [ ] **Multiple AI Model Support (GPT-4, Claude, DeepSeek, etc.)** — Beyond initial single-provider BYOK

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Lore Relationship Graph Visualization** — Eye-catching but expensive to build well. Start with simple link lists.
- [ ] **Timeline / Chronological Tracking** — Very complex. Most authors manage this in their heads or external spreadsheets. Not urgent.
- [ ] **Series Support (shared world-building across projects)** — Explicitly Out of Scope per PROJECT.md. Significant architecture change.
- [ ] **Version History / Revision Control** — Explicitly Out of Scope per PROJECT.md. Autosave + undo is sufficient for v1.
- [ ] **Mobile-first Experience** — Desktop web first, responsive for tablets only. Mobile app is separate product consideration.
- [ ] **Plugin System** — Only if v1 gets traction and power users demand extensibility.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| BYOK Model Support | HIGH | MEDIUM | P1 |
| Project Management | HIGH | LOW | P1 |
| Chapter Management | HIGH | LOW | P1 |
| Rich Text Editor | HIGH | HIGH | P1 |
| World-Building Entries | HIGH | MEDIUM | P1 |
| AI Chat Interaction | HIGH | HIGH | P1 |
| AI Auto-Context Injection | HIGH | HIGH | P1 |
| Draft-in-Chat → Manual Adopt | HIGH | MEDIUM | P1 |
| Multi-Panel Workspace | HIGH | HIGH | P1 |
| User Auth + Cloud Sync | HIGH | HIGH | P1 |
| Chinese-First UI | HIGH | LOW | P1 |
| Word Count Statistics | MEDIUM | LOW | P1 |
| Dark Mode | MEDIUM | LOW | P1 |
| Export (MD, DOCX, EPUB) | HIGH | MEDIUM | P1 |
| AI Inconsistency Detection | VERY HIGH | VERY HIGH | P2 |
| Outline-to-Chapter Generation | HIGH | HIGH | P2 |
| AI Chat with Selected Text | MEDIUM | MEDIUM | P1-P2 |
| AI-Suggested Lore Entries | MEDIUM | MEDIUM | P2 |
| Lore Entry Relationships | MEDIUM | MEDIUM | P2 |
| Web Novel Workflow (daily targets) | MEDIUM | MEDIUM | P2 |
| Lore Relationship Graph | LOW-MEDIUM | HIGH | P3 |
| Timeline Tracking | LOW-MEDIUM | VERY HIGH | P3 |
| Series Support | MEDIUM | VERY HIGH | P3 |
| Version History | MEDIUM | HIGH | P3 |
| Mobile Experience | LOW | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Sudowrite | NovelAI | ChatGPT/Claude | Jasper | Our Approach |
|---------|-----------|---------|---------------|--------|--------------|
| **World-Building / Lore** | Story Bible (Synopsis, Characters with traits, Worldbuilding cards) — AI-generate entries, collapsible sections, 4000-word synopsis limit | Lorebook (keyword-activated entries, regex support, categories, phrase bias, advanced placement) — deeply configurable but manual | None structured — all in chat context, manual copy-paste | Brand Voice, Knowledge Base — business-oriented, not fiction | 世界观百科: Structured entries (characters, locations, rules, timeline) + AI auto-injection. Simpler than NovelAI's Lorebook, smarter than Sudowrite's always-send-everything approach. Chinese-first labels and taxonomy. |
| **AI Context Management** | Story Bible auto-included in every generation; "Chapter Continuity" reads recent chapters | Lorebook keyword-activated insertion; Memory box (always included); Author's Note; manual context budget | User manually pastes context; no automatic lore injection | Brand Voice always included; Knowledge Base retrieved | Automatic RAG-style retrieval from world-building entries based on current writing context. Smart context budget — don't send everything, send what's relevant. |
| **Consistency Checking** | No dedicated feature — relies on model reading Story Bible | No feature — relies on Lorebook entries being in context | No feature — user must manually check | No equivalent (business compliance checking, not fiction) | **Proactive inconsistency detection** — AI flags contradictions between new text and established lore. Our killer feature. |
| **Novel-Specific Workflow** | Projects → Story Bible → Outline → Draft (chapter-by-chapter generation from outline) | Story-based (single continuous text with branching); no chapter structure built-in | Flat conversation — no chapter management at all | Campaign-based, not novel-based | Project → Chapters (flat list) → Outline → AI generation. Chat-first interaction with manual adopt. Optimized for 网文 serialization. |
| **AI Generation Mode** | Write (autocomplete), Draft (chapter generation from outline), Expand, Rewrite, Brainstorm, Feedback, Visualize, Plugins | Inline text generation (predict next tokens), Lore Generator for lorebook entries | Chat conversation; no structured novel workflow | Agents and Pipelines — marketing workflow, not fiction | Chat-then-adopt: AI generates in chat panel, user manually adopts to editor. Discussion-first, generation-second. Full author control. |
| **Model Strategy** | Proprietary Muse + Claude + GPT + open-source; included in subscription | Proprietary models (Kayra, Clio, Xialong); included in subscription | Their own models; subscription-based | Multiple models; enterprise subscription | **BYOK**: User provides API key + base URL. We add value through context management, not model access. Supports OpenAI, Claude, DeepSeek, etc. |
| **Chinese Language** | "Works in 30+ languages" but English-first; UI fully English; AI can generate Chinese text | Japanese and English only; no Chinese support | Chinese supported but not optimized for novel writing; no fiction workflow | English-focused; marketing use case | **Chinese-first**: All UI in Simplified Chinese. Prompts optimized for Chinese web novel conventions. BYOK supports Chinese-capable models (DeepSeek, GLM, etc.). |
| **Multi-Panel Layout** | Single editor view with sidebar for Story Bible; tabs for different tools | Single editor with sidebar panels; no simultaneous multi-panel | Single chat interface; no panels | Canvas-based workspace but not writing-focused | **Multi-panel workspace**: World-building, outline, editor, AI chat all visible simultaneously. Resizable panels. The writing cockpit. |
| **Export** | DOCX, PDF, Markdown — basic | Plaintext, .story file (format), image export, scenario export | Copy-paste; no structured export | Various marketing formats | Markdown, DOCX, EPUB. Clean formatting preservation. |
| **Pricing** | $10/mo (225K credits), $22/mo (1M credits), $44/mo (2M credits) | $10/mo (Tablet), $15/mo (Scroll), $25/mo (Opus) | Free tier; $20/mo (Plus); $200/mo (Pro) | $49/mo (Creator); $125/mo (Pro) | Platform fee (TBD) + BYOK API costs paid by user. Potentially much cheaper for heavy users. |
| **Image Generation** | Visualize (character art from descriptions) | Full image generation suite (anime-focused) | DALL-E integration (separate product) | Jasper Art | Not in v1. Focus on writing. |

## Key Feature Insights from Competitor Analysis

### Sudowrite's Strengths (to learn from)
1. **Story Bible** is the closest thing to our world-building feature. It includes Synopsis (up to 4000 words), Characters with typed traits (Physical Description, Dialogue Style, etc.), and Worldbuilding cards. It's well-polished but sends all context every time — expensive and doesn't scale for long novels.
2. **Story Engine / Draft** is their killer feature — outline-to-chapter generation. This is the workflow Chinese web novel authors want most.
3. **Muse** (proprietary fiction model) gives them quality advantages we can't match. We compensate with BYOK allowing users to pick best-in-class models.
4. **Chapter Continuity** reads recent chapters and Story Bible context for generation. This is their version of auto-context injection.
5. **No consistency checking** — this is our biggest opening.

### NovelAI's Strengths (to learn from)
1. **Lorebook** is the most sophisticated world-building system in any writing tool. Keyword-activated entries, regex support, categories with subcontext, placement control, phrase bias. Power-user dream but intimidating for casual users.
2. **Scripting system** allows deep customization — our tool should expose enough configurability without requiring code.
3. **No chapter structure** — NovelAI treats everything as one continuous story. This is a weakness we exploit.

### ChatGPT/Claude's Weaknesses (to exploit)
1. **No persistent project structure** — conversations are flat, no chapter management
2. **No world-building** — all lore must be manually repeated or pasted each time
3. **Context window limits** — long novels exceed context, and there's no smart context management
4. **No novel-specific workflow** — no outlining, no chapter progression, no consistency checking
5. **No BYOK** — users pay their subscription and get whatever model they offer

### Chinese AI Writing Tool Landscape (from training data)
| Tool | Focus | Strengths | Weaknesses |
|------|-------|-----------|------------|
| 墨语 (Moyu) | General AI writing | Chinese NLP good | No novel-specific features, no lore management |
| 秘塔写作猫 (MetaCat) | General writing assistant | Good Chinese grammar correction | Not fiction-focused, no world-building |
| 阅文妙笔 | Web novel assistance | Platform integration with 起点 | Locked to 阅文 ecosystem; generic assistance, not deep world-building |
| 通义千问/文心一言 | General chatbots | Strong Chinese language capability | No novel workflow, no lore, no project management |
| **Gap** | **None of these have dedicated world-building + AI consistency for novels** | | |

**Key insight:** The Chinese market has NO dedicated AI novel writing tool with world-building lore management and consistency checking. This is a wide-open opportunity.

### What Makes This Product Unique vs Each Competitor

**vs Sudowrite:**
- Chinese-first (not an afterthought) — UI, prompts, conventions all Chinese
- BYOK — no credit system, users control costs with their own API keys
- Proactive consistency checking — Sudowrite doesn't have it
- Chat-first interaction — more control than Write/Draft modes
- Multi-panel workspace — see everything at once vs tab-switching

**vs NovelAI:**
- Purpose-built for novels (not interactive fiction / text adventures)
- Chinese language primary
- BYOK with modern LLMs (not limited to NovelAI's proprietary models)
- Chapter structure built-in
- Simpler lore system (NovelAI's Lorebook is intimidatingly complex)

**vs ChatGPT/Claude:**
- Persistent world-building that follows the story
- Automatic context injection (no manual copy-paste)
- Chapter management and outline structure
- Consistency checking against established lore
- Novel-specific workflow end to end

## Sources

- **Sudowrite:** Homepage, FAQ, Pricing, Changelog (2025-2026), Muse page — all directly retrieved 2026-04-13. HIGH confidence.
- **NovelAI:** Documentation (Lorebook, Story Settings, Editor) — directly retrieved 2026-04-13. HIGH confidence.
- **Jasper:** Homepage — retrieved 2026-04-13. Confirmed Jasper is marketing-focused, NOT a novel writing tool. Not a direct competitor. HIGH confidence.
- **Chinese AI writing tools:** Based on training data (2024-2025). MEDIUM confidence — landscape evolves rapidly. Key gap (no dedicated novel writing tool with world-building) is likely still accurate.
- **Multi-panel workspace patterns:** Based on Sudowrite (sidebar-based), NovelAI (panel-based), Scrivener (corkboard/outline). No equivalent Chinese tool uses multi-panel for writing. MEDIUM confidence.

---
*Feature research for: AI Novel Writing Workstation (InkForge)*
*Researched: 2026-04-13*