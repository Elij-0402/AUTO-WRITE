'use client'

import { useState, useCallback } from 'react'

interface UseChapterDraftDialogOptions {
  onDraftAccepted: (content: string) => void
}

export function useChapterDraftDialog({ onDraftAccepted }: UseChapterDraftDialogOptions) {
  const [open, setOpen] = useState(false)

  const onOpenChange = useCallback((open: boolean) => setOpen(open), [])

  return { open, onOpenChange }
}
