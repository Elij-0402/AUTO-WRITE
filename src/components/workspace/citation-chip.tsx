'use client'

import type { Citation } from '@/lib/ai/citations'

interface CitationChipProps {
  citation: Citation
  index: number
  onClick?: (entryId: string | undefined) => void
}

/**
 * Small pill rendered inline or under a message to indicate a grounded
 * reference. Clicking it asks the parent to navigate to the world-bible entry
 * when the citation carries an entryId.
 */
export function CitationChip({ citation, index, onClick }: CitationChipProps) {
  const label = citation.entryName ?? `#${citation.startBlockIndex}`
  const disabled = !citation.entryId
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick?.(citation.entryId)}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] surface-2 film-edge transition-colors ${
        disabled
          ? 'opacity-60 cursor-default'
          : 'hover:film-edge-active cursor-pointer text-foreground'
      }`}
      title={citation.citedText}
    >
      <span className="tabular-nums text-muted-foreground">[{index + 1}]</span>
      <span className="truncate max-w-[120px]">{label}</span>
    </button>
  )
}
