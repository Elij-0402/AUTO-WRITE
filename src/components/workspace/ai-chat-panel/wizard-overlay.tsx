'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WizardModeState } from '@/lib/hooks/use-wizard-mode'
import type { WizardOption } from '@/lib/hooks/use-wizard-mode'

interface WizardOverlayProps {
  wizardState: WizardModeState
  wizardOptions: WizardOption[]
  wizardResult: string | null
  wizardError: string | null
  onSelectOption: (option: WizardOption) => void | Promise<void>
  onInsertDraft: (content: string) => void
  onClose: () => void
}

export function WizardOverlay({
  wizardState,
  wizardOptions,
  wizardResult,
  wizardError,
  onSelectOption,
  onInsertDraft,
  onClose,
}: WizardOverlayProps) {
  if (wizardState === 'idle') return null

  return (
    <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-center pt-16 px-4">
      <div
        className="w-full max-w-sm p-4 rounded-[var(--radius-lg)] border border-[hsl(var(--accent))]/30 bg-[hsl(var(--surface-1))]/95 backdrop-blur-sm shadow-[var(--shadow-md)] animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label="AI构思搭档"
      >
        {wizardState === 'thinking' && (
          <ThinkingState onClose={onClose} />
        )}

        {wizardState === 'options' && (
          <OptionsState
            options={wizardOptions}
            onSelect={onSelectOption}
            onClose={onClose}
          />
        )}

        {wizardState === 'expanding' && (
          <ExpandingState />
        )}

        {wizardState === 'done' && wizardResult && (
          <DoneState
            result={wizardResult}
            onInsert={() => { onInsertDraft(wizardResult); onClose() }}
            onClose={onClose}
          />
        )}

        {wizardState === 'error' && (
          <ErrorState
            error={wizardError}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

function ThinkingState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-2">
        <span className="w-0.5 h-4 bg-[hsl(var(--accent))] animate-blink" />
        <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">构思搭档思考中…</span>
      </div>
      <p className="text-[12px] text-[hsl(var(--muted))]">AI正在分析世界观和上下文</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-[hsl(var(--muted))]"
      >
        取消
      </Button>
    </div>
  )
}

function OptionsState({
  options,
  onSelect,
  onClose,
}: {
  options: WizardOption[]
  onSelect: (o: WizardOption) => void | Promise<void>
  onClose: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-0.5 h-4 bg-[hsl(var(--accent))]" />
        <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">请选择方向</span>
      </div>
      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => void onSelect(option)}
            className="w-full text-left p-3 rounded-[var(--radius-md)] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--surface-2))] transition-colors animate-slide-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">{option.title}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]">
                {option.type === 'logical' ? '情理之中' : option.type === 'wild' ? '天马行空' : '自定义'}
              </span>
            </div>
            <p className="text-[12px] text-[hsl(var(--muted))] mt-1">{option.description}</p>
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="w-full text-[hsl(var(--muted))] mt-2"
      >
        取消
      </Button>
    </div>
  )
}

function ExpandingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-2">
        <span className="w-0.5 h-4 bg-[hsl(var(--accent))] animate-blink" />
        <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">展开情节…</span>
      </div>
      <p className="text-[12px] text-[hsl(var(--muted))]">正在生成具体建议</p>
    </div>
  )
}

function DoneState({
  result,
  onInsert,
  onClose,
}: {
  result: string
  onInsert: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-0.5 h-4 bg-[hsl(var(--accent))]" />
        <span className="text-[14px] font-medium text-[hsl(var(--foreground))]">情节建议</span>
      </div>
      <div className="p-3 rounded-[var(--radius-md)] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]">
        <p className="text-[13px] text-[hsl(var(--foreground))]/90 leading-relaxed whitespace-pre-wrap">
          {result}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onInsert}
          className="bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent-dim))]"
        >
          插入编辑器
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[hsl(var(--muted))]"
        >
          关闭
        </Button>
      </div>
    </div>
  )
}

function ErrorState({
  error,
  onClose,
}: {
  error: string | null
  onClose: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[hsl(var(--danger))]" />
        <span className="text-[14px] font-medium text-[hsl(var(--danger))]">{error || '发生错误'}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-[hsl(var(--muted))]"
      >
        关闭
      </Button>
    </div>
  )
}
