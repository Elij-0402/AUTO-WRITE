import { describe, it, expect } from 'vitest'
import { reciprocalRankFusion } from './hybrid-search'

describe('reciprocalRankFusion', () => {
  it('merges two lists and prefers items ranked highly in both', () => {
    const list1 = [
      { id: 'A', score: 0.9 },
      { id: 'B', score: 0.7 },
      { id: 'C', score: 0.4 },
    ]
    const list2 = [
      { id: 'A', score: 1.0 },
      { id: 'C', score: 0.9 },
      { id: 'D', score: 0.3 },
    ]
    const merged = reciprocalRankFusion({ lists: [list1, list2] })
    const ids = merged.map(m => m.id)
    // A appears #1 in both — should rank first overall
    expect(ids[0]).toBe('A')
    // B appears only in list1, D only in list2 — should rank below A and C
    expect(ids).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']))
    expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('B'))
  })

  it('respects topK', () => {
    const list = [
      { id: 'A', score: 1 },
      { id: 'B', score: 1 },
      { id: 'C', score: 1 },
    ]
    const merged = reciprocalRankFusion({ lists: [list], topK: 2 })
    expect(merged).toHaveLength(2)
  })

  it('honors per-list weights', () => {
    const semantic = [{ id: 'SEM', score: 1 }]
    const keyword = [{ id: 'KEY', score: 1 }]
    const semanticFirst = reciprocalRankFusion({
      lists: [semantic, keyword],
      weights: [10, 1],
    })
    expect(semanticFirst[0].id).toBe('SEM')

    const keywordFirst = reciprocalRankFusion({
      lists: [semantic, keyword],
      weights: [1, 10],
    })
    expect(keywordFirst[0].id).toBe('KEY')
  })

  it('returns empty array for empty input', () => {
    expect(reciprocalRankFusion({ lists: [] })).toEqual([])
  })
})
