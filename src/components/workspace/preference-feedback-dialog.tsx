'use client'

import { useEffect, useState } from 'react'
import type { PreferenceMemoryCategory } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const CATEGORY_OPTIONS: Array<{
  value: PreferenceMemoryCategory
  label: string
}> = [
  { value: 'voice', label: '文风不对味' },
  { value: 'character', label: '人物不对味' },
  { value: 'plot', label: '情节不对味' },
  { value: 'worldbuilding', label: '设定不对味' },
  { value: 'other', label: '其他偏差' },
]

interface PreferenceFeedbackDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: {
    category: PreferenceMemoryCategory
    note: string
  }) => Promise<void> | void
}

export function PreferenceFeedbackDialog({
  open,
  onClose,
  onSubmit,
}: PreferenceFeedbackDialogProps) {
  const [category, setCategory] = useState<PreferenceMemoryCategory>('voice')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setCategory('voice')
      setNote('')
      setSubmitting(false)
    }
  }, [open])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        category,
        note: note.trim(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !submitting) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">记录这次偏差</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-[11px] text-muted-foreground">
              哪一类最不对味
            </legend>
            {CATEGORY_OPTIONS.map(option => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-[13px] text-foreground cursor-pointer"
              >
                <input
                  type="radio"
                  name="preference-feedback-category"
                  value={option.value}
                  checked={category === option.value}
                  onChange={() => setCategory(option.value)}
                  className="h-3.5 w-3.5 accent-[hsl(var(--accent))]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="preference-feedback-note" className="text-[11px] text-muted-foreground">
              具体偏差
            </Label>
            <textarea
              id="preference-feedback-note"
              aria-label="具体偏差"
              value={note}
              onChange={event => setNote(event.target.value.slice(0, 500))}
              placeholder="例如：主角说话太轻浮"
              rows={4}
              className="w-full rounded-md border border-[hsl(var(--line))] bg-[hsl(var(--surface-2))] px-3 py-2 text-[13px] leading-[1.7] text-foreground focus:border-[hsl(var(--accent))] focus:outline-none"
            />
            <div className="text-right text-[10px] text-muted-foreground">
              {note.length} / 500
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button size="sm" onClick={() => void handleSubmit()} disabled={submitting}>
            记录偏差
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
