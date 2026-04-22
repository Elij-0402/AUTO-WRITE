/**
 * Wizard Mode hook - AI构思搭档
 *
 * 实现流程:
 * 1. triggerWizardMode() → thinking状态
 * 2. silentThink(context) → 静默思考，生成选项
 * 3. 用户选择选项
 * 4. expandOption() → 生成情节建议
 */

import { useState, useCallback, useRef } from 'react'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DOMPurify = require('dompurify')
import { useAIConfig } from './use-ai-config'
import { useWorldEntries } from './use-world-entries'
import {
  extractKeywords,
  findRelevantEntries,
  trimToTokenBudget,
  type EntriesByType,
} from './use-context-injection'
import { type SegmentedSystemPrompt } from '../ai/prompts'
import { streamChat, type ProviderStreamMessage } from '../ai/client'
import { errorHint } from '../ai/error-hint'

export type WizardModeState =
  | 'idle'
  | 'thinking'
  | 'options'
  | 'expanding'
  | 'done'
  | 'error'

export interface WizardOption {
  type: 'logical' | 'wild' | 'custom'
  title: string
  description: string
}

interface UseWizardModeOptions {
  projectId: string
  conversationId: string | null
  selectedText?: string | null
}

const WIZARD_OPTIONS_PROMPT = `你是一个专业的中文网文写作编辑，擅长和作者一起构思情节。

【你的任务】
当作者说"我不知道怎么往下写了"，你需要：
1. 先仔细阅读提供的世界观和当前文本
2. 思考作者可能想要表达的核心冲突或发展方向
3. 提供2-3个情节方向选项

【选项类型】
- 情理之中：符合已有设定和规则的情节推进，让故事自然发展
- 天马行空：出乎意料但和世界观兼容的发展，制造惊喜但不失逻辑
- 我有想法：引导用户描述自己的想法

【输出格式】
严格按以下JSON格式输出，不要有任何其他内容：
{
  "options": [
    {"type": "logical", "title": "方向标题", "description": "1-2句话描述这个方向"},
    {"type": "wild", "title": "方向标题", "description": "1-2句话描述这个方向"}
  ]
}

记住：选项要简洁有力，让作者能快速做决定。`

const EXPAND_OPTION_PROMPT = `你是一个专业的中文网文写作编辑。

【当前任务】
用户选择了以下方向，请生成一段情节建议：

方向：[选项标题]
描述：[选项描述]

【要求】
- 生成150-300字的情节建议
- 内容要符合世界观设定
- 要有具体的场景、动作、对话构思
- 结尾要给作者留出创作空间

直接输出建议内容，不要有其他格式。`

