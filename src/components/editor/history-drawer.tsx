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
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            版本历史
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {revisions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              暂无历史版本。每 5 分钟的活跃编辑会自动保存一份快照。
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {revisions.map(rev => (
                <li key={rev.id} className="px-4 py-3 space-y-2">
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
                            className="flex-1 h-7 px-2 border rounded text-sm"
                            placeholder="版本名称"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleConfirmRename}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {rev.label || defaultLabel(rev)}
                          </span>
                          <SourceBadge source={rev.source} />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(rev.createdAt)} · {rev.wordCount.toLocaleString()} 字
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        onRestore(rev.snapshot)
                        onOpenChange(false)
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      恢复
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleStartRename(rev)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      命名
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
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

        <div className="border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleManualSnapshot}
            disabled={!currentContent || saving}
          >
            {saving ? '保存中...' : '保存当前为命名版本'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function defaultLabel(rev: Revision): string {
  if (rev.source === 'manual') return '手动快照'
  if (rev.source === 'ai-draft') return 'AI 草稿'
  return '自动快照'
}

function SourceBadge({ source }: { source: Revision['source'] }) {
  const cls = 'text-[10px] px-1.5 py-0.5 rounded-sm border'
  if (source === 'manual') return <span className={`${cls} border-primary/30 text-primary`}>手动</span>
  if (source === 'ai-draft') return <span className={`${cls} border-amber-500/30 text-amber-600`}>AI</span>
  return <span className={`${cls} border-muted-foreground/30 text-muted-foreground`}>自动</span>
}
