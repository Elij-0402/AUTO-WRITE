'use client'

import { useState, useCallback, useRef } from 'react'
import { createProjectDB } from '../db/project-db'
import { useAIConfig } from './use-ai-config'
import { useWorldEntries } from './use-world-entries'
import { useChapters } from './use-chapters'
import { trimToTokenBudget, DEFAULT_TOKEN_BUDGET } from './use-context-injection'
import { streamChat, type AIClientConfig, type ProviderStreamMessage } from '../ai/client'
import { buildWorldBibleBlock, BASE_INSTRUCTION } from '../ai/prompts'
import { searchRelevantEntries } from '../rag/search'
import { getDefaultEmbedder } from '../rag/default-embedder'

export interface GenerationState {
  status: 'idle' | 'generating' | 'complete' | 'error'
  streamingContent: string
  error: string | null
}

/**
 * Split plain text into Tiptap paragraph nodes.
 * Each \n\n separator creates a new paragraph.
 */
function splitIntoParagraphs(text: string): object[] {
  return text
    .split(/\n\n+/)
    .map(para => para.trim())
    .filter(para => para.length > 0)
    .map(para => ({
      type: 'paragraph' as const,
      content: para ? [{ type: 'text' as const, text: para }] : []
    }))
}

/**
 * Hook for AI-powered chapter generation from outline data.
 * Per D-01, D-02, D-03, D-04, D-06, D-08.
 * 
 * Reuses:
 * - Streaming logic from use-ai-chat.ts
 * - Context injection from use-context-injection.ts (4000 token budget, keyword matching)
 * - Chapter CRUD from use-chapters.ts
 */
