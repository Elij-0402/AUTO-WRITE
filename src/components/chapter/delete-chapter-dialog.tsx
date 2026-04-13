'use client'

import { useState } from 'react'
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
 * DeleteChapterDialog per D-15: confirmation dialog for soft delete.
 * All text in Simplified Chinese.
 */
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