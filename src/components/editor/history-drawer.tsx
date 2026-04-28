'use client'

import { useState } from 'react'
import { formatDistanceToNow } from './format-distance'
import { useRevisions, type Revision } from '@/lib/hooks/use-revisions'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Clock, RotateCcw, Trash2, Pencil, Check, X } from 'lucide-react'

interface HistoryDrawerProps {
  projectId: string
  chapterId: string | null
  /** Current editor content — used when the user clicks "save as named version". */
  currentContent: object | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestore: (snapshot: object) => void
}

export function HistoryDrawer({
  projectId,
  chapterId,
  currentContent,
  open,
  onOpenChange,
  onRestore,
}: HistoryDrawerProps) {
  const { revisions, snapshot, remove, rename } = useRevisions(projectId, chapterId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftLabel, setDraftLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const handleStartRename = (rev: Revision) => {
    setEditingId(rev.id)
    setDraftLabel(rev.label ?? '')
  }

  const handleConfirmRename = async () => {
    if (editingId) {
      await rename(editingId, draftLabel.trim())
      setEditingId(null)
    }
  }

  const handleManualSnapshot = async () => {
    if (!currentContent) return
    setSaving(true)
    try {
      await snapshot(currentContent, 'manual')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 divider-hair">
          <SheetTitle className="text-[13px] font-medium flex items-center gap-2 uppercase tracking-[0.15em]">
            <Clock className="h-4 w-4 text-primary" />
            版本历史
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {revisions.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-muted-foreground bg-amber-vignette">
              暂无历史版本。每 5 分钟的活跃编辑会自动保存一份快照。
            </div>
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))]">
              {revisions.map(rev => (
                <li key={rev.id} className="px-4 py-3 space-y-2 hover:bg-[hsl(var(--surface-3))]/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {editingId === rev.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={draftLabel}
                            onChange={e => setDraftLabel(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleConfirmRename()
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="flex-1 h-7 rounded-[var(--radius-control)] border border-[hsl(var(--border))] surface-2 px-2 text-[13px] focus:outline-none focus:border-primary/60"
                            placeholder="版本名称"
                          />
                          <Button variant="ghost" size="icon-sm" onClick={handleConfirmRename}>
                            <Check />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)}>
                            <X />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[13px] font-medium truncate">
                          {rev.label || new Date(rev.createdAt).toLocaleString('zh-CN', {
                            month: 'numeric', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                      <div className="text-mono text-[10px] text-muted-foreground/70 mt-1 tabular-nums">
                        {formatDistanceToNow(rev.createdAt)} · {rev.wordCount.toLocaleString()} 字
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        onRestore(rev.snapshot)
                        onOpenChange(false)
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      恢复
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleStartRename(rev)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      命名
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(rev.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="divider-hair px-4 py-3">
          <Button
            variant="subtle"
            size="sm"
            className="w-full"
            onClick={handleManualSnapshot}
            disabled={!currentContent || saving}
          >
            {saving ? '保存中…' : '保存当前为命名版本'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
