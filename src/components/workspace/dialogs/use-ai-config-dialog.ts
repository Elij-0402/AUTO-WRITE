'use client'

import { useState, useCallback } from 'react'

export function useAIConfigDialog() {
  const [open, setOpen] = useState(false)

  const onClose = useCallback(() => setOpen(false), [])

  return { open, onClose }
}
