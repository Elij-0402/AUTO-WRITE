/**
 * Anthropic provider: streams Claude responses through @anthropic-ai/sdk
 * and normalizes into the provider-agnostic AIEvent stream.
 *
 * Two code paths controlled by segmentedSystem.useCitations (Phase C flag):
 *
 *   Legacy path (useCitations=false): world-bible is a text block in
 *   `system: [...]` with `cache_control: ephemeral`, same as pre-Phase-C.
 *
 *   Citations path (useCitations=true): world-bible is a Custom Content
 *   document inserted into the LAST user message's content array with
 *   `citations: { enabled: true }` and `cache_control: ephemeral`. Each
 *   WorldEntry becomes one content block, enabling grounded citations.
 *   Stream `citations_delta` events are normalized into AICitationEvent.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AIEvent, AIToolInput } from '../events'
import type { SegmentedSystemPrompt, WorldBibleBlock } from '../prompts'
import { ALL_TOOL_SCHEMAS } from '../tools/schemas'
import { normalizeCitation, enrichCitation, type AnthropicCitation } from '../citations'
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
  const anthropicMessages = buildAnthropicMessages(messages, segmentedSystem)
  const blockMap = buildBlockMap(segmentedSystem.worldBibleBlocks)

  // Phase D: when experimentFlags.extendedCacheTtl is on, opt in to the
  // 1-hour TTL beta via request header. Keeps 5-min default otherwise.
  const extraHeaders = segmentedSystem.useExtendedCacheTtl
    ? { 'anthropic-beta': 'extended-cache-ttl-2025-04-11' }
    : undefined

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
    { signal, headers: extraHeaders }
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
        const delta = event.delta as { type: string; text?: string; partial_json?: string; citation?: AnthropicCitation }
        if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          yield { type: 'text_delta', delta: delta.text }
        } else if (delta.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
          const block = toolBlocks.get(event.index)
          if (block) block.jsonBuffer += delta.partial_json
        } else if (delta.type === 'citations_delta' && delta.citation) {
          const normalized = normalizeCitation(delta.citation)
          if (normalized) {
            yield { type: 'citation', citation: enrichCitation(normalized, blockMap), blockIndex: event.index }
          }
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

function buildSystemBlocks(
  segments: SegmentedSystemPrompt
): Anthropic.TextBlockParam[] {
  const blocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: segments.baseInstruction,
      cache_control: { type: 'ephemeral' },
    },
  ]
  // When using citations, worldBibleContext is empty and the bible lives in the
  // last user message as a document block. Legacy path keeps the text block here.
  if (!segments.useCitations && segments.worldBibleContext) {
    blocks.push({
      type: 'text',
      text: segments.worldBibleContext,
      cache_control: { type: 'ephemeral' },
    })
  }
  if (segments.runtimeContext) {
    blocks.push({ type: 'text', text: segments.runtimeContext })
  }
  return blocks
}

function buildAnthropicMessages(
  messages: { role: 'user' | 'assistant'; content: string }[],
  segments: SegmentedSystemPrompt
): Anthropic.MessageParam[] {
  const base = messages.map(toAnthropicMessage)
  if (!segments.useCitations || segments.worldBibleBlocks.length === 0) {
    return base
  }

  // Inject world-bible as a Custom Content document into the LAST user message.
  let lastUserIdx = -1
  for (let i = base.length - 1; i >= 0; i--) {
    if (base[i].role === 'user') {
      lastUserIdx = i
      break
    }
  }
  if (lastUserIdx < 0) return base

  const lastUser = base[lastUserIdx]
  const userText = typeof lastUser.content === 'string' ? lastUser.content : ''

  const documentBlock: Anthropic.DocumentBlockParam = {
    type: 'document',
    source: {
      type: 'content',
      content: segments.worldBibleBlocks.map(b => ({
        type: 'text' as const,
        text: b.text,
      })),
    },
    title: '世界观百科',
    citations: { enabled: true },
    cache_control: { type: 'ephemeral' },
  }

  const rebuilt: Anthropic.MessageParam = {
    role: 'user',
    content: [documentBlock, { type: 'text', text: userText }],
  }

  return [...base.slice(0, lastUserIdx), rebuilt, ...base.slice(lastUserIdx + 1)]
}

function buildBlockMap(
  blocks: WorldBibleBlock[]
): Map<number, { entryId: string; entryName: string }> {
  const map = new Map<number, { entryId: string; entryName: string }>()
  blocks.forEach((b, idx) => map.set(idx, { entryId: b.entryId, entryName: b.entryName }))
  return map
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
