/**
 * Citation primitives for Phase C — per deep-interview spec AC-1.
 *
 * When experimentFlags.citations is on, the Anthropic provider sends the
 * world bible as a Custom Content document (one block per WorldEntry) with
 * `citations: { enabled: true }`. Claude returns citation ranges pointing back
 * to blocks; InkForge re-hydrates them into a form the UI can render.
 */

export interface Citation {
  /** Index within the document array in the request. Always 0 for InkForge (single world-bible document). */
  documentIndex: number
  /** Start block index (inclusive) within the Custom Content document. Maps to one WorldEntry. */
  startBlockIndex: number
  /** End block index (exclusive). */
  endBlockIndex: number
  /** Excerpt of the cited text. Does not count toward output tokens per Anthropic docs. */
  citedText: string
  /** Optional document title — for InkForge: "世界观百科". */
  documentTitle?: string
  /** InkForge-specific: entryId looked up from the block index at parse time, for click-to-navigate UX. */
  entryId?: string
  /** InkForge-specific: entry display name cached at parse time, for chip label. */
  entryName?: string
}

export interface AnthropicCitation {
  type: string
  cited_text?: string
  document_index?: number
  document_title?: string
  start_block_index?: number
  end_block_index?: number
  start_char_index?: number
  end_char_index?: number
  start_page_number?: number
  end_page_number?: number
}

/**
 * Normalize an Anthropic citation object to the InkForge Citation shape.
 * Returns null for citation types we don't emit (e.g. page_location — we use
 * Custom Content documents exclusively, so only content_block_location is expected).
 */
export function normalizeCitation(raw: AnthropicCitation): Citation | null {
  if (raw.type !== 'content_block_location') return null
  if (
    raw.document_index === undefined ||
    raw.start_block_index === undefined ||
    raw.end_block_index === undefined
  ) {
    return null
  }
  return {
    documentIndex: raw.document_index,
    startBlockIndex: raw.start_block_index,
    endBlockIndex: raw.end_block_index,
    citedText: raw.cited_text ?? '',
    documentTitle: raw.document_title,
  }
}

/**
 * Attach entryId + entryName to a citation using the block-index → entry map
 * that was recorded when the document was constructed. Callers maintain this
 * map as `blockIndex → { entryId, entryName }` at request-build time.
 */
export function enrichCitation(
  citation: Citation,
  blockMap: ReadonlyMap<number, { entryId: string; entryName: string }>
): Citation {
  const meta = blockMap.get(citation.startBlockIndex)
  if (!meta) return citation
  return { ...citation, entryId: meta.entryId, entryName: meta.entryName }
}
