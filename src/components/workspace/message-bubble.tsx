'use client'

import { useState } from 'react'
import { ChatMessage } from '@/lib/hooks/use-ai-chat'
import type { PreferenceMemoryCategory } from '@/lib/types'
import { DraftCard } from './draft-card'
import { PreferenceFeedbackDialog } from './preference-feedback-dialog'
import { Feather, Check, Copy } from 'lucide-react'

export interface AssistantPreferenceFeedbackInput {
  messageId: string
  category: PreferenceMemoryCategory
  note: string
}

interface MessageBubbleProps {
  message: ChatMessage
  projectId: string
  onInsertDraft?: (draftId: string, content: string) => void
  onRecordPreference?: (input: AssistantPreferenceFeedbackInput) => Promise<void> | void
}

export function MessageBubble({
  message,
  projectId,
  onInsertDraft,
  onRecordPreference,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isDirectionAdjustment = message.kind === 'direction-adjustment'
  const [copied, setCopied] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackSaved, setFeedbackSaved] = useState(false)
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

  const handlePreferenceSubmit = async ({
    category,
    note,
  }: {
    category: PreferenceMemoryCategory
    note: string
  }) => {
    await onRecordPreference?.({
      messageId: message.id,
      category,
      note,
    })
    setFeedbackOpen(false)
    setFeedbackSaved(true)
    setTimeout(() => setFeedbackSaved(false), 2000)
  }

  if (isUser) {
    return (
      <div className={`group flex justify-end px-2 animate-message-enter ${isDirectionAdjustment ? 'py-1.5' : 'py-2'}`}>
        <div className="max-w-[86%] flex flex-col items-end gap-1">
          <div
            className={
              isDirectionAdjustment
                ? 'px-3 py-1.5 rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-2))] text-[13px] text-foreground/88 leading-[1.65] whitespace-pre-wrap break-words'
                : 'px-3.5 py-2 rounded-[var(--radius-card)] bg-primary text-primary-foreground text-[14px] leading-[1.7] whitespace-pre-wrap break-words'
            }
          >
            {message.content}
          </div>
          <div className={`flex items-center gap-1.5 text-[11px] text-muted-foreground pr-1 transition-opacity ${isDirectionAdjustment ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
    <>
      <div className={`group flex pl-3 pr-2 animate-message-enter ${isDirectionAdjustment ? 'gap-2 py-1.5' : 'gap-3 py-3'}`}>
        <div className="flex-shrink-0 mt-0.5">
          <div className={`flex items-center justify-center rounded-full ${isDirectionAdjustment ? 'h-6 w-6 bg-[hsl(var(--surface-2))] text-muted-foreground' : 'w-7 h-7 bg-primary/10 text-primary'}`}>
            <Feather className={isDirectionAdjustment ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={2} />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className={`text-[13px] ${isDirectionAdjustment ? 'font-medium text-foreground/80' : 'font-semibold text-foreground'}`}>
              {isDirectionAdjustment ? '墨客已记下' : '墨客'}
            </span>
            <span className={`text-[11px] text-muted-foreground tabular-nums transition-opacity ${isDirectionAdjustment ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {time}
            </span>
            <div className={`ml-auto flex items-center gap-1 transition-opacity ${isDirectionAdjustment ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {!isDirectionAdjustment ? (
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="rounded-[var(--radius-control)] px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground transition-colors"
                  aria-label="记录偏差"
                >
                  {feedbackSaved ? '已记录' : '记录偏差'}
                </button>
              ) : null}
              <button
                onClick={handleCopy}
                className="p-1 rounded-[var(--radius-control)] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-2))] transition-all"
                aria-label="复制"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className={`whitespace-pre-wrap break-words overflow-hidden ${isDirectionAdjustment ? 'text-[13px] text-foreground/82 leading-[1.7]' : 'text-[14px] text-foreground leading-[1.8]'}`}>
            {message.content}
          </div>

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

      <PreferenceFeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={handlePreferenceSubmit}
      />
    </>
  )
}
