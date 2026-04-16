/**
 * Deterministic content hash for analysis cache invalidation. FNV-1a 64-bit
 * over the concatenated chapter texts — we don't need cryptographic strength,
 * just stability across sessions.
 */
export function contentHash(texts: ReadonlyArray<string>): string {
  let h1 = 0xcbf29ce4
  let h2 = 0x84222325
  for (const t of texts) {
    for (let i = 0; i < t.length; i++) {
      const c = t.charCodeAt(i)
      h1 ^= c
      h1 = Math.imul(h1, 0x01000193)
      h2 ^= c
      h2 = Math.imul(h2, 0x01000193)
    }
  }
  return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)
}

/**
 * Extract plain text from a Tiptap ProseMirror JSON document.
 * Walks content arrays and concatenates text nodes with paragraph breaks.
 */
export function extractPlainText(doc: unknown): string {
  const parts: string[] = []
  walk(doc, parts)
  return parts.join('\n').trim()
}

function walk(node: unknown, out: string[]): void {
  if (!node || typeof node !== 'object') return
  const n = node as { type?: string; text?: string; content?: unknown[] }
  if (n.type === 'text' && typeof n.text === 'string') {
    out.push(n.text)
    return
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) walk(child, out)
    if (n.type === 'paragraph' || n.type === 'heading') out.push('\n')
  }
}
