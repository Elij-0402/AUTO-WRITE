'use client'

import { useState } from 'react'
import { Send, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
            className="resize-none min-h-[56px] max-h-[140px] text-[14px] leading-relaxed !bg-transparent hover:!bg-transparent focus-visible:!bg-transparent px-3 py-2.5 pr-12 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
          />

          <div className="flex items-center justify-between px-3 pb-2">
            {aiConfig.availableModels && aiConfig.availableModels.length > 0 ? (
              <select
                value={aiConfig.model || ''}
                onChange={(e) => { void onSaveModel(e.target.value) }}
                className="max-w-[180px] truncate bg-transparent text-[12px] text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                aria-label="选择模型"
                title={aiConfig.model || '选择模型'}
              >
                {aiConfig.availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <span className="text-[12px] text-muted-foreground/70 truncate max-w-[180px]" title={aiConfig.model || ''}>
                {aiConfig.model || '未设置模型'}
              </span>
            )}
            <div className="flex items-center gap-2">
              {charCount > 0 && (
                <span className={`tabular-nums text-[11px] ${overLimit ? 'text-destructive' : charCount > CHAR_LIMIT * 0.8 ? 'text-primary/80' : 'text-muted-foreground'}`}>
                  {charCount}{overLimit && ` / ${CHAR_LIMIT}`}
                </span>
              )}
              <Button
                onClick={loading ? onCancel : onSend}
                disabled={!loading && (!input.trim() || overLimit)}
                size="icon-sm"
                variant={loading ? 'subtle' : 'default'}
                aria-label={loading ? '停止生成' : '发送'}
                className="disabled:opacity-30 disabled:cursor-not-allowed"
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
