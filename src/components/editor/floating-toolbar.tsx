'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'

export interface FloatingToolbarProps {
  onDiscuss: (selectedText: string) => void
  editorRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Floating toolbar that appears when text is selected in the editor.
 * Provides a "讨论" button to send selected text to AI chat for discussion.
 * 
 * Per D-02, D-03:
 * - Toolbar appears when text is selected
 * - Clicking "讨论" fills the chat input with selected text context
 * - User edits then manually sends (not auto-send)
 */
export function FloatingToolbar({ onDiscuss, editorRef }: FloatingToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Small delay to allow selection to complete
    setTimeout(() => {
      const selection = window.getSelection()
      
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setVisible(false)
        return
      }

      const selectedText = selection.toString().trim()
      if (!selectedText) {
        setVisible(false)
        return
      }

      // Check if selection is within editor bounds
      const range = selection.getRangeAt(0)
      const editorElement = editorRef.current
      
      if (!editorElement || !editorElement.contains(range.commonAncestorContainer)) {
        setVisible(false)
        return
      }

      // Calculate position above the selection
      const rect = range.getBoundingClientRect()
      const toolbarHeight = toolbarRef.current?.offsetHeight || 36
      
      // Position above the selection, centered
      const top = rect.top - toolbarHeight - 8 + window.scrollY
      const left = rect.left + (rect.width / 2) - 50 // Approximate toolbar center

      setPosition({
        top: Math.max(8, top), // Ensure not above viewport
        left: Math.max(8, left)
      })
      setVisible(true)
    }, 10)
  }, [editorRef])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Hide toolbar when clicking elsewhere
    if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
      setVisible(false)
    }
  }, [])

  const handleDiscussClick = useCallback(() => {
    const selection = window.getSelection()
    if (selection) {
      const selectedText = selection.toString().trim()
      if (selectedText) {
        onDiscuss(selectedText)
        // Clear selection and hide toolbar
        selection.removeAllRanges()
        setVisible(false)
      }
    }
  }, [onDiscuss])

  // Listen to mouseup events on document to detect text selection
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [handleMouseUp, handleMouseDown])

  if (!visible) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in duration-150"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button
        onClick={handleDiscussClick}
        className="flex items-center gap-1.5 glass-panel shadow-lg rounded-lg px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span>讨论</span>
      </button>
    </div>
  )
}
