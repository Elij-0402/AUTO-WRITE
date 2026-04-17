/**
 * Compact older conversation turns into a rolling summary.
 * Called when a conversation exceeds the sliding-context window so the
 * older content stays semantically available without blowing the token
 * budget (Anthropic harness "compaction" pattern).
 */

import { streamChat, type AIClientConfig, type ProviderStreamMessage } from './client'
import type { SegmentedSystemPrompt } from './prompts'

const SUMMARY_SYSTEM: SegmentedSystemPrompt = {
  baseInstruction:
    '你是对话摘要助手。把作者与写作助手的对话浓缩为 200 字以内的要点列表，保留人物决策、情节走向、世界观约束、未解决问题，去除闲聊。用简体中文，要点之间换行。',
  worldBibleContext: '',
  runtimeContext: '',
}

/**
 * Summarize the given messages in one non-streaming round.
 * Returns the summary text (may be empty on failure — caller decides fallback).
 */
export async function summarizeMessages(
  config: AIClientConfig,
  messages: ProviderStreamMessage[]
): Promise<string> {
  if (messages.length === 0) return ''

  const transcript = messages
    .map(m => `【${m.role === 'user' ? '作者' : '助手'}】${m.content}`)
    .join('\n\n')

  const events = streamChat(config, {
    segmentedSystem: SUMMARY_SYSTEM,
    messages: [{ role: 'user', content: `请对以下对话做要点摘要：\n\n${transcript}` }],
  })

  let out = ''
  for await (const ev of events) {
    if (ev.type === 'text_delta') out += ev.delta
    else if (ev.type === 'error') throw new Error(ev.message)
  }
  return out.trim()
}
