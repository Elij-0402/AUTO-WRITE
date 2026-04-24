import type { WorldEntry, EntriesByType } from '../types'

export function findEntryIdByName(
  entriesByType: EntriesByType,
  name: string
): string | null {
  for (const [, entries] of Object.entries(entriesByType)) {
    const found = entries.find(e => e.name === name || name.includes(e.name))
    if (found) return found.id
  }
  return null
}
