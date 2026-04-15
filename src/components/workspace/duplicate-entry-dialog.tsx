'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

/**
 * Dialog for handling duplicate entry name conflicts.
 * Per D-22: Asks user to choose between linking to existing or creating new.
 */
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
        <div className="py-4">
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            「{entryName}」已存在，请选择：
          </p>
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <p className="font-medium text-stone-900 dark:text-stone-100">{existingEntry.name}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              类型：{TYPE_LABELS[existingEntry.type]}
            </p>
            {existingEntry.description && (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                {existingEntry.description}
              </p>
            )}
            {existingEntry.appearance && (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                {existingEntry.appearance}
              </p>
            )}
            {existingEntry.background && (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                {existingEntry.background}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button variant="secondary" onClick={handleCreateNew}>
            创建新条目
          </Button>
          <Button variant="primary" onClick={handleLinkExisting}>
            关联到现有条目
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
