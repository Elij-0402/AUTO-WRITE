import { describe, it, expect } from 'vitest'
import {
  buildSegmentedSystemPrompt,
  buildWorldBibleBlock,
  flattenSystemPrompt,
  BASE_INSTRUCTION,
} from './prompts'
import type { WorldEntry } from '../types/world-entry'

const sampleCharacter: WorldEntry = {
  id: 'c1',
  projectId: 'p1',
  type: 'character',
  name: '云归',
  personality: '冷静寡言',
  appearance: '白衣长发',
  background: '仙门弃徒',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('buildWorldBibleBlock', () => {
  it('emits placeholder when there are no entries', () => {
    const block = buildWorldBibleBlock([])
    expect(block).toContain('【世界观百科】')
    expect(block).toContain('(暂无相关世界观条目)')
  })

  it('formats entries into the 【世界观百科】 section', () => {
    const block = buildWorldBibleBlock([sampleCharacter])
    expect(block.startsWith('【世界观百科】')).toBe(true)
    expect(block).toContain('云归')
    expect(block).toContain('冷静寡言')
  })
})

describe('buildSegmentedSystemPrompt', () => {
  it('includes base instruction, world bible and runtime context separately', () => {
    const segments = buildSegmentedSystemPrompt({
      worldEntries: [sampleCharacter],
      selectedText: '她转身离去。',
    })

    expect(segments.baseInstruction).toBe(BASE_INSTRUCTION)
    expect(segments.worldBibleContext).toContain('云归')
    expect(segments.runtimeContext).toContain('她转身离去')
    expect(segments.runtimeContext).toContain('【当前讨论】')
  })

  it('omits runtime context when no selected text', () => {
    const segments = buildSegmentedSystemPrompt({ worldEntries: [] })
    expect(segments.runtimeContext).toBe('')
  })
})

describe('flattenSystemPrompt', () => {
  it('joins non-empty segments with blank lines', () => {
    const flat = flattenSystemPrompt({
      baseInstruction: 'A',
      worldBibleContext: 'B',
      runtimeContext: '',
      worldBibleBlocks: [],
      useCitations: false,
      useExtendedCacheTtl: false,
    })
    expect(flat).toBe('A\n\nB')
  })

  it('preserves order: base → world → runtime', () => {
    const flat = flattenSystemPrompt({
      baseInstruction: 'BASE',
      worldBibleContext: 'WORLD',
      runtimeContext: 'RUN',
      worldBibleBlocks: [],
      useCitations: false,
      useExtendedCacheTtl: false,
    })
    expect(flat).toBe('BASE\n\nWORLD\n\nRUN')
  })
})
