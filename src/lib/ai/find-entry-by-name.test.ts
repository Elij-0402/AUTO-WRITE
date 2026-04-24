import { describe, it, expect } from 'vitest'
import { findEntryIdByName } from './find-entry-by-name'
import type { EntriesByType } from '../hooks/use-context-injection'
import type { WorldEntry } from '../types/world-entry'

describe('findEntryIdByName', () => {
  const mockEntry = (name: string, type: string = 'character'): WorldEntry =>
    ({ id: `id-${name}`, name, type: type as WorldEntry['type'], createdAt: Date.now(), updatedAt: Date.now() })

  const mockEntriesByType = (entries: WorldEntry[]): EntriesByType => ({
    character: entries.filter(e => e.type === 'character'),
    location: entries.filter(e => e.type === 'location'),
    rule: entries.filter(e => e.type === 'rule'),
    timeline: entries.filter(e => e.type === 'timeline'),
  })

  it('should return exact match', () => {
    const entries = [mockEntry('王二小')]
    const entriesByType = mockEntriesByType(entries)
    expect(findEntryIdByName(entriesByType, '王二小')).toBe('id-王二小')
  })

  it('should not match partial name - 王二小 should not match 王小', () => {
    const entries = [mockEntry('王小')]
    const entriesByType = mockEntriesByType(entries)
    expect(findEntryIdByName(entriesByType, '王二小')).toBe(null)
  })

  it('should not match when entry name is substring - 王小 should not match 王二小', () => {
    const entries = [mockEntry('王小')]
    const entriesByType = mockEntriesByType(entries)
    expect(findEntryIdByName(entriesByType, '王二小')).toBe(null)
  })

  it('should match entry name at string boundaries with non-Chinese', () => {
    const entries = [mockEntry('王小')]
    const entriesByType = mockEntriesByType(entries)
    // Exact match
    expect(findEntryIdByName(entriesByType, '王小')).toBe('id-王小')
    // Entry at start followed by punctuation - should match
    expect(findEntryIdByName(entriesByType, '王小。')).toBe('id-王小')
    // Entry at start followed by space and text - should match
    expect(findEntryIdByName(entriesByType, '王小 是一个好人')).toBe('id-王小')
    // Entry at end preceded by punctuation - should match
    expect(findEntryIdByName(entriesByType, '。王小')).toBe('id-王小')
  })

  it('should return null when no match found', () => {
    const entries = [mockEntry('张三')]
    const entriesByType = mockEntriesByType(entries)
    expect(findEntryIdByName(entriesByType, '李四')).toBe(null)
  })

  it('should search across all entry types', () => {
    const entries = [
      mockEntry('王二小', 'character'),
      mockEntry('长安城', 'location'),
      mockEntry('魔法规则', 'rule'),
      mockEntry('第一纪元', 'timeline'),
    ]
    const entriesByType = mockEntriesByType(entries)
    expect(findEntryIdByName(entriesByType, '长安城')).toBe('id-长安城')
    expect(findEntryIdByName(entriesByType, '魔法规则')).toBe('id-魔法规则')
    expect(findEntryIdByName(entriesByType, '第一纪元')).toBe('id-第一纪元')
  })

  it('should handle special regex characters in names', () => {
    const entries = [mockEntry('王小(别名)')]
    const entriesByType = mockEntriesByType(entries)
    expect(findEntryIdByName(entriesByType, '王小(别名)')).toBe('id-王小(别名)')
  })
})