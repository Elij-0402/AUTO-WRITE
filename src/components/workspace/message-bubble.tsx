'use client'

import { ChatMessage } from '@/lib/hooks/use-ai-chat'
import { DraftCard } from './draft-card'

interface MessageBubbleProps {
  message: ChatMessage
  onInsertDraft?: (draftId: string, content: string) => void
}

export function MessageBubble({ message, onInsertDraft }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] p-3 ${
        isUser
          ? 'bg-primary text-primary-foreground rounded-[12px_12px_4px_12px]'
          : 'bg-surface-1 shadow-sm rounded-[12px_12px_12px_4px]'
      }`}>
        <div className="text-sm whitespace-pre-wrap break-words overflow-hidden">{message.content}</div>
        <div className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/60' : 'text-text-tertiary'}`}>
          {time}
        </div>
        
        {/* Draft card for assistant messages with drafts */}
        {!isUser && message.hasDraft && message.draftId && (
          <DraftCard
            draftId={message.draftId}
            content={message.content}
            onInsert={() => onInsertDraft?.(message.draftId!, message.content)}
          />
        )}
      </div>
    </div>
  )
}
