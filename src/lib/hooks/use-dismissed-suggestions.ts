import { useState, useCallback } from 'react'
import type { Suggestion } from '../ai/suggestion-parser'

/**
 * Dismissed suggestion tracking entry.
 * Per D-17: Track dismissed suggestions per conversation.
 */
export interface DismissedSuggestion {
  id: string
  content: string
}

/**
 * Hook to track dismissed suggestions within a conversation.
 * Per D-17: Dismissed suggestions won't appear again in current conversation.
 */
export function useDismissedSuggestions() {
  const [dismissed, setDismissed] = useState<DismissedSuggestion[]>([])

  /**
   * Generate a stable ID from suggestion content.
   * Uses a simple hash to create a deterministic ID.
   */
  const generateId = useCallback((suggestion: Suggestion): string => {
    const content = JSON.stringify(suggestion)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }, [])

  /**
   * Dismiss a suggestion, adding it to the dismissed list.
   */
  const dismiss = useCallback((suggestion: Suggestion) => {
    const id = generateId(suggestion)
    const content = JSON.stringify(suggestion)
    setDismissed(prev => {
      // Avoid duplicates
      if (prev.some(d => d.id === id)) return prev
      return [...prev, { id, content }]
    })
  }, [generateId])

  /**
   * Check if a suggestion has been dismissed.
   */
  const isDismissed = useCallback((suggestion: Suggestion): boolean => {
    const id = generateId(suggestion)
    return dismissed.some(d => d.id === id)
  }, [dismissed, generateId])

  /**
   * Filter out dismissed suggestions from an array.
   */
  const filterDismissed = useCallback((suggestions: Suggestion[]): Suggestion[] => {
    return suggestions.filter(s => !isDismissed(s))
  }, [isDismissed])

  /**
   * Reset dismissed suggestions when conversation changes.
   * Per D-17: Same suggestion will not appear again in current conversation.
   */
  const reset = useCallback(() => {
    setDismissed([])
  }, [])

  return { dismiss, isDismissed, filterDismissed, reset }
}
