/**
 * Convert Tiptap / ProseMirror JSON to Markdown.
 *
 * Covers the StarterKit node set in use: heading, paragraph, bulletList,
 * orderedList, blockquote, codeBlock, horizontalRule, hardBreak + the bold,
 * italic, strike, code inline marks. Unknown nodes fall back to their text
 * content so nothing silently disappears.
 */

interface PMMark {
  type: string
  attrs?: Record<string, unknown>
}

interface PMNode {
  type: string
  attrs?: Record<string, unknown>
  content?: PMNode[]
  marks?: PMMark[]
  text?: string
}

function escapeInlineText(text: string): string {
  // Escape characters that would be interpreted as Markdown syntax mid-line.
  return text.replace(/([\\`*_{}\[\]<>])/g, '\\$1')
}

function applyMarks(text: string, marks: PMMark[] | undefined): string {
  if (!marks || marks.length === 0) return text
  let out = text
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        out = `**${out}**`
        break
      case 'italic':
        out = `*${out}*`
        break
      case 'strike':
        out = `~~${out}~~`
        break
      case 'code':
        out = `\`${out}\``
        break
      // link not in StarterKit; unknown marks pass through unchanged
    }
  }
  return out
}

function inlineToMarkdown(nodes: PMNode[] | undefined): string {
  if (!nodes) return ''
  let out = ''
  for (const node of nodes) {
    if (node.type === 'text') {
      const hasCode = node.marks?.some(m => m.type === 'code')
      const raw = node.text ?? ''
      const base = hasCode ? raw : escapeInlineText(raw)
      out += applyMarks(base, node.marks)
    } else if (node.type === 'hardBreak') {
      out += '  \n'
    } else {
      // Fall back to text extraction for unknown inline nodes
      out += inlineToMarkdown(node.content)
    }
  }
  return out
}

function blockToMarkdown(node: PMNode, indent: number = 0): string {
  const pad = '  '.repeat(indent)
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(n => blockToMarkdown(n, indent)).join('\n\n')

    case 'paragraph': {
      const text = inlineToMarkdown(node.content)
      return text ? `${pad}${text}` : ''
    }

    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1))
      return `${'#'.repeat(level)} ${inlineToMarkdown(node.content)}`
    }

    case 'blockquote': {
      const inner = (node.content ?? []).map(n => blockToMarkdown(n, indent)).join('\n\n')
      return inner
        .split('\n')
        .map(line => (line ? `> ${line}` : '>'))
        .join('\n')
    }

    case 'codeBlock': {
      const lang = (node.attrs?.language as string | undefined) ?? ''
      const text = (node.content ?? []).map(c => c.text ?? '').join('')
      return `\`\`\`${lang}\n${text}\n\`\`\``
    }

    case 'horizontalRule':
      return '---'

    case 'bulletList':
      return (node.content ?? [])
        .map(item => blockToMarkdown(item, indent))
        .join('\n')

    case 'orderedList': {
      const start = Number(node.attrs?.start) || 1
      return (node.content ?? [])
        .map((item, i) => {
          const marker = `${start + i}.`
          return renderListItem(item, indent, marker)
        })
        .join('\n')
    }

    case 'listItem':
      return renderListItem(node, indent, '-')

    default: {
      if (node.text) return `${pad}${escapeInlineText(node.text)}`
      if (node.content) {
        return (node.content ?? []).map(n => blockToMarkdown(n, indent)).join('\n\n')
      }
      return ''
    }
  }
}

function renderListItem(item: PMNode, indent: number, marker: string): string {
  const pad = '  '.repeat(indent)
  const children = item.content ?? []
  if (children.length === 0) return `${pad}${marker} `

  const [first, ...rest] = children
  const firstText = first.type === 'paragraph' ? inlineToMarkdown(first.content) : blockToMarkdown(first, indent + 1)
  const lines: string[] = [`${pad}${marker} ${firstText}`]
  for (const child of rest) {
    lines.push(blockToMarkdown(child, indent + 1))
  }
  return lines.filter(Boolean).join('\n')
}

/**
 * Entry point. Accepts either a full doc node or its content array.
 */
export function proseMirrorToMarkdown(content: object | null | undefined): string {
  if (!content) return ''
  const node = content as PMNode
  if (node.type === 'doc') return blockToMarkdown(node).trim()
  if (Array.isArray((node as unknown as PMNode[]))) {
    return (node as unknown as PMNode[]).map(n => blockToMarkdown(n)).join('\n\n').trim()
  }
  return blockToMarkdown(node).trim()
}
