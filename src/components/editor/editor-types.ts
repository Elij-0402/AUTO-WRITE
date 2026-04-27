/** Editor component props */
export interface EditorProps {
  /** Tiptap/ProseMirror document content - null for empty chapter */
  content: object | null
  /** Callback when content changes */
  onChange: (content: object) => void
  /** Additional CSS classes */
  className?: string
}

/** Editor component handle - exposed methods via ref */
export interface EditorHandle {
  insertText: (text: string, position?: number) => void
  appendText: (text: string) => void
  replaceText: (text: string) => void
  /** Replace the whole document content, e.g. when restoring a revision. */
  setContent: (content: object) => void
}
