'use client'

import { Trash2, MessageSquare } from 'lucide-react'
import type { Conversation } from '@/lib/hooks/use-conversations'

interface ConversationDrawerProps {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

function formatRelativeTime(ts: number): string {
  const now = Date.now()
  const diffMin = Math.floor((now - ts) / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return '昨天'
  if (diffDay < 7) return `${diffDay} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

export function ConversationDrawer({
  open,
  onClose,
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
}: ConversationDrawerProps) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-30 flex">
      <div
        className="flex-1 bg-black/20 animate-fade-in"
        onClick={onClose}
        aria-label="关闭历史抽屉"
      />
      <div className="w-[280px] bg-[hsl(var(--card))] border-l border-border flex flex-col animate-slide-in-left">
        <div className="h-12 flex items-center justify-between px-4 border-b border-border">
          <span className="text-[14px] font-semibold">对话历史</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-[13px] text-muted-foreground">还没有对话历史</p>
            </div>
          ) : (
            conversations.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-[var(--radius-control)] px-2.5 py-2 text-foreground/85 hover:bg-[hsl(var(--surface-2))] transition-colors"
              >
                <button
                  type="button"
                  className={
                    'flex-1 min-w-0 rounded-sm px-1 py-1 text-left transition-colors ' +
                    (activeConversationId === c.id
                      ? 'bg-[hsl(var(--surface-2))] text-foreground'
                      : 'text-foreground/85')
                  }
                  aria-label={`打开对话：${c.displayTitle ?? c.title}`}
                  aria-pressed={activeConversationId === c.id}
                  onClick={() => onSelect(c.id)}
                >
                  <div className="text-[13px] font-medium truncate">{c.displayTitle ?? c.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {c.lastMeaningfulSnippet
                      ? c.lastMeaningfulSnippet
                      : `${formatRelativeTime(c.updatedAt)} · ${c.messageCount} 条`}
                  </div>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(c.id)
                  }}
                  className="ml-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 hover:text-destructive hover:bg-[hsl(var(--surface-2))] transition-colors"
                  aria-label="删除对话"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
