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

interface DeleteChapterDialogProps {
  chapterTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteChapterDialog({
  chapterTitle,
  onConfirm,
  onCancel,
}: DeleteChapterDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确定要删除「{chapterTitle}」吗？</DialogTitle>
          <DialogDescription>
            删除后可在回收站中恢复
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
