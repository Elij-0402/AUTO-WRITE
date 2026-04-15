'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'

/**
 * CreateChapterInput per D-11: inline chapter creation at bottom of sidebar.
 * Per D-16: IME safety — only submit on Enter when NOT composing.
 */
interface CreateChapterInputProps {
  onCreate: (title: string) => Promise<string | void>
}

export function CreateChapterInput({ onCreate }: CreateChapterInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const isComposingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return

    await onCreate(trimmed)
    setTitle('')
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME safety: don't trigger on Enter during composition
    if (isComposingRef.current) return

    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      setTitle('')
      setIsExpanded(false)
    }
  }

  const handleExpand = () => {
    setIsExpanded(true)
    // Focus input after expansion
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
      >
        <Plus className="h-4 w-4" />
        新章节
      </button>
    )
  }

  return (
    <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposingRef.current = true }}
        onCompositionEnd={() => { isComposingRef.current = false }}
        onBlur={() => {
          // Only collapse if no text entered
          if (!title.trim()) {
            setIsExpanded(false)
          }
        }}
        placeholder="输入章节标题"
        className="w-full rounded-lg border border-dashed border-blue-300 bg-blue-50/50 px-3 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 dark:border-blue-500/30 dark:bg-blue-500/5 dark:text-stone-100 dark:placeholder:text-stone-500"
        autoFocus
      />
    </div>
  )
}