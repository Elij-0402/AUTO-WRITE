/** Editor component props */
export interface EditorProps {
  /** Tiptap/ProseMirror document content - null for empty chapter */
  content: object | null
  /** Callback when content changes */
  onChange: (content: object) => void
  /** Additional CSS classes */
  className?: string
}
