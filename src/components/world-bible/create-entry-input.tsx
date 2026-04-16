'use client'

import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import type { WorldEntryType } from '@/lib/types'

interface CreateEntryInputProps {
  type: WorldEntryType
  onCreated: () => void
  onCancel: () => void
}

export function CreateEntryInput({ type, onCreated, onCancel }: CreateEntryInputProps) {
  const isComposingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComposingRef.current) return

    if (e.key === 'Enter') {
      onCreated()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="px-3 py-2 border-t">
      <Input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposingRef.current = true }}
        onCompositionEnd={() => { isComposingRef.current = false }}
        onBlur={() => onCancel()}
        placeholder={`输入${type === 'character' ? '角色' : type === 'location' ? '地点' : type === 'rule' ? '规则' : '时间线'}名称，按回车创建`}
        className="h-8 text-sm"
        autoFocus
      />
    </div>
  )
}
