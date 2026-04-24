import type { WorldEntry } from '../types/world-entry'
import type { EntriesByType } from '../hooks/use-context-injection'

// Helper to check if a character is Chinese (CJK Unified Ideographs)
const isChineseChar = (char: string): boolean => {
  const code = char.charCodeAt(0)
  return code >= 0x4e00 && code <= 0x9fff
}

export function findEntryIdByName(
  entriesByType: EntriesByType,
  name: string
): string | null {
  for (const entries of [entriesByType.character, entriesByType.location, entriesByType.rule, entriesByType.timeline]) {
    const found = entries.find((e: WorldEntry) => {
      if (e.name === name) return true
      // Exact start match: ensure followed by non-Chinese or end of string
      // This prevents "王小" matching "王二小" (where "二" follows)
      if (name.startsWith(e.name)) {
        const nextChar = name[e.name.length]
        if (!nextChar || !isChineseChar(nextChar)) return true
      }
      // End match: ensure preceded by non-Chinese or start of string
      if (name.endsWith(e.name)) {
        const beforeChar = name[name.length - e.name.length - 1]
        if (!beforeChar || !isChineseChar(beforeChar)) return true
      }
      return false
    })
    if (found) return found.id
  }
  return null
}
