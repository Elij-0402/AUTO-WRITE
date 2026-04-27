'use client'

import { useEffect, useRef } from 'react'
import { forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { EditorToolbar } from './editor-toolbar'
import './editor.css'
import type { EditorProps, EditorHandle } from './editor-types'

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
 * 
 * Draft insertion per D-07:
 * - Editor exposes insertText method via ref for draft insertion at cursor position
 */
export const Editor = forwardRef<EditorHandle, EditorProps>(({ content, onChange, className = '' }, ref) => {
  const prevContentRef = useRef<object | null>(content)

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
    immediatelyRender: false,
    content: content ?? '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone dark:prose-invert max-w-none focus:outline-none',
      },
    },
  })

  // Expose insertText method via ref for draft insertion
  useImperativeHandle(ref, () => ({
    insertText: (text: string, position?: number) => {
      if (!editor) return
      editor.commands.insertContentAt(position ?? editor.state.selection.head, text)
    },
    appendText: (text: string) => {
      if (!editor) return
      const currentText = editor.getText().trim()
      const contentToInsert = currentText ? `\n\n${text}` : text
      editor.chain().focus('end').insertContent(contentToInsert).run()
    },
    replaceText: (text: string) => {
      if (!editor) return
      editor.commands.clearContent()
      editor.commands.insertContent(text)
    },
    setContent: (nextContent: object) => {
      if (!editor) return
      editor.commands.setContent(nextContent)
      prevContentRef.current = nextContent
    }
  }), [editor])

  // Track previous content to detect chapter switches
  // Content only changes from hook when chapterId changes

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
      {editor && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto px-10 py-7">
          <EditorContent
            editor={editor}
            className="min-h-full"
          />
        </div>
      </div>
    </div>
  )
})

Editor.displayName = 'Editor'
