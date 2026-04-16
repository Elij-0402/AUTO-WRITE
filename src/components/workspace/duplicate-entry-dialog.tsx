'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { WorldEntry, WorldEntryType } from '@/lib/types'

const TYPE_LABELS: Record<WorldEntryType, string> = {
  character: '角色',
  location: '地点',
  rule: '规则',
  timeline: '时间线'
}

export interface DuplicateEntryDialogProps {
  open: boolean
  onClose: () => void
  entryName: string
  existingEntry: WorldEntry
  onLinkExisting: (entry: WorldEntry) => void
  onCreateNew: () => void
}

export function DuplicateEntryDialog({
  open,
  onClose,
  entryName,
  existingEntry,
  onLinkExisting,
  onCreateNew
}: DuplicateEntryDialogProps) {
  const handleLinkExisting = () => {
    onLinkExisting(existingEntry)
    onClose()
  }

  const handleCreateNew = () => {
    onCreateNew()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>发现已存在条目</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            「{entryName}」已存在，请选择：
          </p>
          <Card>
            <CardContent className="p-3 space-y-1">
              <p className="font-medium">{existingEntry.name}</p>
              <p className="text-xs text-muted-foreground">
                类型：{TYPE_LABELS[existingEntry.type]}
              </p>
              {existingEntry.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                  {existingEntry.description}
                </p>
              )}
              {existingEntry.appearance && (
                <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                  {existingEntry.appearance}
                </p>
              )}
              {existingEntry.background && (
                <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                  {existingEntry.background}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCreateNew}>
            创建新条目
          </Button>
          <Button onClick={handleLinkExisting}>
            关联到现有条目
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
