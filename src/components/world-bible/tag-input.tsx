'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'

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

  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(inputValue.toLowerCase()) &&
    !tags.includes(tag)
  )

  const exactMatch = allTags.find(t => t.toLowerCase() === inputValue.toLowerCase())
  const showCreateOption = inputValue.trim() && !exactMatch && filteredTags.length === 0

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
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="chip gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="transition-colors hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
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
          className="h-8 text-sm"
        />
      </div>

      {showDropdown && (filteredTags.length > 0 || showCreateOption) && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10 surface-1 film-edge rounded-[var(--radius-card)] elev-md py-1 max-h-48 overflow-y-auto">
          {filteredTags.map(tag => (
            <button
              key={tag}
              type="button"
              className="w-full px-3 py-1.5 text-left text-[13px] hover:bg-[hsl(var(--surface-3))]"
              onClick={() => addTag(tag)}
            >
              {tag}
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              className="w-full px-3 py-1.5 text-left text-[13px] text-primary hover:bg-[hsl(var(--surface-3))]"
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
