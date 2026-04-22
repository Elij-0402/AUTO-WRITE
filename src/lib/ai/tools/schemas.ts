/**
 * Structured tool definitions. These replace the regex-based suggestion parser
 * (src/lib/ai/suggestion-parser.ts) when the provider supports tool use.
 *
 * The AI emits tool_use blocks during its response — each one becomes a
 * suggestion card or contradiction warning in the UI. Schemas mirror the
 * fields the UI already renders so no translation layer is needed.
 */

import type { WorldEntryType } from '../../types/world-entry'

export const WORLD_ENTRY_TYPES = ['character', 'location', 'rule', 'timeline'] as const
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const
export const SEVERITY_LEVELS = ['high', 'medium', 'low'] as const

export interface SuggestEntryInput {
  entryType: WorldEntryType
  name: string
  description?: string
  /** Type-specific extracted fields (background, appearance, etc.) */
  fields?: Record<string, string>
  confidence?: 'high' | 'medium' | 'low'
}

export interface SuggestRelationInput {
  entry1Name: string
  entry2Name: string
  entry1Type?: WorldEntryType
  entry2Type?: WorldEntryType
  relationshipType: string
  bidirectionalDescription: string
  confidence?: 'high' | 'medium' | 'low'
}

export interface ReportContradictionInput {
  entryName: string
  entryType: WorldEntryType
  description: string
  severity?: 'high' | 'medium' | 'low'
}

/** JSON Schema for suggest_entry — passed to Anthropic tool_use / OpenAI function_call */
export const SUGGEST_ENTRY_SCHEMA = {
  name: 'suggest_entry',
  description:
    '当你在回复中提到一个尚未录入世界观百科的角色、地点、规则或时间线事件时，用此工具提示作者添加新条目。只在确实是"新"的且对故事有意义时使用，不要为每一个偶然提到的名字调用。',
  input_schema: {
    type: 'object',
    properties: {
      entryType: {
        type: 'string',
        enum: [...WORLD_ENTRY_TYPES],
        description: '条目类型：character=角色，location=地点，rule=规则，timeline=时间线事件',
      },
      name: { type: 'string', description: '建议的条目名称' },
      description: { type: 'string', description: '一句话描述，会预填到表单' },
      fields: {
        type: 'object',
        description:
          '类型相关的字段。character: {background, appearance, personality, alias}；location: {description, features}；rule: {content, scope}；timeline: {timePoint, eventDescription}',
        additionalProperties: { type: 'string' },
      },
      confidence: { type: 'string', enum: [...CONFIDENCE_LEVELS] },
    },
    required: ['entryType', 'name'],
  },
} as const

export const SUGGEST_RELATION_SCHEMA = {
  name: 'suggest_relation',
  description:
    '当你在回复中描述了两个已存在条目之间的某种关系（敌对、亲属、同盟、师承、位于等）且该关系尚未在世界观百科中记录时，用此工具提示作者建立关联。只对两个条目确实都已经在世界观百科中存在的情况使用。',
  input_schema: {
    type: 'object',
    properties: {
      entry1Name: { type: 'string', description: '条目 1 名称（必须匹配现有世界观条目）' },
      entry2Name: { type: 'string', description: '条目 2 名称（必须匹配现有世界观条目）' },
      entry1Type: { type: 'string', enum: [...WORLD_ENTRY_TYPES] },
      entry2Type: { type: 'string', enum: [...WORLD_ENTRY_TYPES] },
      relationshipType: {
        type: 'string',
        description: '关系类型短语，如"师父"、"盟友"、"所在地"、"下属"',
      },
      bidirectionalDescription: {
        type: 'string',
        description: '双向描述，例如"张三是李四的师父，李四是张三的徒弟"',
      },
      confidence: { type: 'string', enum: [...CONFIDENCE_LEVELS] },
    },
    required: ['entry1Name', 'entry2Name', 'relationshipType', 'bidirectionalDescription'],
  },
} as const

export interface ChapterDraftInput {
  outline: string
  targetWordCount?: [number, number]
  chapterTitle?: string
}

export const REPORT_CONTRADICTION_SCHEMA = {
  name: 'report_contradiction',
  description:
    '当你生成的草稿内容或分析中发现与"【世界观百科】"中已记录设定明显矛盾的点（例如角色设定冲突、地点位置错位、规则违反），用此工具报告矛盾。只在矛盾明确且非作者故意为之时报告；轻微模糊的点不要报。',
  input_schema: {
    type: 'object',
    properties: {
      entryName: { type: 'string', description: '被矛盾的世界观条目名称' },
      entryType: { type: 'string', enum: [...WORLD_ENTRY_TYPES] },
      description: { type: 'string', description: '矛盾具体描述：什么和什么冲突，哪里冲突' },
      severity: {
        type: 'string',
        enum: [...SEVERITY_LEVELS],
        description: 'high=明显冲突；medium=需要作者确认；low=模糊（不会显示给作者）',
      },
    },
    required: ['entryName', 'entryType', 'description'],
  },
} as const

export const CHAPTER_DRAFT_SCHEMA = {
  name: 'chapter_draft',
  description: '当用户请求生成章节草稿时，用此工具输出结构化草稿内容。草稿应符合世界观设定，字数在用户指定范围内。',
  input_schema: {
    type: 'object',
    properties: {
      outline: { type: 'string', description: '章节大纲或写作要点' },
      targetWordCount: {
        type: 'array',
        items: { type: 'number' },
        minItems: 2,
        maxItems: 2,
        description: '目标字数范围 [最小字数, 最大字数]',
      },
      chapterTitle: { type: 'string', description: '章节标题（可选）' },
    },
    required: ['outline'],
  },
} as const

export const ALL_TOOL_SCHEMAS = [
  SUGGEST_ENTRY_SCHEMA,
  SUGGEST_RELATION_SCHEMA,
  REPORT_CONTRADICTION_SCHEMA,
  CHAPTER_DRAFT_SCHEMA,
] as const

export type ToolName = (typeof ALL_TOOL_SCHEMAS)[number]['name']
