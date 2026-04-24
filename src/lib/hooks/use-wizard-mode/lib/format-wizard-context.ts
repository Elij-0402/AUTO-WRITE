import type { WorldEntry } from '../../../types/world-entry'
import { formatEntryForContext } from '../../../ai/formatters'

export function formatWizardContext(entries: WorldEntry[]): string {
  if (entries.length === 0) return ''
  return entries.map(formatEntryForContext).join('\n')
}
