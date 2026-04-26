import { describe, it, expect } from 'vitest'
import { buildSystemBlocks, safeParseJSON } from './anthropic'

// These tests verify the abort-flush logic in streamAnthropic.
// Full integration tests (with a real HTTP mock) belong in e2e tests.
//
// Here we test the flush logic by verifying that safeParseJSON handles
// partial JSON strings the same way the abort handler depends on.

describe('safeParseJSON (used by abort flush)', () => {
  it('returns empty object for null input', () => {
    expect(safeParseJSON('')).toEqual({})
  })

  it('returns empty object for partial JSON', () => {
    // This is what the abort handler receives: partial JSON like '{"entryType":"character","name":"'
    const result = safeParseJSON('{"entryType":"character","name":"')
    expect(result).toEqual({})
  })

  it('returns empty object for invalid JSON', () => {
    expect(safeParseJSON('not json at all')).toEqual({})
  })

  it('returns parsed object for complete JSON', () => {
    const result = safeParseJSON('{"entryType":"character","name":"云归"}')
    expect(result).toEqual({ entryType: 'character', name: '云归' })
  })
})

describe('buildSystemBlocks', () => {
  it('includes charter context before world, runtime, and draft blocks', () => {
    const blocks = buildSystemBlocks({
      baseInstruction: 'BASE',
      projectCharterContext: '【作品宪章】\nCHARTER',
      worldBibleContext: '【世界观百科】\nWORLD',
      runtimeContext: 'RUN',
      chapterDraftContext: 'DRAFT',
    })

    expect(blocks.map(block => block.text)).toEqual([
      'BASE',
      '【作品宪章】\nCHARTER',
      '【世界观百科】\nWORLD',
      'RUN',
      'DRAFT',
    ])
    expect(blocks[0]?.cache_control).toEqual({ type: 'ephemeral' })
    expect(blocks[1]?.cache_control).toEqual({ type: 'ephemeral' })
    expect(blocks[2]?.cache_control).toEqual({ type: 'ephemeral' })
  })
})
