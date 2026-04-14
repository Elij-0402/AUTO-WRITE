'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * TagInput per D-06: free tag system with autocomplete from existing tags.
 * Used in world entry edit form.
 */
interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  allTags: string[]
}

export function TagInput({ tags, onTagsChange, allTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const isComposingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter existing tags by input for autocomplete
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(inputValue.toLowerCase()) &&
    !tags.includes(tag)
  )

  // Check if exact tag exists (for showing "create new" option)
  const exactMatch = allTags.find(t => t.toLowerCase() === inputValue.toLowerCase())
  const showCreateOption = inputValue.trim() && !exactMatch && filteredTags.length === 0

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
    }
    setInputValue('')
    setShowDropdown(false)
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComposingRef.current) return

    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Current tags as pills */}
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { isComposingRef.current = true }}
          onCompositionEnd={() => { isComposingRef.current = false }}
          placeholder="添加标签..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (filteredTags.length > 0 || showCreateOption) && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
          {filteredTags.map(tag => (
            <button
              key={tag}
              type="button"
              className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => addTag(tag)}
            >
              {tag}
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              className="w-full px-3 py-1.5 text-left text-sm text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => addTag(inputValue)}
            >
              + 创建 &quot;{inputValue}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
