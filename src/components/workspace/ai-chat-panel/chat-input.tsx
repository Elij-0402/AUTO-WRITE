'use client'

import { useState } from 'react'
import { Send, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { AIConfig } from '@/lib/hooks/use-ai-config'

const CHAR_LIMIT = 4000

interface ChatInputProps {
  input: string
  loading: boolean
  chatError: string | null
  aiConfig: Pick<AIConfig, 'model' | 'availableModels'>
  onInputChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onCancel: () => void
  onSaveModel: (model: string) => void
  onDismissError: () => void
}

export function ChatInput({
  input,
  loading,
  chatError,
  aiConfig,
  onInputChange,
  onKeyDown,
  onSend,
  onCancel,
  onSaveModel,
  onDismissError,
}: ChatInputProps) {
  const [inputFocused, setInputFocused] = useState(false)
  const charCount = input.length
  const overLimit = charCount > CHAR_LIMIT
  const showCharCount = charCount >= CHAR_LIMIT * 0.8 || overLimit

  return (
    <div className="p-3 space-y-2 border-t border-border">
      {chatError && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-control)] bg-destructive/10 border border-destructive/30 text-destructive text-[12px] animate-fade-up">
          <span>{chatError}</span>
          <button onClick={onDismissError} className="ml-2 hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div
        className={`rounded-[var(--radius-card)] border bg-[hsl(var(--card))] transition-colors ${
          inputFocused
            ? 'border-primary/60'
            : overLimit
              ? 'border-destructive/50'
              : 'border-border'
        }`}
      >
        <div className="flex flex-col">
          <Textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="与墨客聊聊你的故事…"
            disabled={loading}
            rows={1}
            className="resize-none min-h-[64px] max-h-[140px] text-[15px] leading-[1.75] font-medium !bg-transparent hover:!bg-transparent focus-visible:!bg-transparent px-3 py-3 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/85"
          />

          <div className="flex items-end justify-between gap-3 px-3 pb-3 pt-1">
            {aiConfig.availableModels && aiConfig.availableModels.length > 0 ? (
              <Select value={aiConfig.model || ''} onValueChange={(value) => { void onSaveModel(value) }}>
                <SelectTrigger
                  aria-label="选择模型"
                  className="h-8 max-w-[210px] bg-transparent border-0 px-0 py-0 text-[13px] font-medium text-foreground/88 hover:bg-transparent hover:border-transparent focus:border-transparent"
                >
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {aiConfig.availableModels.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="max-w-[210px] truncate text-[13px] font-medium text-foreground/72" title={aiConfig.model || ''}>
                {aiConfig.model || '未设置模型'}
              </span>
            )}
            <div className="flex items-center gap-3">
              {showCharCount && (
                <span
                  className={`tabular-nums text-[12px] font-medium ${
                    overLimit
                      ? 'text-destructive'
                      : charCount > CHAR_LIMIT * 0.8
                        ? 'text-primary/90'
                        : 'text-foreground/68'
                  }`}
                  aria-label={`当前输入 ${charCount} 字`}
                  title={`当前输入 ${charCount} 字${overLimit ? `，上限 ${CHAR_LIMIT} 字` : ''}`}
                >
                  {charCount} 字{overLimit && ` / ${CHAR_LIMIT}`}
                </span>
              )}
              <Button
                onClick={loading ? onCancel : onSend}
                disabled={!loading && (!input.trim() || overLimit)}
                size="icon-sm"
                variant={loading ? 'subtle' : 'default'}
                aria-label={loading ? '停止生成' : '发送'}
                className="shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Square className="fill-current" strokeWidth={0} />
                ) : (
                  <Send strokeWidth={2} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
