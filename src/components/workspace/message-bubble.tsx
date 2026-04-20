'use client'

import { useState } from 'react'
import { ChatMessage } from '@/lib/hooks/use-ai-chat'
import { DraftCard } from './draft-card'
import { CitationChip } from './citation-chip'
import { Feather, Check, Copy } from 'lucide-react'

interface MessageBubbleProps {
  message: ChatMessage
  /** Needed for T2: CitationChip writes click telemetry + looks up WorldEntry for popover. */
  projectId: string
  /** The conversation the message belongs to (carried into aiUsage rows). */
  conversationId?: string | null
  onInsertDraft?: (draftId: string, content: string) => void
  onCitationClick?: (entryId: string | undefined) => void
}

export function MessageBubble({
  message,
  projectId,
  conversationId,
  onInsertDraft,
  onCitationClick,
}: MessageBubbleProps) {
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
          <div className="px-3.5 py-2 rounded-[var(--radius-card)] bg-primary text-primary-foreground text-[14px] leading-[1.7] whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    <div className="group flex gap-3 py-3 pl-3 pr-2 animate-message-enter">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <Feather className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-foreground">
            墨客
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </span>
          <button
            onClick={handleCopy}
            className="ml-auto p-1 rounded-[var(--radius-control)] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-2))] opacity-0 group-hover:opacity-100 transition-all"
            aria-label="复制"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="text-[14px] text-foreground whitespace-pre-wrap break-words overflow-hidden leading-[1.8]">
          {message.content}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="text-[11px] text-muted-foreground self-center mr-1">溯源:</span>
            {message.citations.map((citation, idx) => (
              <CitationChip
                key={`${citation.startBlockIndex}-${idx}`}
                citation={citation}
                index={idx}
                projectId={projectId}
                conversationId={conversationId ?? message.conversationId}
                onClick={onCitationClick}
              />
            ))}
          </div>
        )}

        {message.hasDraft && message.draftId && (
          <div className="pt-2">
            <DraftCard
              draftId={message.draftId}
              content={message.content}
              projectId={projectId}
              messageId={message.id}
              onInsert={() => onInsertDraft?.(message.draftId!, message.content)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
