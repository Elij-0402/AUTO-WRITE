'use client'

import { useState } from 'react'

interface DraftCardProps {
  draftId: string
  content: string
  onInsert: () => void
}

export function DraftCard({ draftId, content, onInsert }: DraftCardProps) {
  const [inserted, setInserted] = useState(false)

  const handleInsert = () => {
    onInsert()
    setInserted(true)
  }

  return (
    <div className="border rounded-lg p-3 mt-3 bg-stone-50 dark:bg-stone-700">
      <p className="text-sm whitespace-pre-wrap">{content}</p>
      <button
        onClick={handleInsert}
        disabled={inserted}
        className={`mt-2 text-sm px-3 py-1 rounded ${
          inserted 
            ? 'bg-green-100 text-green-700 cursor-default' 
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
      >
        {inserted ? '✓ 已插入' : '插入到编辑器'}
      </button>
    </div>
  )
}
