'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAIConfig } from './use-ai-config'
import { useWorldEntries } from './use-world-entries'
import { useChapters } from './use-chapters'
import {
  extractKeywords,
  findRelevantEntries,
  trimToTokenBudget,
  buildContextPrompt,
} from './use-context-injection'

export interface GenerationState {
  status: 'idle' | 'generating' | 'complete' | 'error'
  streamingContent: string
  error: string | null
}

/**
 * Generation system prompt per D-04, D-06.
 * Builds prompt with chapter data + world bible context.
 */
function buildGenerationSystemPrompt(
  chapterTitle: string,
  outlineSummary: string,
  targetWordCount: number | null,
  worldBibleContext: string
): string {
  return `【世界观百科】
${worldBibleContext || '(暂无相关世界观条目)'}

【章节大纲】
标题：${chapterTitle}
摘要：${outlineSummary}
目标字数：${targetWordCount ? `${targetWordCount}字` : '未设定'}

【你的任务】
基于以上大纲和世界观背景，创作一个完整的章节。
要求：
- 内容丰富，情节完整
- 遵循网文写作风格
- 适当使用对话和动作描写
- 章节结尾留有悬念或自然过渡`
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
  const { entriesByType } = useWorldEntries(projectId)
  const { chapters, addChapter, updateChapterContent, reorderChapters } = useChapters(projectId)
  
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    streamingContent: '',
    error: null,
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const entriesByTypeRef = useRef(entriesByType)
  
  // Keep entriesByTypeRef updated
  useEffect(() => {
    entriesByTypeRef.current = entriesByType
  }, [entriesByType])
  
  const currentChapter = chapters.find(c => c.id === chapterId)
  
  /**
   * Start chapter generation per D-02, D-04.
   * Streams output to GenerationPanel via streamingContent state.
   */
  const startGeneration = useCallback(async () => {
    if (!config.apiKey || !config.baseUrl) {
      setState(prev => ({ ...prev, status: 'error', error: '请先配置 AI 设置' }))
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
    
    // Build context: extract keywords from outline summary, find relevant world bible entries
    const keywords = extractKeywords(outlineSummary)
    const matchedEntries = findRelevantEntries(keywords, entriesByTypeRef.current)
    const trimmedEntries = trimToTokenBudget(matchedEntries, 4000)
    const worldBibleContext = buildContextPrompt(trimmedEntries)
    
    // Build generation prompt
    const systemPrompt = buildGenerationSystemPrompt(
      title,
      outlineSummary,
      outlineTargetWordCount,
      worldBibleContext
    )
    
    // Reset state for new generation
    setState({
      status: 'generating',
      streamingContent: '',
      error: null,
    })
    
    try {
      abortControllerRef.current = new AbortController()
      
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '请基于以上大纲和世界观背景，创作一个完整的章节。' }
          ],
          stream: true
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`)
      }
      
      // Handle streaming response per D-02
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')
      
      let fullContent = ''
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                fullContent += delta
                setState(prev => ({
                  ...prev,
                  streamingContent: fullContent
                }))
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
      
      // Generation complete per D-03
      setState(prev => ({
        ...prev,
        status: 'complete',
        streamingContent: fullContent
      }))
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
        setState(prev => ({ ...prev, status: 'idle', streamingContent: '' }))
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: err instanceof Error ? err.message : '生成失败'
        }))
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [config, currentChapter, projectId])
  
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
        
        // Insert content into new chapter
        await updateChapterContent(newChapterId, {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: generatedContent }]
            }
          ]
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
        // Chapter is empty - update content directly
        await updateChapterContent(chapterId, {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: generatedContent }]
            }
          ]
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
