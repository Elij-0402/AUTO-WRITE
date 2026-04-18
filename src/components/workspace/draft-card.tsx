'use client'

import { useState } from 'react'
import { Check, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DraftCardProps {
  draftId: string
  content: string
  onInsert: () => void
}

export function DraftCard({ content, onInsert }: DraftCardProps) {
  const [inserted, setInserted] = useState(false)

  const handleInsert = () => {
    onInsert()
    setInserted(true)
  }

  return (
    <div className="relative rounded-[var(--radius-card)] surface-2 film-edge pl-4 pr-3 py-3 animate-fade-up">
      {/* amber left rail — marks as insertable draft */}
      <div
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[hsl(var(--accent-amber))]/70"
      />
      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent-amber))]/85">
        <PenLine className="w-3 h-3" />
        <span>草稿片段</span>
      </div>
      <p className="text-[13px] leading-[1.8] text-foreground/90 whitespace-pre-wrap">
        {content}
      </p>
      <div className="mt-2.5 flex justify-end">
        <Button
          onClick={handleInsert}
          disabled={inserted}
          size="sm"
          variant={inserted ? 'ghost' : 'default'}
        >
          {inserted ? (
            <>
              <Check className="h-3 w-3" />
              已插入
            </>
          ) : (
            '插入到正文'
          )}
        </Button>
      </div>
    </div>
  )
}
