# InkForge — AI小说专业工作台

## What This Is

InkForge 是一款面向中文网文作者的 AI 小说写作专业工作台。多面板布局集成世界观百科、大纲规划、编辑器和 AI 聊天，核心差异化在于 AI 基于「世界观百科」自动注入上下文并主动检查矛盾，解决现有 AI 写作工具丢失上下文和一致性的核心痛点。用户自带 API Key（BYOK 模式），支持 Web 端和可选桌面端，中文优先。

## Core Value

AI 真正理解你构建的故事世界——自动注入世界观上下文，主动检查跨角色、地点、规则、时间线的矛盾，让作者专注于创作而非记忆一致性。

## Requirements

### Validated

- [x] 用户可以创建/管理小说项目（一本小说一个项目） — Validated in Phase 01: Project & Chapter Foundation
- [x] 章节管理——创建、编辑、排序章节，平面结构（无卷层） — Validated in Phase 01: Project & Chapter Foundation
- [x] 多面板工作区——可拖拽调整面板大小，布局持久化，章节/大纲双标签侧栏 — Validated in Phase 03: Workspace & Chapter Outline
- [x] 大纲/情节规划——章节大纲面板（摘要、目标字数、状态管理），与编辑器并排 — Validated in Phase 03: Workspace & Chapter Outline
- [x] 世界观百科——定义角色（姓名、外貌、性格、背景、关系）、地点、规则/设定、时间线 — Validated in Phase 04: World Bible Foundation
- [x] 世界观条目关联——手动建立条目间关系 + AI 建议关联 — Validated in Phase 06: Context Assembly & Smart AI
- [ ] 大纲/情节规划——可视化情节结构、章节大纲
- [ ] 从大纲生成整章——类似 Sudowrite Story Engine，基于大纲 + 世界观自动生成完整章节
- [ ] AI 聊天交互——对话式讨论后生成草稿，草稿在聊天面板展示，手动采纳到编辑器
- [x] AI 自动注入上下文——生成前自动读取相关世界观条目、角色、情节 — Validated in Phase 06: Context Assembly & Smart AI
- [ ] AI 主动矛盾检查——检测与已建立设定矛盾的内容
- [x] 选中文字与 AI 讨论——在编辑器中选中文字，在 AI 聊天中针对该片段讨论 — Validated in Phase 06: Context Assembly & Smart AI
- [ ] 多面板工作区——世界观百科、大纲、编辑器、AI 聊天同时可见（Phase 3 完成基础双面板，Phase 5 四面板）
- [ ] BYOK 模式——用户自带 API Key 和 Base URL
- [ ] 用户登录 + 全项目云同步
- [ ] 导出为 Markdown、DOCX、EPUB
- [ ] 字数统计——实时显示总字数、章节字数、今日写作字数

### Out of Scope

- 直接发布到网文平台（起点等）—— v1 专注写作，发布是独立流程
- 草稿版本历史/回滚—— v1 不做版控，后续迭代加入
- 移动端优先体验—— Web 桌面优先，响应式适配平板
- 协作写作/多人共创 —— v1 单人创作工具
- AI 风格定制/模仿作者风格 —— v1 先做好基础知识能力
- 系列小说共享世界观 —— 一本小说一个项目，系列支持后续迭代

## Context

- 竞品：Sudowrite（主要竞品）、NovelAI、各类 AI 写作工具
- 核心痛点：现有 AI 写作工具丢失上下文，忘记角色特征、世界观规则、情节细节
- 目标用户：所有小说作者，特别是中文网文/连载小说作者
- 产品语言：中文优先，界面和 AI 交互以中文为主
- 技术：React + Next.js 前端，Web 端 + 可选桌面端（Tauri）
- 商业模式：用户自带 API Key（BYOK），平台本身收费
- 写作流程：聊天式交互 → AI 基于世界观上下文生成 → 草稿在聊天面板展示 → 作者手动采纳到编辑器

## Constraints

- **Tech Stack**: React + Next.js 前端框架
- **Language**: 中文优先的 UI 和写作体验
- **AI Model**: BYOK——用户自带 API Key 和 Base URL，产品不内置模型成本
- **Platform**: Web 端（桌面优先）+ 可选桌面端封装

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-panel workspace | 作者需要同时查看世界观、大纲、编辑器和 AI 聊天 | — Pending |
| Chat-then-generate AI flow | 对话式交互比内联补全更适合长文创作，给予作者完全控制权 | — Pending |
| Draft in chat → manual accept | 作者不应被动接受 AI 输出，需主动审查和采纳 | — Pending |
| Auto-inject context (not manual @ref only) | 降低使用门槛，AI 应自动理解上下文而非依赖用户手动引用 | — Pending |
| BYOK model | 避免内置模型成本，用户可自由选择 LLM 提供商 | — Pending |
| One novel = one project | 简化 v1，系列共享世界观推迟到后续迭代 | — Pending |
| Flat chapter structure (no volumes) | 网文常见结构，无需卷层级 | — Pending |
| Chinese-first | 核心用户群体是中文网文作者 | — Pending |
| Login + full project cloud sync | 跨设备写作是刚需 | — Pending |
| Manual + AI-suggested relationships | 世界观条目关联既需人工控制又需 AI 辅助发现 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-15 — Phase 06 complete*