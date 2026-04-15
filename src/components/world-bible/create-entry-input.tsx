'use client'

import { useState, useRef } from 'react'
import type { WorldEntryType } from '@/lib/types'

/**
 * CreateEntryInput per D-15: inline entry creation input.
 * Uses IME-safe input pattern from CreateChapterInput.
 * Parent handles the actual creation via useWorldEntries.
 */
interface CreateEntryInputProps {
  type: WorldEntryType
  onCreated: () => void
  onCancel: () => void
}

export function CreateEntryInput({ type, onCreated, onCancel }: CreateEntryInputProps) {
  const isComposingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME safety: don't trigger on Enter during composition
    if (isComposingRef.current) return

    if (e.key === 'Enter') {
      // Submit on Enter - parent will handle creation with default name
      onCreated()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposingRef.current = true }}
        onCompositionEnd={() => { isComposingRef.current = false }}
        onBlur={() => onCancel()}
        placeholder={`输入${type === 'character' ? '角色' : type === 'location' ? '地点' : type === 'rule' ? '规则' : '时间线'}名称，按回车创建`}
        className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-600 dark:text-stone-100 dark:placeholder:text-stone-500"
        autoFocus
      />
    </div>
  )
}
