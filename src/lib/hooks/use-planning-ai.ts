'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { streamChat } from '../ai/client'
import {
  buildPlanningPrompt,
  parsePlanningActionResult,
  type BuildPlanningPromptInput,
  type ParsedPlanningActionResult,
  type PlanningAction,
} from '../ai/planning-prompts'
import { buildSegmentedSystemPrompt } from '../ai/prompts'
import { useAIConfig } from './use-ai-config'

interface UsePlanningAiRunOptions extends Omit<BuildPlanningPromptInput, 'action'> {
  focusIdeaId?: string
  focusArcId?: string
  focusChapterPlanId?: string
}

export function usePlanningAi() {
  const { config } = useAIConfig()
  const [runningAction, setRunningAction] = useState<PlanningAction | null>(null)
  const [result, setResult] = useState<ParsedPlanningActionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const loading = useMemo(() => runningAction !== null, [runningAction])

  const runAction = useCallback(async (
    action: PlanningAction,
    options: UsePlanningAiRunOptions
  ): Promise<void> => {
    if (!config.apiKey) {
      setError('还没设置 API 密钥')
      return
    }

    setRunningAction(action)
    setResult(null)
    setError(null)
    abortRef.current = new AbortController()

    try {
      const segmentedSystem = buildSegmentedSystemPrompt({
        projectCharter: options.charter,
        worldEntries: options.worldEntries,
        storyTrackers: options.storyTrackers,
        planningSnapshot: options.planningSnapshot,
      })

      const prompt = buildPlanningPrompt({
        action,
        charter: options.charter,
        worldEntries: options.worldEntries,
        storyTrackers: options.storyTrackers,
        planningSnapshot: options.planningSnapshot,
        focusIdea: options.focusIdea,
        focusArc: options.focusArc,
        focusChapterPlan: options.focusChapterPlan,
        currentProgress: options.currentProgress,
      })

      let fullContent = ''
      const events = streamChat(
        {
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        },
        {
          segmentedSystem,
          messages: [{ role: 'user', content: prompt }],
          signal: abortRef.current.signal,
        }
      )

      for await (const event of events) {
        if (event.type === 'text_delta') {
          fullContent += event.delta
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      const parsed = parsePlanningActionResult(fullContent)
      if (!parsed.ok) {
        setError(parsed.error)
        return
      }

      setResult(parsed.value)
    } catch (runError) {
      if (runError instanceof Error && runError.name === 'AbortError') {
        return
      }
      setError(runError instanceof Error ? runError.message : '规划生成失败')
    } finally {
      abortRef.current = null
      setRunningAction(null)
    }
  }, [config])

  const dismissResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    loading,
    error,
    runningAction,
    result,
    runAction,
    dismissResult,
  }
}
