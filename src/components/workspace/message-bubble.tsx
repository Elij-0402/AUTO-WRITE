'use client'

import { useState } from 'react'
import { ChatMessage } from '@/lib/hooks/use-ai-chat'
import { DraftCard } from './draft-card'
import { Feather, Check, Copy } from 'lucide-react'

interface MessageBubbleProps {
  message: ChatMessage
  onInsertDraft?: (draftId: string, content: string) => void
}

export function MessageBubble({ message, onInsertDraft }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  if (isUser) {
    return (
      <div className="group flex justify-end py-2.5 animate-message-enter">
        <div className="max-w-[82%] flex flex-col items-end gap-1">
          <div className="relative px-3.5 py-2 rounded-[14px] rounded-br-[4px] bg-gradient-to-br from-primary/12 via-primary/8 to-primary/5 border border-primary/15 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
            {message.content}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 pr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="tabular-nums">{time}</span>
            <button
              onClick={handleCopy}
              className="p-0.5 rounded hover:text-primary transition-colors"
              aria-label="复制"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex gap-2.5 py-2.5 pl-3 pr-1 ink-rail animate-message-enter">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shadow-[0_0_0_3px_hsl(var(--primary)/0.04)]">
          <Feather className="w-3 h-3 text-primary" strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[13px] tracking-wide text-primary/90">
            墨客
          </span>
          <span className="text-[10px] text-muted-foreground/70 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </span>
          <button
            onClick={handleCopy}
            className="ml-auto p-1 rounded text-muted-foreground/60 hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="复制"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="text-[13.5px] text-foreground/95 whitespace-pre-wrap break-words overflow-hidden leading-[1.75]">
          {message.content}
        </div>

        {message.hasDraft && message.draftId && (
          <div className="pt-1.5">
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
