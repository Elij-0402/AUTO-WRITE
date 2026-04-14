import { useState, useCallback, useRef, useEffect } from 'react'
import { createProjectDB } from '../db/project-db'
import { useAIConfig } from './use-ai-config'

export interface ChatMessage {
  id: string
  projectId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasDraft?: boolean
  draftId?: string
}

const SYSTEM_PROMPT = `你是一位专业的中文网文写作助手，熟悉中文小说创作技巧。

当前功能：
- 续写：根据给定内容续写小说章节
- 润色：修改和优化已有文本
- 大纲：根据章节标题生成详细大纲
- 讨论：就写作相关问题提供建议

风格要求：
- 使用自然流畅的中文
- 符合网文读者的阅读习惯
- 适当使用对话和动作描写
`

export function useAIChat(projectId: string) {
  const { config } = useAIConfig(projectId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load messages on mount
  useEffect(() => {
    if (!projectId) return
    const db = createProjectDB(projectId)
    db.table('messages')
      .where('projectId').equals(projectId)
      .sortBy('timestamp')
      .then(msgs => setMessages(msgs as ChatMessage[]))
      .catch(console.error)
  }, [projectId])

  const sendMessage = useCallback(async (content: string) => {
    if (!config.apiKey || !config.baseUrl) {
      throw new Error('请先配置 AI 设置')
    }

    // Create user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      projectId,
      role: 'user',
      content,
      timestamp: Date.now()
    }
    
    // Save user message
    const db = createProjectDB(projectId)
    await db.table('messages').add(userMsg)
    setMessages(prev => [...prev, userMsg])
    
    // Prepare assistant message placeholder
    const assistantMsgId = crypto.randomUUID()
    setLoading(true)
    setStreamingContent('')
    
    // Build messages for API
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content }
    ]
    
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
          messages: apiMessages,
          stream: true
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`)
      }
      
      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')
      
      let fullContent = ''
      const decoder = new TextDecoder()
      
      // Create placeholder for assistant message
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        projectId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }])
      
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
                setStreamingContent(fullContent)
                // Update the assistant message in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, content: fullContent }
                    : msg
                ))
              }
            } catch {}
          }
        }
      }
      
      // Finalize message with potential draft detection
      const hasDraft = detectDraft(fullContent)
      const finalMsg: ChatMessage = {
        id: assistantMsgId,
        projectId,
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        hasDraft,
        draftId: hasDraft ? crypto.randomUUID() : undefined
      }
      
      // Update in database
      await db.table('messages').update(assistantMsgId, finalMsg)
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
      } else {
        throw err
      }
    } finally {
      setLoading(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }, [config, messages, projectId])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return { messages, loading, streamingContent, sendMessage, cancelStream }
}

function detectDraft(content: string): boolean {
  // Simple heuristic: if user explicitly asked for a draft or AI signals draft
  const draftIndicators = ['以下是草稿', '草稿：', '插入到编辑器', '续写如下', '生成内容：']
  return draftIndicators.some(indicator => content.includes(indicator))
}
