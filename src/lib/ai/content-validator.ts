/**
 * Validates generated content for emptiness and language suitability.
 * Returns an error message string if invalid, null if valid.
 */
export function validateContent(content: string): string | null {
  if (content.trim().length === 0) {
    return '生成结果为空，请调整概述后重试'
  }
  if (!/\p{Script=Han}/u.test(content)) {
    return '检测到内容可能不符合中文写作习惯'
  }
  return null
}