export function useWizardMode({ projectId, conversationId, selectedText }: UseWizardModeOptions) {
  const { config } = useAIConfig()
  const { entriesByType } = useWorldEntries(projectId)
  const [state, setState] = useState<WizardModeState>('idle')
  const [options, setOptions] = useState<WizardOption[]>([])
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const getRelevantContext = useCallback(async () => {
    if (!entriesByType) return []

    // 提取关键词并查找相关条目
    const keywords = selectedText
      ? extractKeywords(selectedText)
      : []
    const relevant = keywords.length > 0
      ? findRelevantEntries(keywords, entriesByType as EntriesByType).slice(0, 6)
      : []

    // 如果没有选中文字，取前6个最相关的条目
    const entries = relevant.length > 0
      ? relevant
      : Object.values(entriesByType as EntriesByType).flat().slice(0, 6)

    return trimToTokenBudget(entries, 2000)
  }, [entriesByType, selectedText])

  const triggerWizardMode = useCallback(async () => {
    if (!conversationId || !config.apiKey) {
      setError('请先配置API密钥')
      setState('error')
      return
    }

    setState('thinking')
    setOptions([])
    setResult(null)
    setError(null)

    try {
      const relevantEntries = await getRelevantContext()

      // 构建提示词 - 使用向导模式专用提示词
      const worldBibleContext = relevantEntries.length > 0
        ? relevantEntries.map(e => {
            const prefix = e.type === 'character' ? '【角色】' : e.type === 'location' ? '【地点】' : e.type === 'rule' ? '【规则】' : '【时间线】'
            const parts = [`${prefix}${e.name}`]
            if (e.type === 'character') {
              if (e.personality) parts.push(`性格: ${e.personality}`)
              if (e.appearance) parts.push(`外貌: ${e.appearance}`)
              if (e.background) parts.push(`背景: ${e.background}`)
            } else if (e.type === 'location') {
              if (e.description) parts.push(`描述: ${e.description}`)
            } else if (e.type === 'rule') {
              if (e.content) parts.push(`内容: ${e.content}`)
            } else if (e.type === 'timeline') {
              if (e.eventDescription) parts.push(`事件: ${e.eventDescription}`)
            }
            return parts.join('｜')
          }).join('\n')
        : '(暂无世界观条目)'

      const segmentedSystem: SegmentedSystemPrompt = {
        baseInstruction: WIZARD_OPTIONS_PROMPT,
        worldBibleContext: `【世界观百科】\n${worldBibleContext}`,
        runtimeContext: selectedText
          ? `【当前讨论】\n作者选中了以下文段进行构思：\n${selectedText}`
          : '',
      }

      // 发送静默请求
      abortControllerRef.current = new AbortController()

      const messages: ProviderStreamMessage[] = [
        {
          role: 'user',
          content: selectedText
            ? `【当前写作内容】\n${selectedText}\n\n我不知道怎么往下写了，请给我一些方向建议。`
            : '我不知道怎么往下写了，请给我一些方向建议。',
        },
      ]

      let fullContent = ''

      const events = streamChat(
        {
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        },
        {
          segmentedSystem,
          messages,
          signal: abortControllerRef.current.signal,
        }
      )

      for await (const event of events) {
        if (event.type === 'text_delta') {
          fullContent += event.delta
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      // 解析JSON响应
      const parsed = parseWizardResponse(fullContent)
      if (parsed && parsed.options.length > 0) {
        setOptions(parsed.options)
        setState('options')
      } else {
        // 解析失败，尝试自由格式
        setOptions([
          {
            type: 'logical',
            title: '情理之中',
            description: '符合已有设定的自然发展',
          },
          {
            type: 'wild',
            title: '天马行空',
            description: '出人意料但合理的发展',
          },
        ])
        setState('options')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState('idle')
      } else {
        console.error('Wizard mode error:', err)
        setError(errorHint(err instanceof Error ? err.message : '发生错误'))
        setState('error')
      }
    }
  }, [config, projectId, conversationId, selectedText, getRelevantContext])

  const selectOption = useCallback(async (option: WizardOption) => {
    if (!conversationId || !config.apiKey) {
      setError('请先配置API密钥')
      setState('error')
      return
    }

    setState('expanding')

    try {
      const relevantEntries = await getRelevantContext()

      // 构建展开提示词
      const worldBibleContext = relevantEntries.length > 0
        ? relevantEntries.map(e => {
            const prefix = e.type === 'character' ? '【角色】' : e.type === 'location' ? '【地点】' : e.type === 'rule' ? '【规则】' : '【时间线】'
            const parts = [`${prefix}${e.name}`]
            if (e.type === 'character') {
              if (e.personality) parts.push(`性格: ${e.personality}`)
              if (e.appearance) parts.push(`外貌: ${e.appearance}`)
              if (e.background) parts.push(`背景: ${e.background}`)
            } else if (e.type === 'location') {
              if (e.description) parts.push(`描述: ${e.description}`)
            } else if (e.type === 'rule') {
              if (e.content) parts.push(`内容: ${e.content}`)
            } else if (e.type === 'timeline') {
              if (e.eventDescription) parts.push(`事件: ${e.eventDescription}`)
            }
            return parts.join('｜')
          }).join('\n')
        : '(暂无世界观条目)'

      const expandPrompt = `${EXPAND_OPTION_PROMPT}
方向：${option.title}
描述：${option.description}`

      const segmentedSystem: SegmentedSystemPrompt = {
        baseInstruction: expandPrompt,
        worldBibleContext: `【世界观百科】\n${worldBibleContext}`,
        runtimeContext: selectedText
          ? `【当前讨论】\n作者选中了以下文段进行构思：\n${selectedText}`
          : '',
      }

      abortControllerRef.current = new AbortController()

      const messages: ProviderStreamMessage[] = [
        {
          role: 'user',
          content: selectedText
            ? `【当前写作内容】\n${selectedText}\n\n我选择了"${option.title}"：${option.description}`
            : `我选择了"${option.title}"：${option.description}`,
        },
      ]

      let fullContent = ''

      const events = streamChat(
        {
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        },
        {
          segmentedSystem,
          messages,
          signal: abortControllerRef.current.signal,
        }
      )

      for await (const event of events) {
        if (event.type === 'text_delta') {
          fullContent += event.delta
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      // 净化 LLM 输出，防止 XSS/CSS 注入
      const sanitizedResult = DOMPurify.sanitize(fullContent, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['class'],
      })
      setResult(sanitizedResult)
      setState('done')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState('options')
      } else {
        console.error('Expand option error:', err)
        setError(errorHint(err instanceof Error ? err.message : '发生错误'))
        setState('error')
      }
    }
  }, [config, projectId, conversationId, selectedText, getRelevantContext])

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setState('idle')
    setOptions([])
    setResult(null)
    setError(null)
  }, [])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setState('idle')
    setOptions([])
    setResult(null)
    setError(null)
  }, [])

  return {
    state,
    options,
    result,
    error,
    triggerWizardMode,
    selectOption,
    cancel,
    reset,
  }
}

function parseWizardResponse(content: string): { options: WizardOption[] } | null {
  try {
    // 尝试提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.options || !Array.isArray(parsed.options)) return null

    const validOptions: WizardOption[] = []

    for (const opt of parsed.options) {
      if (opt.type && opt.title && opt.description) {
        validOptions.push({
          type: opt.type,
          title: opt.title,
          description: opt.description,
        })
      }
    }

    return validOptions.length > 0 ? { options: validOptions } : null
  } catch {
    return null
  }
}
