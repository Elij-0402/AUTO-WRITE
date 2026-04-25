'use client'

import { useState, useCallback } from 'react'

export function useAIOnboardingDialog() {
  const [open, setOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  const onSkip = useCallback(() => {
    localStorage.setItem('inkforge-has-seen-onboarding', '1')
    setOpen(false)
    setTourOpen(true)
  }, [])

  const onSaveComplete = useCallback(() => {
    localStorage.setItem('inkforge-has-seen-onboarding', '1')
    setOpen(false)
    setTourOpen(true)
  }, [])

  return { open, onSkip, onSaveComplete, tourOpen, setTourOpen }
}
