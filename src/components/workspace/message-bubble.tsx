'use client'

import { ChatMessage } from '@/lib/hooks/use-ai-chat'
import { DraftCard } from './draft-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="flex gap-3 py-3 px-1">
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarFallback className={cn(
          'text-[11px] font-medium',
          isUser
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        )}>
          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {isUser ? '你' : 'AI 助手'}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {time}
          </span>
        </div>

        <div className="text-sm text-foreground whitespace-pre-wrap break-words overflow-hidden leading-relaxed">
          {message.content}
        </div>

        {!isUser && message.hasDraft && message.draftId && (
          <div className="pt-1">
            <DraftCard
              draftId={message.draftId}
              content={message.content}
              onInsert={() => onInsertDraft?.(message.draftId!, message.content)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
