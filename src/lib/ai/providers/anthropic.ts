/**
 * Anthropic provider: streams Claude responses through @anthropic-ai/sdk
 * and normalizes into the provider-agnostic AIEvent stream.
 *
 * World-bible is packed into a `system: [...]` text block with
 * `cache_control: ephemeral`. The `anthropic-beta: extended-cache-ttl-2025-04-11`
 * header is always sent to enable 1-hour cache TTL (vs. the 5-minute default),
 * which materially reduces BYOK token cost in long writing sessions.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AIEvent, AIToolInput } from '../events'
import type { SegmentedSystemPrompt } from '../prompts'
import { ALL_TOOL_SCHEMAS } from '../tools/schemas'
import type { ProviderStreamParams } from './types'

export async function* streamAnthropic(
  params: ProviderStreamParams
): AsyncIterable<AIEvent> {
  const { config, segmentedSystem, messages, signal } = params

  const client = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
    dangerouslyAllowBrowser: true,
  })

  const systemBlocks = buildSystemBlocks(segmentedSystem)
  const anthropicMessages = messages.map(toAnthropicMessage)

  const stream = client.messages.stream(
    {
      model: config.model || 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemBlocks,
      messages: anthropicMessages,
      tools: ALL_TOOL_SCHEMAS.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: JSON.parse(JSON.stringify(t.input_schema)) as Anthropic.Tool['input_schema'],
      })),
    },
    { signal, headers: { 'anthropic-beta': 'extended-cache-ttl-2025-04-11' } }
  )

  // Track in-flight tool_use blocks by index so we can accumulate partial JSON.
  const toolBlocks = new Map<number, { id: string; name: string; jsonBuffer: string }>()

  /** Flush all pending tool blocks as partial events. Used on abort. */
  const flushPendingToolBlocks = (): AIEvent[] => {
    const events: AIEvent[] = []
    for (const block of toolBlocks.values()) {
      events.push({
        type: 'tool_call_partial',
        id: block.id,
        name: block.name,
        input: safeParseJSON(block.jsonBuffer),
        partialJson: block.jsonBuffer,
      })
    }
    toolBlocks.clear()
    return events
  }

  try {
    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = event.content_block
        if (block.type === 'tool_use') {
          toolBlocks.set(event.index, { id: block.id, name: block.name, jsonBuffer: '' })
        }
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta as { type: string; text?: string; partial_json?: string }
        if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          yield { type: 'text_delta', delta: delta.text }
        } else if (delta.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
          const block = toolBlocks.get(event.index)
          if (block) block.jsonBuffer += delta.partial_json
        }
      } else if (event.type === 'content_block_stop') {
        const block = toolBlocks.get(event.index)
        if (block) {
          const input = safeParseJSON(block.jsonBuffer)
          yield { type: 'tool_call', id: block.id, name: block.name, input }
          toolBlocks.delete(event.index)
        }
      } else if (event.type === 'message_delta') {
        if (event.usage) {
          yield {
            type: 'usage',
            outputTokens: event.usage.output_tokens,
          }
        }
      } else if (event.type === 'message_stop') {
        yield { type: 'done' }
      }
    }

    const final = await stream.finalMessage()
    if (final.usage) {
      yield {
        type: 'usage',
        inputTokens: final.usage.input_tokens,
        outputTokens: final.usage.output_tokens,
        cacheReadTokens: final.usage.cache_read_input_tokens ?? undefined,
        cacheWriteTokens: final.usage.cache_creation_input_tokens ?? undefined,
      }
    }
  } catch (err) {
    // On abort, flush any pending tool blocks as partial events so the caller
    // can attempt best-effort handling (e.g., queue for retry).
    if (err instanceof Error && err.name === 'AbortError') {
      for (const event of flushPendingToolBlocks()) {
        yield event
      }
    }
    throw err
  }
}

export function buildSystemBlocks(
  segments: SegmentedSystemPrompt
): Anthropic.TextBlockParam[] {
  const blocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: segments.baseInstruction,
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (segments.projectCharterContext) {
    blocks.push({
      type: 'text',
      text: segments.projectCharterContext,
      cache_control: { type: 'ephemeral' },
    })
  }
  if (segments.worldBibleContext) {
    blocks.push({
      type: 'text',
      text: segments.worldBibleContext,
      cache_control: { type: 'ephemeral' },
    })
  }
  if (segments.runtimeContext) {
    blocks.push({ type: 'text', text: segments.runtimeContext })
  }
  if (segments.chapterDraftContext) {
    blocks.push({ type: 'text', text: segments.chapterDraftContext })
  }
  return blocks
}

function toAnthropicMessage(m: {
  role: 'user' | 'assistant'
  content: string
}): Anthropic.MessageParam {
  return { role: m.role, content: m.content }
}

export function safeParseJSON(raw: string): AIToolInput {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
