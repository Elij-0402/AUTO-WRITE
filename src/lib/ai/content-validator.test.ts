import { describe, it, expect } from 'vitest'
import { validateContent } from './content-validator'

describe('validateContent', () => {
  it('returns null for valid Chinese content', () => {
    const result = validateContent('这是一个正常的段落内容。')
    expect(result).toBeNull()
  })

  it('returns error message for empty content', () => {
    const result = validateContent('   \n\n\t  ')
    expect(result).toBe('生成结果为空，请调整概述后重试')
  })

  it('returns error message for non-Chinese content', () => {
    const result = validateContent('This is just English text with no Chinese characters at all.')
    expect(result).toBe('检测到内容可能不符合中文写作习惯')
  })

  it('returns null for mixed Chinese/English content', () => {
    const result = validateContent('这是一个段落，包含一些English混合。')
    expect(result).toBeNull()
  })
})
