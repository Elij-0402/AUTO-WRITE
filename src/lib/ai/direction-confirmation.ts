import { streamChat, type AIClientConfig, type ProviderStreamMessage } from './client'
import type { SegmentedSystemPrompt } from './prompts'

const DIRECTION_CONFIRMATION_SYSTEM: SegmentedSystemPrompt = {
  baseInstruction: [
    '你是作品方向整理助手。',
    '阅读作者与写作助手最近几轮对话，判断作品方向是否已经足够清晰，可以做一次轻量确认。',
    '如果信息不足，就返回 shouldConfirm=false。',
    '如果信息足够，就提炼：一句方向总结、一个核心体验句、两个关键词。',
    '必须用简体中文，关键词只保留两个，避免空话。',
    '严格输出 [DIRECTION_JSON_START] 和 [DIRECTION_JSON_END] 包裹的 JSON。',
  ].join(''),
  projectCharterContext: '',
  worldBibleContext: '',
  runtimeContext: '',
}

export interface DirectionConfirmationDraft {
  shouldConfirm: boolean
  oneLinePremise: string
  storyPromise: string
  themes: string[]
}

export async function generateDirectionConfirmation(
  config: AIClientConfig,
  messages: ProviderStreamMessage[]
): Promise<DirectionConfirmationDraft | null> {
  if (messages.length === 0) {
    return null
  }

  const transcript = messages
    .map(message => `【${message.role === 'user' ? '作者' : '助手'}】${message.content}`)
    .join('\n\n')

  const schema = {
    shouldConfirm: true,
    oneLinePremise: '这是一个关于___的故事。',
    storyPromise: '核心体验偏___。',
    themes: ['关键词1', '关键词2'],
  }

  const events = streamChat(config, {
    segmentedSystem: DIRECTION_CONFIRMATION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          '请判断下面对话是否已经适合做一次轻量方向确认。',
          '如果适合，请提炼方向总结、核心体验、两个关键词。',
          '如果还不适合，请返回 shouldConfirm=false，其他字段留空字符串或空数组。',
          '',
          transcript,
          '',
          '[DIRECTION_JSON_START]',
          JSON.stringify(schema, null, 2),
          '[DIRECTION_JSON_END]',
        ].join('\n'),
      },
    ],
  })

  let out = ''
  for await (const event of events) {
    if (event.type === 'text_delta') {
      out += event.delta
    } else if (event.type === 'error') {
      throw new Error(event.message)
    }
  }

  const match = out.match(/\[DIRECTION_JSON_START\]\s*([\s\S]*?)\s*\[DIRECTION_JSON_END\]/)
  if (!match) {
    return null
  }

  try {
    const parsed = JSON.parse(match[1]) as DirectionConfirmationDraft
    if (!parsed.shouldConfirm) {
      return null
    }

    const themes = Array.isArray(parsed.themes)
      ? parsed.themes.map(theme => theme.trim()).filter(Boolean).slice(0, 2)
      : []

    const oneLinePremise = parsed.oneLinePremise.trim()
    const storyPromise = parsed.storyPromise.trim()
    if (!oneLinePremise || !storyPromise || themes.length !== 2) {
      return null
    }

    return {
      shouldConfirm: true,
      oneLinePremise,
      storyPromise,
      themes,
    }
  } catch {
    return null
  }
}
