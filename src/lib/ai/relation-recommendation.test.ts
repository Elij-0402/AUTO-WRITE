import { describe, it, expect } from 'vitest'
import { parseRecommendationResult } from './relation-recommendation'

describe('relation-recommendation', () => {
  describe('parseRecommendationResult', () => {
    it('should parse valid JSON response', () => {
      const text = `{
        "recommendations": [
          {
            "targetNode": {
              "name": "赵云",
              "type": "character",
              "isNew": false
            },
            "suggestedRelation": {
              "category": "character_relation",
              "description": "同为蜀国五虎将",
              "confidence": 0.9
            }
          }
        ]
      }`

      const result = parseRecommendationResult(text)

      expect(result.recommendations).toHaveLength(1)
      expect(result.recommendations[0].targetNode.name).toBe('赵云')
      expect(result.recommendations[0].suggestedRelation.confidence).toBe(0.9)
    })

    it('should return empty array for invalid JSON', () => {
      const result = parseRecommendationResult('这不是 JSON')
      expect(result.recommendations).toHaveLength(0)
    })

    it('should extract JSON from text with surrounding content', () => {
      const text = `以下是分析结果：
      {
        "recommendations": [
          {
            "targetNode": {
              "name": "诸葛亮",
              "type": "character",
              "isNew": false
            },
            "suggestedRelation": {
              "category": "character_relation",
              "description": "君臣关系",
              "confidence": 0.85
            }
          }
        ]
      }
      这是完整的分析报告。`

      const result = parseRecommendationResult(text)

      expect(result.recommendations).toHaveLength(1)
      expect(result.recommendations[0].targetNode.name).toBe('诸葛亮')
    })
  })
})
