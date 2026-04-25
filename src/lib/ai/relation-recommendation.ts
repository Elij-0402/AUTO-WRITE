import type { WorldEntry, WorldEntryType } from '../types/world-entry'
import type { RelationCategory } from '../types/relation'
import { streamChat } from './client'
import type { AIClientConfig } from './client'
import { getProjectAIConfig } from './ai-config-queries'

export interface AIRecommendationInput {
  sourceNode: {
    id: string
    name: string
    type: WorldEntryType
    description: string
    createdRelations: Array<{
      targetId: string
      targetName: string
      category: RelationCategory
    }>
  }
  allEntries: WorldEntry[]
}

export interface AIRecommendationTarget {
  targetNode: {
    id?: string        // undefined means suggestion to create new
    name: string
    type: WorldEntryType
    isNew: boolean
  }
  suggestedRelation: {
    category: RelationCategory
    description: string
    confidence: number  // 0-1
  }
}

export interface AIRecommendationResult {
  recommendations: AIRecommendationTarget[]
}

/**
 * Get AI recommendation for potential relations from a source node.
 * Returns up to 8 recommendations sorted by confidence.
 */
export async function getRelationRecommendations(
  projectId: string,
  input: AIRecommendationInput
): Promise<AIRecommendationResult> {
  const config = await getProjectAIConfig(projectId)
  if (!config?.apiKey) {
    throw new Error('AI 未配置')
  }

  const clientConfig: AIClientConfig = {
    provider: config.provider ?? 'openai-compatible',
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
  }

  const prompt = buildRecommendationPrompt(input)

  const events = streamChat(clientConfig, {
    segmentedSystem: {
      baseInstruction: SYSTEM_PROMPT,
      worldBibleContext: '',
      runtimeContext: '',
    },
    messages: [{ role: 'user', content: prompt }],
  })

  let fullText = ''
  for await (const event of events) {
    if (event.type === 'text_delta') {
      fullText += event.delta
    }
  }

  return parseRecommendationResult(fullText)
}

const SYSTEM_PROMPT = `你是一个小说世界观关系分析助手。当用户提供一个源条目时，你需要分析该条目与其他可能存在但尚未建立关系的条目之间的潜在关系。

分析要求：
1. 考虑源条目的类型、背景、描述等信息
2. 考虑已有的关系，避免推荐重复关系
3. 优先推荐已存在的条目，其次推荐可能需要创建的新条目
4. 为每个推荐给出关系类型和描述建议，以及置信度（0-1）
5. **必须**为每个推荐返回有效的 type 字段（包括新创建的条目），type 只能是 character|location|rule|timeline 之一

输出格式（严格遵循 JSON）：
{
  "recommendations": [
    {
      "targetNode": {
        "name": "条目名称",
        "type": "character|location|rule|timeline",
        "isNew": false
      },
      "suggestedRelation": {
        "category": "character_relation|general",
        "description": "关系描述",
        "confidence": 0.85
      }
    }
  ]
}

只输出 JSON，不要有其他文字。`

function buildRecommendationPrompt(input: AIRecommendationInput): string {
  const { sourceNode, allEntries } = input

  const existingRelationTargets = new Set(sourceNode.createdRelations.map(r => r.targetId))
  const candidates = allEntries.filter(
    e => e.id !== sourceNode.id && !existingRelationTargets.has(e.id) && !e.deletedAt
  )

  const candidatesText = candidates
    .map(e => `- ${e.name} (${e.type}): ${e.description || e.background || ''}`)
    .join('\n')

  const existingRelationsText = sourceNode.createdRelations
    .map(r => `- ${r.targetName}: ${r.category}`)
    .join('\n')

  return `源条目：${sourceNode.name} (${sourceNode.type})
描述：${sourceNode.description || '无'}

已建立的关系：
${existingRelationsText || '无'}

可连接的候选条目：
${candidatesText}

请分析源条目与候选条目之间可能的潜在关系，按置信度排序，最多返回 8 个推荐。`
}

export function parseRecommendationResult(text: string): AIRecommendationResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { recommendations: [] }
    }
    const parsed = JSON.parse(jsonMatch[0])
    return parsed as AIRecommendationResult
  } catch {
    return { recommendations: [] }
  }
}
