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
import type { AIConfig } from '@/lib/hooks/use-ai-config'

const CHAR_LIMIT = 4000

interface ChatInputProps {
  input: string
  loading: boolean
  chatError: string | null
  aiConfig: Pick<AIConfig, 'apiKey' | 'model' | 'availableModels'>
  placeholder?: string
  onInputChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onCancel: () => void
  onSaveModel: (model: string) => void
  onDismissError: () => void
  onOpenAIConfig: () => void
}

export function ChatInput({
  input,
  loading,
  chatError,
  aiConfig,
  placeholder = '与墨客聊聊你的故事…',
  onInputChange,
  onKeyDown,
  onSend,
  onCancel,
  onSaveModel,
  onDismissError,
  onOpenAIConfig,
}: ChatInputProps) {
  const [inputFocused, setInputFocused] = useState(false)
  const charCount = input.length
  const overLimit = charCount > CHAR_LIMIT
  const showCharCount = charCount >= CHAR_LIMIT * 0.8 || overLimit
  const hasConfiguredModel = Boolean(aiConfig.apiKey?.trim())
  const showModelPicker = hasConfiguredModel && Boolean(aiConfig.availableModels && aiConfig.availableModels.length > 0)

  return (
    <div className="p-3 space-y-2 border-t border-border">
      {!hasConfiguredModel && (
        <div className="rounded-[6px] border border-border bg-[hsl(var(--surface-1))] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-foreground">先配置 AI，之后才能继续对话</div>
              <p className="mt-1 text-[12px] leading-[1.6] text-muted-foreground">
                配置完成后会留在当前会话里，你可以直接继续写。
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              onClick={onOpenAIConfig}
            >
              去配置 AI
            </Button>
          </div>
        </div>
      )}

      {chatError && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-control)] bg-destructive/10 border border-destructive/30 text-destructive text-[12px] animate-fade-up">
          <span>{chatError}</span>
          <button onClick={onDismissError} className="ml-2 hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div
        data-testid="chat-composer"
        className={`rounded-[8px] border bg-[hsl(var(--card))] transition-colors ${
          inputFocused
            ? 'border-primary/60'
            : overLimit
              ? 'border-destructive/50'
              : 'border-border'
        }`}
      >
        <div className="relative">
          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={placeholder}
            disabled={loading}
            rows={1}
            className="flex min-h-[92px] max-h-[160px] w-full resize-none bg-transparent px-3 pb-[44px] pt-3 text-[15px] font-medium leading-[1.75] text-foreground placeholder:text-muted-foreground/85 outline-none"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-3 pb-2.5">
            {showModelPicker ? (
              <Select value={aiConfig.model || ''} onValueChange={(value) => { void onSaveModel(value) }}>
                <SelectTrigger
                  aria-label="选择模型"
                  className="pointer-events-auto h-7 max-w-[210px] gap-1.5 bg-transparent border-0 px-0 py-0 text-[13px] font-medium text-foreground/80 hover:bg-transparent hover:border-transparent hover:text-foreground focus:border-transparent focus:ring-0 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:opacity-45"
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
              <span className="max-w-[210px] truncate text-[13px] font-medium text-foreground/60" title={hasConfiguredModel ? aiConfig.model || '' : '未配置模型'}>
                {hasConfiguredModel ? aiConfig.model || '未设置模型' : '未配置模型'}
              </span>
            )}
            <div className="pointer-events-auto flex items-center gap-2">
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
                className="h-8 w-8 shrink-0 rounded-[8px] disabled:opacity-30 disabled:cursor-not-allowed"
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
