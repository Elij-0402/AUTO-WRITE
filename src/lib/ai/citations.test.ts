import { describe, it, expect } from 'vitest'
import { normalizeCitation, enrichCitation, type AnthropicCitation } from './citations'

describe('citations', () => {
  describe('normalizeCitation', () => {
    it('normalizes a content_block_location citation', () => {
      const raw: AnthropicCitation = {
        type: 'content_block_location',
        cited_text: '李四的眼睛是红色的。',
        document_index: 0,
        document_title: '世界观百科',
        start_block_index: 3,
        end_block_index: 4,
      }
      expect(normalizeCitation(raw)).toEqual({
        documentIndex: 0,
        startBlockIndex: 3,
        endBlockIndex: 4,
        citedText: '李四的眼睛是红色的。',
        documentTitle: '世界观百科',
      })
    })

    it('returns null for non-content-block citation types', () => {
      expect(normalizeCitation({ type: 'page_location', document_index: 0 })).toBeNull()
      expect(normalizeCitation({ type: 'char_location', document_index: 0 })).toBeNull()
    })

    it('returns null when required indexes are missing', () => {
      expect(
        normalizeCitation({
          type: 'content_block_location',
          cited_text: 'foo',
          start_block_index: 0,
        })
      ).toBeNull()
    })

    it('preserves empty cited_text as empty string', () => {
      const result = normalizeCitation({
        type: 'content_block_location',
        document_index: 0,
        start_block_index: 0,
        end_block_index: 1,
      })
      expect(result?.citedText).toBe('')
    })
  })

  describe('enrichCitation', () => {
    const blockMap = new Map([
      [0, { entryId: 'e-lisi', entryName: '李四' }],
      [1, { entryId: 'e-wangcun', entryName: '王村' }],
    ])

    it('attaches entryId and entryName when block matches', () => {
      const citation = {
        documentIndex: 0,
        startBlockIndex: 0,
        endBlockIndex: 1,
        citedText: 'test',
      }
      expect(enrichCitation(citation, blockMap)).toEqual({
        ...citation,
        entryId: 'e-lisi',
        entryName: '李四',
      })
    })

    it('returns citation unchanged when block is not in map', () => {
      const citation = {
        documentIndex: 0,
        startBlockIndex: 99,
        endBlockIndex: 100,
        citedText: 'test',
      }
      expect(enrichCitation(citation, blockMap)).toEqual(citation)
    })
  })
})
