'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import './editor.css'
import type { EditorProps } from './editor-types'

/**
 * Tiptap rich text editor component with Chinese IME support.
 * 
 * Per EDIT-04 (Chinese IME): Uses @tiptap/pm (ProseMirror) which handles IME 
 * composition correctly without custom input handling.
 * 
 * Layout per D-01, D-02, D-06, D-10:
 * - Centered content area, max-width 640px
 * - Noto Sans SC font via font-sans
 * - 16px font size, 1.75 line height
 * - Full height container, page scrolls
 * 
 * Placeholder per D-03: "开始写作..." in light gray
 * 
 * Content sync strategy:
 * - useChapterEditor only updates content state when chapterId changes
 * - This prevents autosave updates from resetting the editor
 * - Editor tracks prevContentRef to detect genuine chapter switches
 */
export function Editor({ content, onChange, className = '' }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default heading levels we don't need to keep it simple
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: '开始写作...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography, // Smart quotes, dashes, horizontal rules
    ],
    content: content ?? '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none',
      },
    },
  })

  // Track previous content to detect chapter switches
  // Content only changes from hook when chapterId changes
  const prevContentRef = useRef<object | null>(content)

  // Handle content changes
  useEffect(() => {
    if (!editor) return

    const prevContent = prevContentRef.current

    // Case 1: Chapter deselected (content = null)
    if (content === null) {
      if (prevContent !== null) {
        editor.commands.clearContent()
        prevContentRef.current = null
      }
      return
    }

    // Case 2: New chapter selected (prev was null)
    if (prevContent === null) {
      editor.commands.setContent(content)
      prevContentRef.current = content
      return
    }

    // Case 3: Chapter switch (prev and current are both non-null but different)
    // Compare JSON to detect genuine chapter switch vs autosave updates
    const prevJson = JSON.stringify(prevContent)
    const currJson = JSON.stringify(content)
    if (prevJson !== currJson) {
      // Different content - this is a chapter switch
      editor.commands.setContent(content)
      prevContentRef.current = content
    }
    // If JSON is same, it's probably the same content (no action needed)
  }, [editor, content])

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto px-4 py-8">
          <EditorContent
            editor={editor}
            className="min-h-full"
          />
        </div>
      </div>
    </div>
  )
}
