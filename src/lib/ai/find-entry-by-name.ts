import type { WorldEntry } from '../types/world-entry'
import type { EntriesByType } from '../hooks/use-context-injection'

export function findEntryIdByName(
  entriesByType: EntriesByType,
  name: string
): string | null {
  for (const entries of [entriesByType.character, entriesByType.location, entriesByType.rule, entriesByType.timeline]) {
    const found = entries.find((e: WorldEntry) => e.name === name || name.includes(e.name))
    if (found) return found.id
  }
  return null
}
