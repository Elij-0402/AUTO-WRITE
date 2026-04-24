import type { WorldEntry } from '../types/world-entry'

export function formatEntryForContext(entry: WorldEntry): string {
  const prefix =
    entry.type === 'character' ? '【角色】'
      : entry.type === 'location' ? '【地点】'
        : entry.type === 'rule' ? '【规则】'
          : entry.type === 'timeline' ? '【时间线】'
            : `【${entry.type}】`

  const parts: string[] = [`${prefix}${entry.name}`]
  const push = (label: string, value: string | undefined) => {
    const v = value?.trim()
    if (v) parts.push(`${label}: ${v}`)
  }

  if (entry.type === 'character') {
    push('别名', entry.alias)
    push('外貌', entry.appearance)
    push('性格', entry.personality)
    push('背景', entry.background)
  } else if (entry.type === 'location') {
    push('描述', entry.description)
    push('特征', entry.features)
  } else if (entry.type === 'rule') {
    push('内容', entry.content)
    push('适用范围', entry.scope)
  } else if (entry.type === 'timeline') {
    push('时间点', entry.timePoint)
    push('事件', entry.eventDescription)
  }

  const tags = entry.tags?.filter(t => t?.trim()).join(',')
  if (tags) parts.push(`标签: ${tags}`)

  return parts.join('｜')
}

export function formatEntriesForPrompt(entries: WorldEntry[]): string {
  return entries.map(formatEntryForContext).join('\n')
}

export function calculateTokenCount(text: string): number {
  const cleaned = text.replace(/[#*_`~[\]()=]/g, '')

  let chineseChars = 0
  let englishWords = 0
  let currentWord = ''

  for (const char of cleaned) {
    if (/[一-鿿]/.test(char)) {
      if (currentWord.length > 0) {
        englishWords += 1
        currentWord = ''
      }
      chineseChars++
    } else if (/\s/.test(char)) {
      if (currentWord.length > 0) {
        englishWords += 1
        currentWord = ''
      }
    } else {
      currentWord += char
    }
  }

  if (currentWord.length > 0) {
    englishWords += 1
  }

  return Math.ceil(chineseChars * 1.5 + englishWords * 1.3)
}
