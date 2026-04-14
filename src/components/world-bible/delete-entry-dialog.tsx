'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * DeleteEntryDialog per D-17: confirmation dialog with relationship count.
 * Shows warning message when entry has relations.
 */
interface DeleteEntryDialogProps {
  entryName: string
  relationCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteEntryDialog({
  entryName,
  relationCount,
  onConfirm,
  onCancel,
}: DeleteEntryDialogProps) {
  const message = relationCount > 0
    ? `此条目有 ${relationCount} 个关联关系，删除后关联将一并移除。确定删除？`
    : `确定要删除「${entryName}」吗？`

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除确认</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
