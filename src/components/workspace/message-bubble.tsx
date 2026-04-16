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
    minute: '2-digit',
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
      <div className="group flex justify-end py-2 px-2 animate-message-enter">
        <div className="max-w-[86%] flex flex-col items-end gap-1">
          <div className="px-3.5 py-2 rounded-[var(--radius-card)] surface-3 text-[13px] text-foreground leading-[1.7] whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="tabular-nums text-mono">{time}</span>
            <button
              onClick={handleCopy}
              className="p-0.5 rounded hover:text-[hsl(var(--accent-amber))] transition-colors"
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
    <div className="group flex gap-2.5 py-3 pl-3 pr-2 ink-rail animate-message-enter">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-6 h-6 rounded-full bg-[hsl(var(--accent-amber))]/10 border border-[hsl(var(--accent-amber))]/40 flex items-center justify-center">
          <Feather className="w-3 h-3 text-[hsl(var(--accent-amber))]" strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[13px] tracking-wider text-[hsl(var(--accent-amber))]">
            墨客
          </span>
          <span className="text-[10px] text-muted-foreground/60 tabular-nums text-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </span>
          <button
            onClick={handleCopy}
            className="ml-auto p-1 rounded-[var(--radius-control)] text-muted-foreground/60 hover:text-[hsl(var(--accent-amber))] hover:bg-[hsl(var(--surface-3))] opacity-0 group-hover:opacity-100 transition-all"
            aria-label="复制"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="text-[13.5px] text-foreground/95 whitespace-pre-wrap break-words overflow-hidden leading-[1.85]">
          {message.content}
        </div>

        {message.hasDraft && message.draftId && (
          <div className="pt-2">
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
