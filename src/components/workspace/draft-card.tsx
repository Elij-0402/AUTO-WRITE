'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="border rounded-md p-3 bg-muted/30">
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      <Button
        onClick={handleInsert}
        disabled={inserted}
        size="sm"
        variant={inserted ? 'ghost' : 'outline'}
        className="mt-2"
      >
        {inserted ? (
          <>
            <Check className="h-3.5 w-3.5" />
            已插入
          </>
        ) : (
          '插入到编辑器'
        )}
      </Button>
    </div>
  )
}