export function useChapterGeneration(projectId: string, chapterId: string) {
  const { config } = useAIConfig(projectId)
  const { entries, entriesByType } = useWorldEntries(projectId)
  const { chapters, addChapter, updateChapterContent, reorderChapters } = useChapters(projectId)

  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    streamingContent: '',
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  
  const currentChapter = chapters.find(c => c.id === chapterId)
  
  /**
   * Start chapter generation per D-02, D-04.
   * Streams output to GenerationPanel via streamingContent state.
   */
  const startGeneration = useCallback(async () => {
    if (!config.apiKey) {
      setState(prev => ({ ...prev, status: 'error', error: '请先配置 AI 设置：API Key 必填' }))
      return
    }
    if (config.provider === 'openai-compatible' && !config.baseUrl) {
      setState(prev => ({ ...prev, status: 'error', error: '请先配置 AI 设置：OpenAI 兼容模式需要填写 Base URL' }))
      return
    }
    
    if (!currentChapter) {
      setState(prev => ({ ...prev, status: 'error', error: '章节未找到' }))
      return
    }
    
    const { title, outlineSummary, outlineTargetWordCount } = currentChapter
    
    if (!outlineSummary) {
      setState(prev => ({ ...prev, status: 'error', error: '请先填写章节大纲摘要' }))
      return
    }

    // Build context: hybrid RAG retrieval for relevant world bible entries
    const db = createProjectDB(projectId)
    const embedder = getDefaultEmbedder()
    const matchedEntries = entries
      ? await searchRelevantEntries({
          db,
          projectId,
          embedder,
          query: outlineSummary,
          entries,
          entriesByType,
          topK: 12,
        })
      : []
    const trimmedEntries = trimToTokenBudget(matchedEntries, DEFAULT_TOKEN_BUDGET)

    // Build chapter-specific runtime context
    const runtimeContext = `【章节大纲】
标题：${title}
摘要：${outlineSummary}
目标字数：${outlineTargetWordCount ? `${outlineTargetWordCount}字` : '未设定'}

【你的任务】
基于以上大纲和世界观背景，创作一个完整的章节。
要求：
- 内容丰富，情节完整
- 遵循网文写作风格
- 适当使用对话和动作描写
- 章节结尾留有悬念或自然过渡`

    // Reset state for new generation
    setState({ status: 'generating', streamingContent: '', error: null })

    try {
      abortControllerRef.current = new AbortController()

      const configForStreamChat: AIClientConfig = {
        provider: config.provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      }
      const segmentedSystem = {
        baseInstruction: BASE_INSTRUCTION,
        worldBibleContext: buildWorldBibleBlock(trimmedEntries),
        runtimeContext,
      }
      const messages: ProviderStreamMessage[] = [
        { role: 'user', content: '请基于以上大纲和世界观背景，创作一个完整的章节。' }
      ]

      let fullContent = ''
      for await (const event of streamChat(configForStreamChat, {
        segmentedSystem,
        messages,
        signal: abortControllerRef.current.signal,
      })) {
        if (event.type === 'text_delta') {
          fullContent += event.delta
          setState(prev => ({ ...prev, streamingContent: fullContent }))
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      setState(prev => ({ ...prev, status: 'complete', streamingContent: fullContent }))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState(prev => ({ ...prev, status: 'idle', streamingContent: '' }))
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: err instanceof Error ? err.message : '生成失败',
        }))
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [config, currentChapter, projectId, entries, entriesByType])
  
  /**
   * Cancel ongoing generation per D-02.
   */
  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])
  
  /**
   * Accept generated content into editor per D-03, D-08.
   * 
   * Per D-08: If chapter has existing content, create NEW chapter
   * titled "{原标题} (AI草稿)" and insert after current chapter.
   */
  const acceptContent = useCallback(async (): Promise<{ success: boolean; newChapterId?: string }> => {
    if (!currentChapter || state.status !== 'complete') {
      return { success: false }
    }
    
    const generatedContent = state.streamingContent
    
    if (!generatedContent.trim()) {
      return { success: false }
    }
    
    try {
      // Check if chapter has existing content - content is a ProseMirror doc object
      const hasExistingContent = currentChapter.content && 
        typeof currentChapter.content === 'object' && 
        'content' in currentChapter.content && 
        Array.isArray(currentChapter.content.content) &&
        currentChapter.content.content.length > 0

      // Per D-08: If chapter has existing content, create new chapter after current
      if (hasExistingContent) {
        // Create new chapter with "(AI草稿)" suffix
        const newChapterTitle = `${currentChapter.title} (AI草稿)`
        const newChapterId = await addChapter(newChapterTitle)
        
        // Insert content into new chapter (multi-paragraph preserved)
        await updateChapterContent(newChapterId, {
          type: 'doc',
          content: splitIntoParagraphs(generatedContent)
        })
        
        // Find current chapter index and reorder so new chapter is placed after current
        const currentIndex = chapters.findIndex(c => c.id === chapterId)
        if (currentIndex !== -1) {
          // Build new order: place generated chapter after current chapter
          const chapterIds = chapters.map(c => c.id)
          const newIndex = chapterIds.indexOf(newChapterId)
          if (newIndex !== -1 && newIndex !== currentIndex + 1) {
            // Remove from current position if it's not already right after
            chapterIds.splice(newIndex, 1)
            // Insert after current chapter
            chapterIds.splice(currentIndex + 1, 0, newChapterId)
            // Apply the reordering
            await reorderChapters(chapterIds)
          }
        }
        
        // Reset state
        setState({ status: 'idle', streamingContent: '', error: null })
        
        return { success: true, newChapterId }
      } else {
        // Chapter is empty - update content directly (multi-paragraph preserved)
        await updateChapterContent(chapterId, {
          type: 'doc',
          content: splitIntoParagraphs(generatedContent)
        })
        
        // Reset state
        setState({ status: 'idle', streamingContent: '', error: null })
        
        return { success: true }
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : '采纳失败'
      }))
      return { success: false }
    }
  }, [currentChapter, state, chapters, chapterId, addChapter, updateChapterContent])
  
  /**
   * Reset state to idle.
   */
  const resetGeneration = useCallback(() => {
    setState({ status: 'idle', streamingContent: '', error: null })
  }, [])
  
  return {
    ...state,
    startGeneration,
    cancelGeneration,
    acceptContent,
    resetGeneration,
  }
}
