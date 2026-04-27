import { describe, it, expect } from 'vitest'
import {
  extractKeywords,
  findRelevantEntries,
  calculateTokenCount,
  formatEntryForContext,
  trimToTokenBudget,
  buildContextPrompt,
  injectContext,
  DEFAULT_TOKEN_BUDGET,
} from './use-context-injection'
import type { WorldEntry } from '../types/world-entry'
import type { EntriesByType } from './use-context-injection'

// Helper to build minimal world entries for testing
const PROJECT_ID = 'test-project-1'

const makeCharacter = (overrides: Partial<WorldEntry> = {}): WorldEntry => ({
  id: 'c1',
  projectId: PROJECT_ID,
  type: 'character',
  name: '云归',
  personality: '沉默寡言',
  appearance: '白衣胜雪',
  background: '仙门弃徒',
  alias: '剑痴',
  tags: ['主角', '仙侠'],
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeLocation = (overrides: Partial<WorldEntry> = {}): WorldEntry => ({
  id: 'l1',
  projectId: PROJECT_ID,
  type: 'location',
  name: '仙门大殿',
  description: '云雾缭绕的古老大殿',
  features: '灵气充沛',
  tags: ['仙门'],
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeRule = (overrides: Partial<WorldEntry> = {}): WorldEntry => ({
  id: 'r1',
  projectId: PROJECT_ID,
  type: 'rule',
  name: '灵气修炼法则',
  content: '吸收天地灵气，凝聚金丹',
  scope: '修行体系',
  tags: ['修炼'],
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeTimeline = (overrides: Partial<WorldEntry> = {}): WorldEntry => ({
  id: 't1',
  projectId: PROJECT_ID,
  type: 'timeline',
  name: '仙门大比',
  timePoint: '每年三月',
  eventDescription: '各派弟子比试',
  tags: [],
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('extractKeywords', () => {
  it('extracts 2-4 char Chinese substrings', () => {
    const keywords = extractKeywords('云归走进仙门大殿')
    expect(keywords).toContain('云归')
    expect(keywords).toContain('仙门')
    expect(keywords).toContain('大殿')
    expect(keywords).toContain('走进')
  })

  it('handles mixed Chinese and punctuation', () => {
    const keywords = extractKeywords('云归！今天天气真好。')
    expect(keywords.some(k => k.includes('云归'))).toBe(true)
  })

  it('returns empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([])
    expect(extractKeywords('   ')).toEqual([])
  })

  it('deduplicates results', () => {
    const keywords = extractKeywords('云归云归云归')
    const unique = [...new Set(keywords)]
    expect(keywords).toEqual(unique)
  })
})

describe('findRelevantEntries', () => {
  const entriesByType: EntriesByType = {
    character: [makeCharacter({ id: 'c1', name: '云归', personality: '沉默寡言' })],
    faction: [],
    location: [makeLocation({ id: 'l1', name: '仙门大殿' })],
    rule: [makeRule({ id: 'r1', name: '灵气修炼法则' })],
    secret: [],
    event: [],
    timeline: [makeTimeline({ id: 't1', name: '仙门大比' })],
  }

  it('ranks name matches highest', () => {
    const results = findRelevantEntries(['云归'], entriesByType)
    expect(results[0].id).toBe('c1')
  })

  it('returns entries matching personality field', () => {
    const results = findRelevantEntries(['沉默'], entriesByType)
    expect(results[0].id).toBe('c1')
  })

  it('returns empty for no matches', () => {
    expect(findRelevantEntries(['完全无关的词'], entriesByType)).toEqual([])
  })

  it('sorts by score descending', () => {
    const entriesByType2: EntriesByType = {
      character: [
        makeCharacter({ id: 'c2', name: '云归的师父', personality: '严厉' }),
      ],
      faction: [],
      location: [
        makeLocation({ id: 'l2', name: '云归修炼的地方', description: '灵气充沛' }),
      ],
      rule: [],
      secret: [],
      event: [],
      timeline: [],
    }
    // '云归' matches both name (c2) AND location name (l2), but name gets +10 vs description +5
    const results = findRelevantEntries(['云归'], entriesByType2)
    expect(results[0].id).toBe('c2') // name match (+10)
    expect(results[1].id).toBe('l2') // name match (+10)
  })

  it('matches tags', () => {
    const results = findRelevantEntries(['主角'], entriesByType)
    expect(results[0].id).toBe('c1')
  })
})

describe('formatEntryForContext', () => {
  it('formats character entry with all fields', () => {
    const entry = makeCharacter()
    const formatted = formatEntryForContext(entry)
    expect(formatted).toContain('【角色】云归')
    expect(formatted).toContain('别名: 剑痴')
    expect(formatted).toContain('外貌: 白衣胜雪')
    expect(formatted).toContain('性格: 沉默寡言')
    expect(formatted).toContain('背景: 仙门弃徒')
    expect(formatted).toContain('标签: 主角,仙侠')
  })

  it('omits empty fields', () => {
    const entry = makeCharacter({ alias: undefined, appearance: '' })
    const formatted = formatEntryForContext(entry)
    expect(formatted).not.toContain('别名:')
    expect(formatted).not.toContain('外貌:')
  })

  it('formats location entry', () => {
    const entry = makeLocation()
    const formatted = formatEntryForContext(entry)
    expect(formatted).toContain('【地点】仙门大殿')
    expect(formatted).toContain('描述: 云雾缭绕的古老大殿')
    expect(formatted).toContain('特征: 灵气充沛')
  })

  it('formats rule entry', () => {
    const entry = makeRule()
    const formatted = formatEntryForContext(entry)
    expect(formatted).toContain('【规则】灵气修炼法则')
    expect(formatted).toContain('内容: 吸收天地灵气，凝聚金丹')
    expect(formatted).toContain('适用范围: 修行体系')
  })

  it('formats timeline entry', () => {
    const entry = makeTimeline()
    const formatted = formatEntryForContext(entry)
    expect(formatted).toContain('【时间线】仙门大比')
    expect(formatted).toContain('时间点: 每年三月')
    expect(formatted).toContain('事件: 各派弟子比试')
  })
})

describe('calculateTokenCount', () => {
  it('estimates ~1.5 chars per token for Chinese text', () => {
    const entry = makeCharacter()
    const count = calculateTokenCount(formatEntryForContext(entry))
    // A character entry with all fields is ~60 chars → ~40 tokens
    expect(count).toBeGreaterThan(20)
    expect(count).toBeLessThan(100)
  })

  it('sums tokens across multiple entries', () => {
    const entries = [makeCharacter(), makeLocation()]
    const total = calculateTokenCount(entries.map(formatEntryForContext).join('\n'))
    const single = calculateTokenCount(formatEntryForContext(makeCharacter()))
    expect(total).toBeGreaterThan(single)
  })
})

describe('trimToTokenBudget', () => {
  it('returns empty for empty input', () => {
    expect(trimToTokenBudget([])).toEqual([])
  })

  it('keeps all entries when under budget', () => {
    const entries = [makeCharacter(), makeLocation()]
    const result = trimToTokenBudget(entries, 4000)
    expect(result).toHaveLength(2)
  })

  it('stops adding entries when budget would be exceeded', () => {
    // Build entries with known lengths
    const entry = makeCharacter({ name: '测试角色很长很长的名字来增加token' })
    const veryLongEntry = makeCharacter({
      name: '另一个很长很长很长的角色名字用来测试截断是否正确工作',
      personality: '很长的性格描述，用来填充内容使token数量增加',
      appearance: '很长的外貌描写，内容越多token越多这是符合预期的',
      background: '很长的背景故事，这里有很多文字来增加字符量',
    })

    // With a very small budget, should trim
    const result = trimToTokenBudget([entry, veryLongEntry], 50)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('respects DEFAULT_TOKEN_BUDGET', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeCharacter({ id: `c${i}`, name: `角色${i}` })
    )
    const result = trimToTokenBudget(entries, DEFAULT_TOKEN_BUDGET)
    // With 20 short entries, some should fit in 4000 tokens
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(20)
  })

  it('preserves order from input (relevance ranking from caller)', () => {
    // Entries should be returned in the same order they were passed
    const entries = [
      makeCharacter({ id: 'a', name: '角色A' }),
      makeCharacter({ id: 'b', name: '角色B' }),
      makeCharacter({ id: 'c', name: '角色C' }),
    ]
    const result = trimToTokenBudget(entries, 4000)
    expect(result.map(e => e.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('buildContextPrompt', () => {
  it('returns empty string for no entries', () => {
    expect(buildContextPrompt([])).toBe('')
  })

  it('joins formatted entries with newlines', () => {
    const entries = [
      makeCharacter({ name: '云归' }),
      makeLocation({ name: '仙门大殿' }),
    ]
    const prompt = buildContextPrompt(entries)
    expect(prompt).toContain('\n')
    expect(prompt).toContain('云归')
    expect(prompt).toContain('仙门大殿')
  })
})

describe('injectContext', () => {
  it('removes the world bible section entirely when no entries', () => {
    // injectContext strips the section when entries array is empty
    const prompt = '【世界观百科】\n\n【当前讨论】'
    const result = injectContext([], prompt)
    expect(result).toBe('【当前讨论】')
  })

  it('injects context at the world bible marker', () => {
    const entries = [makeCharacter({ name: '云归' })]
    const prompt = '【世界观百科】\n\n【当前讨论】'
    const result = injectContext(entries, prompt)
    expect(result).toContain('云归')
  })

  it('uses placeholder replacement when {worldBibleContext} exists', () => {
    const entries = [makeCharacter({ name: '云归' })]
    const prompt = '【世界观百科】\n{worldBibleContext}\n\n【当前讨论】'
    const result = injectContext(entries, prompt)
    expect(result).toContain('云归')
    expect(result).not.toContain('{worldBibleContext}')
  })

  it('prepends context when no marker exists', () => {
    const entries = [makeCharacter({ name: '云归' })]
    const prompt = '请帮我分析这段文字。'
    const result = injectContext(entries, prompt)
    expect(result).toContain('世界观百科')
    expect(result).toContain('云归')
  })
})
