'use client'

import { useState, useCallback } from 'react'

export function useChapterDraftDialog() {
  const [open, setOpen] = useState(false)

  const onOpenChange = useCallback((open: boolean) => setOpen(open), [])

  return { open, onOpenChange }
}
