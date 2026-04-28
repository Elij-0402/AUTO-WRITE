'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'

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
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] text-muted-foreground hover:bg-[hsl(var(--surface-3))]/50 hover:text-primary transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        新建章节
      </button>
    )
  }

  return (
    <div className="px-3 py-2">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposingRef.current = true }}
        onCompositionEnd={() => { isComposingRef.current = false }}
        onBlur={() => {
          if (!title.trim()) {
            setIsExpanded(false)
          }
        }}
        placeholder="输入章节标题"
        className="h-8 text-[13px]"
        autoFocus
      />
    </div>
  )
}
