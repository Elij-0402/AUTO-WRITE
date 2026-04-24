'use client'

import { useState, useCallback } from 'react'

export function useOnboardingTourDialog(initialProjectId?: string) {
  const [open, setOpen] = useState(false)
  const [projectId] = useState(initialProjectId)

  const onComplete = useCallback(() => setOpen(false), [])

  return { open, projectId, onComplete }
}
