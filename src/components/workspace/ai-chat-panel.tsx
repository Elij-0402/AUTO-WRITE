'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIChat, ChatMessage } from '@/lib/hooks/use-ai-chat'
import { MessageBubble } from './message-bubble'
import { Send, Loader2 } from 'lucide-react'

interface AIChatPanelProps {
  projectId: string
  onInsertDraft?: (content: string) => void
}

export function AIChatPanel({ projectId, onInsertDraft }: AIChatPanelProps) {
  const { messages, loading, sendMessage } = useAIChat(projectId)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    try {
      await sendMessage(text)
    } catch (err) {
      console.error('Failed to send message:', err)
      alert(err instanceof Error ? err.message : '发送失败')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInsertDraft = (draftId: string, content: string) => {
    onInsertDraft?.(content)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
            <div className="text-center">
              <p className="text-lg mb-1">AI 聊天</p>
              <p className="text-sm text-zinc-300 dark:text-zinc-600">配置 AI 设置后开始对话</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg: ChatMessage) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onInsertDraft={handleInsertDraft}
              />
            ))}
            {loading && (
              <div className="flex justify-start mb-2">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={loading}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
