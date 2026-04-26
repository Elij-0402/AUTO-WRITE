/**
 * System prompt building with cache-friendly segmentation.
 *
 * Anthropic prompt caching lets us mark content blocks as cacheable so the
 * provider reuses the computed KV cache for up to 1 hour. We split the system
 * prompt into:
 *
 *   1. BASE_INSTRUCTION     — stable across every request for every project.
 *   2. worldBibleContext    — stable within a project until entries change.
 *   3. runtime context      — per-message (selected text, user query).
 *
 * The first two get cache_control markers on the Anthropic path; the
 * OpenAI-compatible path just concatenates everything.
 */

import type { ProjectCharter } from '../types'
import type { WorldEntry } from '../types/world-entry'
import { formatEntryForContext } from '../hooks/use-context-injection'

export const BASE_INSTRUCTION = `你是 InkForge 的中文网文写作助手，熟悉中国网络小说的节奏、爽点、人物塑造和世界观架构。

【你的职责】
- 基于作者提供的【世界观百科】理解故事设定，不要臆造未提及的设定。
- 当作者请求续写时，给出草稿时明确标注"以下是草稿"开头，内容与世界观严格一致。
- 当作者讨论文段时，基于世界观给出分析与建议。
- 当发现值得录入百科的新角色/地点/规则/时间线，调用 suggest_entry 工具；发现可建立关系，调用 suggest_relation；发现草稿与世界观矛盾，调用 report_contradiction。
- 工具调用是对作者的"建议卡片"，不是执行操作，作者可以采纳或驳回。不要一轮对话里刷屏建议：最多 3 条，且只在真正必要时使用。

【语言】
- 一律使用简体中文回复。`

export interface BuildSystemPromptParams {
  projectCharter?: ProjectCharter | null
  worldEntries: WorldEntry[]
  /** Optional selected text the user is discussing. */
  selectedText?: string
  /** Optional rolling summary of prior turns beyond the sliding window. */
  rollingSummary?: string
  /** Optional chapter draft instruction for draft generation. */
  chapterDraftInstruction?: string
}

/**
 * Segmented system prompt for cache-aware providers.
 * Callers that don't support caching can just concatenate .baseInstruction +
 * .worldBibleContext + runtime context with newlines.
 */
export interface SegmentedSystemPrompt {
  /** Stable across every request globally. */
  baseInstruction: string
  /** Stable within a project as long as the project charter does not change. */
  projectCharterContext: string
  /** Stable across a session as long as world entries don't change. */
  worldBibleContext: string
  /** Per-message preamble describing current discussion context. */
  runtimeContext: string
  /** Chapter draft generation context — only set when generating a draft. */
  chapterDraftContext?: string
}

export function buildSegmentedSystemPrompt(
  params: BuildSystemPromptParams
): SegmentedSystemPrompt {
  const projectCharterContext = buildProjectCharterBlock(params.projectCharter)
  const worldBibleContext = buildWorldBibleBlock(params.worldEntries)
  const parts: string[] = []
  if (params.rollingSummary && params.rollingSummary.trim()) {
    parts.push(`【此前对话摘要】\n${params.rollingSummary.trim()}`)
  }
  if (params.selectedText) {
    parts.push(`【当前讨论】\n作者选中了以下文段进行讨论：\n${params.selectedText}`)
  }
  const runtimeContext = parts.join('\n\n')

  return {
    baseInstruction: BASE_INSTRUCTION,
    projectCharterContext,
    worldBibleContext,
    runtimeContext,
    chapterDraftContext: params.chapterDraftInstruction,
  }
}

function buildProjectCharterBlock(projectCharter?: ProjectCharter | null): string {
  if (!projectCharter) {
    return ''
  }

  const parts = [
    projectCharter.oneLinePremise && `一句话 premise：${projectCharter.oneLinePremise}`,
    projectCharter.storyPromise && `故事承诺：${projectCharter.storyPromise}`,
    projectCharter.themes.length > 0 && `主题：${projectCharter.themes.join('、')}`,
    projectCharter.tone && `语气：${projectCharter.tone}`,
    projectCharter.targetReader && `目标读者：${projectCharter.targetReader}`,
    projectCharter.styleDos.length > 0 && `风格要做：${projectCharter.styleDos.join('；')}`,
    projectCharter.tabooList.length > 0 && `明确禁区：${projectCharter.tabooList.join('；')}`,
    projectCharter.positiveReferences.length > 0 &&
      `正向参考：${projectCharter.positiveReferences.join('；')}`,
    projectCharter.negativeReferences.length > 0 &&
      `反向参考：${projectCharter.negativeReferences.join('；')}`,
    projectCharter.aiUnderstanding && `AI 理解：${projectCharter.aiUnderstanding}`,
  ].filter(Boolean)

  if (parts.length === 0) {
    return '【作品宪章】\n(暂无作品宪章)'
  }

  return `【作品宪章】\n${parts.join('\n')}`
}

export function buildWorldBibleBlock(entries: WorldEntry[]): string {
  if (entries.length === 0) {
    return '【世界观百科】\n(暂无相关世界观条目)'
  }
  const body = entries.map(formatEntryForContext).join('\n')
  return `【世界观百科】\n${body}`
}

export const CHAPTER_DRAFT_INSTRUCTION = `【章节草稿生成任务】

你需要根据作者提供的【章节大纲】，生成一段符合要求的中文网文初稿。

【要求】
1. 严格遵循章节大纲的方向，不要偏离
2. 内容必须与【世界观百科】保持一致，不得臆造设定
3. 人物行为和对话必须符合其性格设定
4. 场景描写要符合地点设定
5. 草稿开头必须标注"以下是草稿"四字
6. 生成后，用 chapter_draft 工具输出完整草稿

【输出格式】
通过 chapter_draft 工具输出，outline 字段填入本章大纲。

请开始生成草稿：`

/** Concatenate the segments for providers without cache support. */
export function flattenSystemPrompt(segments: SegmentedSystemPrompt): string {
  const parts = [
    segments.baseInstruction,
    segments.projectCharterContext,
    segments.worldBibleContext,
    segments.runtimeContext,
  ]
  if (segments.chapterDraftContext) {
    parts.push(segments.chapterDraftContext)
  }
  return parts.filter(Boolean).join('\n\n')
}
