'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAIConfig } from '@/lib/hooks/use-ai-config'

export function useAIOnboardingDialog() {
  const { config, loading: aiConfigLoading } = useAIConfig()
  const [open, setOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    if (aiConfigLoading) return
    const hasSeenOnboarding = localStorage.getItem('inkforge-has-seen-onboarding')
    if (!hasSeenOnboarding && !config.apiKey) {
      queueMicrotask(() => setOpen(true))
    }
  }, [aiConfigLoading, config.apiKey])

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
