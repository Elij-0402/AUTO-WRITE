import { describe, it, expect } from 'vitest'
import { contentHash, extractPlainText } from './content-hash'

describe('contentHash', () => {
  it('is deterministic', () => {
    expect(contentHash(['abc', 'def'])).toBe(contentHash(['abc', 'def']))
  })

  it('differs for different inputs', () => {
    expect(contentHash(['abc'])).not.toBe(contentHash(['abd']))
  })

  it('is order-sensitive across strings', () => {
    // Concatenation order matters because hash state flows through.
    expect(contentHash(['第一章', '第二章'])).not.toBe(
      contentHash(['第二章', '第一章'])
    )
  })
})

describe('extractPlainText', () => {
  it('extracts text from Tiptap doc', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '第一段' },
            { type: 'text', text: '继续' },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '第二段' }],
        },
      ],
    }
    const text = extractPlainText(doc)
    expect(text).toContain('第一段')
    expect(text).toContain('第二段')
  })

  it('handles empty doc', () => {
    expect(extractPlainText({ type: 'doc', content: [] })).toBe('')
  })

  it('tolerates non-object input', () => {
    expect(extractPlainText(null)).toBe('')
    expect(extractPlainText(undefined)).toBe('')
  })
})
