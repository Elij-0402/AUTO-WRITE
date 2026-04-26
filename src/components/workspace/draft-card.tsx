'use client'

import { useState } from 'react'
import { Check, PenLine, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createProjectDB } from '@/lib/db/project-db'
import { recordPreferenceMemory } from '@/lib/db/project-charter-queries'

type RejectReason = 'conflict' | 'other'

const REASONS: Array<{ value: RejectReason; label: string }> = [
  { value: 'conflict', label: '不符合设定' },
  { value: 'other', label: '其他' },
]

interface DraftCardProps {
  draftId: string
  /** Plain-text draft body. */
  content: string
  /** Project id — needed to persist T1 adoption telemetry. */
  projectId: string
  /** Id of the assistant message that carries this draft. Used as the
   *  aiUsage row id prefix so we can patch it in place. */
  messageId: string
  onInsert: () => void
}

export function DraftCard({
  content,
  projectId,
  messageId,
  onInsert,
}: DraftCardProps) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  const [rejectOpen, setRejectOpen] = useState(false)

  const handleInsert = async () => {
    onInsert()
    setStatus('accepted')
    // T1 draft adoption telemetry. Patch the existing chat aiUsage row
    // (id pattern = `chat:${messageId}`). editedPctDeadline is set 30 min
    // out so a future background pass can compute revisions diff.
    try {
      const db = createProjectDB(projectId)
      await db.aiUsage.update(`chat:${messageId}`, {
        draftOffered: true,
        draftAccepted: true,
        editedPctDeadline: Date.now() + 30 * 60 * 1000,
      })
    } catch {
      /* telemetry best-effort */
    }
  }

  const handleReject = async (reason: RejectReason, note?: string) => {
    setStatus('rejected')
    setRejectOpen(false)
    try {
      const db = createProjectDB(projectId)
      await db.aiUsage.update(`chat:${messageId}`, {
        draftOffered: true,
        draftAccepted: false,
        draftRejectedReason: reason,
        draftRejectedNote: note?.slice(0, 500) || undefined,
      })
    } catch {
      /* telemetry best-effort */
    }

    try {
      const detail = note?.trim()
      const reasonLabel = reason === 'conflict' ? '不符合设定' : '其他'
      await recordPreferenceMemory(projectId, {
        source: 'draft',
        messageId,
        verdict: 'reject',
        category: 'other',
        note: detail ? `${reasonLabel}：${detail}` : reasonLabel,
      })
    } catch {
      /* preference memory best-effort */
    }
  }

  // Empty-draft guard (CEO-4A): nothing to insert, nothing to show.
  if (!content.trim()) return null

  return (
    <>
      <div className="relative rounded-[var(--radius-card)] surface-2 pl-4 pr-3 py-3 animate-fade-up border border-[hsl(var(--line))]">
        <div
          aria-hidden
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[hsl(var(--accent))]/70"
        />
        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--accent))]/85">
          <PenLine className="w-3 h-3" />
          <span>草稿片段</span>
        </div>
        <p className="text-[13px] leading-[1.8] text-foreground/90 whitespace-pre-wrap">
          {content}
        </p>
        <div className="mt-2.5 flex justify-end gap-1.5">
          <Button
            onClick={() => setRejectOpen(true)}
            disabled={status !== 'pending'}
            size="sm"
            variant="ghost"
            aria-label="不采纳"
          >
            {status === 'rejected' ? (
              <>
                <X className="h-3 w-3" />
                已记录
              </>
            ) : (
              '不采纳'
            )}
          </Button>
          <Button
            onClick={handleInsert}
            disabled={status !== 'pending'}
            size="sm"
            variant={status === 'accepted' ? 'ghost' : 'default'}
          >
            {status === 'accepted' ? (
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

      <RejectReasonDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
      />
    </>
  )
}

interface RejectReasonDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (reason: RejectReason, note?: string) => void
}

function RejectReasonDialog({ open, onClose, onSubmit }: RejectReasonDialogProps) {
  const [reason, setReason] = useState<RejectReason>('conflict')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    onSubmit(reason, note.trim() || undefined)
    setReason('conflict')
    setNote('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">为什么不采纳？</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <fieldset className="space-y-2">
            {REASONS.map(r => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-[13px] cursor-pointer"
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="h-3.5 w-3.5 accent-[hsl(var(--accent))]"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </fieldset>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">
              备注（可选，最多 500 字）
            </Label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 500))}
              placeholder="具体是哪里不对？"
              rows={3}
              className="w-full rounded-md surface-2 border border-[hsl(var(--line))] px-2.5 py-1.5 text-[13px] focus:outline-none focus:border-[hsl(var(--accent))]"
            />
            <div className="text-[10px] text-muted-foreground/70 text-right tabular-nums">
              {note.length} / 500
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              提交
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
