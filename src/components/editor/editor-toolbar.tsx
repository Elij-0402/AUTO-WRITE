'use client'

import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor
}

/**
 * Format toolbar per D-20 to D-27:
 * - Fixed at top of editor content area, always visible
 * - Minimalist, low-distraction design
 * - Three buttons: Bold, Italic, Heading (cycles through H1/H2/H3)
 * - Background matches editor background
 * - Bottom border divider line
 * 
 * Heading behavior per D-45:
 * - Click cycles: paragraph → H1 → H2 → H3 → paragraph
 */
export function EditorToolbar({ editor }: EditorToolbarProps) {
  // Get current heading level
  const getHeadingLevel = (): number => {
    if (editor.isActive('heading', { level: 1 })) return 1
    if (editor.isActive('heading', { level: 2 })) return 2
    if (editor.isActive('heading', { level: 3 })) return 3
    return 0
  }

  const headingLevel = getHeadingLevel()

  // Cycle heading: none → 1 → 2 → 3 → none
  const cycleHeading = useCallback(() => {
    if (headingLevel === 0) {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    } else if (headingLevel === 1) {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    } else if (headingLevel === 2) {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    } else {
      editor.chain().focus().setParagraph().run()
    }
  }, [editor, headingLevel])

  return (
    <div className="editor-toolbar flex items-center gap-1 border-b border-border-subtle px-4 py-2 bg-surface-0 sticky top-0 z-10">
      {/* Bold button per D-21 */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg bg-surface-1 hover:bg-surface-hover transition-colors ${
          editor.isActive('bold') ? 'bg-primary-muted text-primary' : ''
        }`}
        title="加粗 (Ctrl+B)"
      >
        <span className="font-bold text-base">B</span>
      </button>

      {/* Italic button per D-21 */}
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg bg-surface-1 hover:bg-surface-hover transition-colors ${
          editor.isActive('italic') ? 'bg-primary-muted text-primary' : ''
        }`}
        title="斜体 (Ctrl+I)"
      >
        <span className="italic text-base">I</span>
      </button>

      {/* Heading button per D-21, D-25, D-45 */}
      <button
        onClick={cycleHeading}
        className={`p-2 rounded-lg bg-surface-1 hover:bg-surface-hover transition-colors min-w-[2.5rem] ${
          headingLevel > 0 ? 'bg-primary-muted text-primary' : ''
        }`}
        title="标题 (点击循环切换)"
      >
        <span className={`text-base ${headingLevel > 0 ? 'font-bold' : ''}`}>
          {headingLevel === 0 ? 'H' : `H${headingLevel}`}
        </span>
      </button>
    </div>
  )
}
