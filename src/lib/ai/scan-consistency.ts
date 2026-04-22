/**
 * Proactive consistency scanning via Direct API mode.
 *
 * Scans chapter content against world bible entries without going through
 * the streamChat tool-use path. Returns structured violations that are
 * persisted to the contradictions table with 7-day dedup.
 */

import type { AIClientConfig } from './providers/types'
import type { WorldEntry, WorldEntryType } from '../types/world-entry'
import { buildWorldBibleBlock } from './prompts'

export interface ConsistencyViolation {
  entryName: string
  entryType: WorldEntryType
  description: string
  severity: 'high' | 'medium' | 'low'
}

export interface ScanConsistencyOptions {
  config: AIClientConfig
  chapterTitle: string
  chapterContent: string
  worldEntries: WorldEntry[]
  signal?: AbortSignal
}

export async function scanConsistency(
  options: ScanConsistencyOptions
): Promise<ConsistencyViolation[]> {
  const { config, chapterTitle, chapterContent, worldEntries, signal } = options

  const systemPrompt = buildScanSystemPrompt(chapterTitle, chapterContent, worldEntries)
  const { url, headers } = buildScanRequest(config)

  const body =
    config.provider === 'anthropic'
      ? {
          model: config.model ?? 'claude-sonnet-4-5',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `请扫描章节"${chapterTitle}"，找出与世界观百科的矛盾。`,
            },
          ],
        }
      : {
          model: config.model || 'gpt-4',
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `请扫描章节"${chapterTitle}"，找出与世界观百科的矛盾。`,
            },
          ],
        }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Scan failed: ${response.status}`)
  }

  const data = await response.json()
  return parseScanResponse(data)
}

/**
 * Build the scan request URL and headers based on provider type.
 */
function buildScanRequest(config: AIClientConfig): {
  url: string
  headers: Record<string, string>
} {
  if (config.provider === 'openai-compatible') {
    const base = normalizeOpenAICompatibleBaseUrl(config.baseUrl)
    return {
      url: `${base}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    }
  }

  // Anthropic
  const base = config.baseUrl
    ? config.baseUrl.replace(/\/+$/, '')
    : 'https://api.anthropic.com'
  // Ensure /v1 prefix for the messages endpoint
  const baseForMessages = base.endsWith('/v1') ? base : `${base}/v1`
  return {
    url: `${baseForMessages}/messages`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
  }
}

function normalizeOpenAICompatibleBaseUrl(raw: string): string {
  let url = raw.trim()
  if (!url) url = 'https://api.openai.com'
  if (url.endsWith('/')) url = url.slice(0, -1)
  if (!url.endsWith('/v1')) url = `${url}/v1`
  return url
}

function buildScanSystemPrompt(
  chapterTitle: string,
  chapterContent: string,
  worldEntries: WorldEntry[]
): string {
  const worldBible = buildWorldBibleBlock(worldEntries)

  return `【一致性扫描任务】

你是一个严格的世界观审计员。请仔细阅读作者提供的【章节内容】。

【章节内容】
标题：${chapterTitle}
内容：${chapterContent}

${worldBible}

【你的任务】
1. 逐条核对章节内容是否与世界观百科一致
2. 发现矛盾时，输出结构化的矛盾列表
3. 严重程度：high=明显冲突，medium=需要确认，low=模糊

【输出格式】
请以 JSON 数组格式输出矛盾列表，每个矛盾包含：
- entryName: 矛盾涉及的世界观条目名称
- entryType: 条目类型（character/location/rule/timeline）
- description: 矛盾的具体描述
- severity: high/medium/low

如果没有发现矛盾，返回空数组 []。`
}

function parseScanResponse(data: unknown): ConsistencyViolation[] {
  // 支持两种响应格式：
  // Anthropic: { content: [{ type: 'text', text: '...' }] }
  // OpenAI-compatible: { choices: [{ message: { content: '...' } }] }
  let text: string

  if (typeof data === 'object' && data !== null) {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.content)) {
      // Anthropic format
      text = (d.content as Array<{ type: string; text?: string }>)
        .filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('')
    } else if (Array.isArray(d.choices)) {
      // OpenAI-compatible format
      const choice = (d.choices as Array<{ message?: { content?: string } }>)[0]
      text = choice?.message?.content ?? ''
    } else {
      text = String(data)
    }
  } else {
    text = String(data)
  }

  // 提取 JSON（可能在 ```json 块中）
  const jsonMatch =
    text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || text.match(/(\[[\s\S]*?\])/)

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1])
    } catch {
      return []
    }
  }
  return []
}
