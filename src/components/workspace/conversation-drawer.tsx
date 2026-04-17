'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/hooks/use-conversations'

interface ConversationDrawerProps {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string, title: string) => void
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
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: ConversationDrawerProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  if (!open) return null

  const handleStartRename = (c: Conversation) => {
    setRenamingId(c.id)
    setRenameValue(c.title)
  }
  const handleSubmitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

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
          <Button size="sm" onClick={onCreate} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            新建
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-[13px] text-muted-foreground">还没有对话</p>
              <p className="text-[12px] text-muted-foreground/70">点击"新建"开始第一条</p>
            </div>
          ) : (
            conversations.map(c => {
              const isActive = c.id === activeId
              return (
                <div
                  key={c.id}
                  className={cn(
                    'group relative flex items-start gap-2 rounded-[var(--radius-control)] px-2.5 py-2 cursor-pointer transition-colors',
                    isActive
                      ? 'bg-primary/10 text-foreground'
                      : 'text-foreground/85 hover:bg-[hsl(var(--surface-2))]'
                  )}
                  onClick={() => {
                    if (renamingId !== c.id) onSelect(c.id)
                  }}
                >
                  <div className="flex-1 min-w-0">
                    {renamingId === c.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={handleSubmitRename}
                        onKeyDown={e => {
                          if (e.nativeEvent.isComposing) return
                          if (e.key === 'Enter') handleSubmitRename()
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full bg-transparent text-[13px] font-medium border-b border-border focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <div className="text-[13px] font-medium truncate">{c.title}</div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(c.updatedAt)} · {c.messageCount} 条
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 opacity-0 group-hover:opacity-100 hover:bg-[hsl(var(--surface-3))] hover:text-foreground transition-opacity"
                        aria-label="更多操作"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleStartRename(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(c.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
