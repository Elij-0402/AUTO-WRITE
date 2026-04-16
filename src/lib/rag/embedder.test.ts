import { describe, it, expect } from 'vitest'
import {
  HashGramEmbedder,
  cosineSimilarity,
  stableHash,
  DEFAULT_DIM,
} from './embedder'

describe('HashGramEmbedder', () => {
  const embedder = new HashGramEmbedder()

  it('produces vectors of the configured dimension', async () => {
    const [vec] = await embedder.embed(['hello'])
    expect(vec.length).toBe(DEFAULT_DIM)
  })

  it('produces L2-normalized vectors (cosine ≈ self-dot = 1)', async () => {
    const [vec] = await embedder.embed(['角色云归是仙门弃徒'])
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5)
  })

  it('rates similar Chinese strings higher than unrelated ones', async () => {
    const [a, b, c] = await embedder.embed([
      '云归走进仙门大殿',
      '云归在仙门大殿与师父对话',
      '今天天气真好，适合散步',
    ])
    const simAB = cosineSimilarity(a, b)
    const simAC = cosineSimilarity(a, c)
    expect(simAB).toBeGreaterThan(simAC)
  })

  it('handles empty string without NaN', async () => {
    const [vec] = await embedder.embed([''])
    for (let i = 0; i < vec.length; i++) {
      expect(Number.isFinite(vec[i])).toBe(true)
    }
  })

  it('is deterministic across calls with same input', async () => {
    const [v1] = await embedder.embed(['测试'])
    const [v2] = await embedder.embed(['测试'])
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1, 5)
  })
})

describe('stableHash', () => {
  it('is deterministic', () => {
    expect(stableHash('hello')).toBe(stableHash('hello'))
  })
  it('differs for different inputs', () => {
    expect(stableHash('a')).not.toBe(stableHash('b'))
  })
})
