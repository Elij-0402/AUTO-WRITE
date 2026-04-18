'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'

interface GenerationDrawerProps {
  open: boolean
  onClose: () => void
  onAccept: (content: string) => Promise<void>
  onRegenerate: () => void
  streamingContent: string
  status: GenerationStatus
  error: string | null
  editorRef: React.RefObject<{ insertContent: (content: string) => void } | null>
}

export function GenerationDrawer({
  open,
  onClose,
  onAccept,
  onRegenerate,
  streamingContent,
  status,
  error,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editorRef,
}: GenerationDrawerProps) {
  const [localContent, setLocalContent] = useState(streamingContent)

  // Sync streaming content updates
  useEffect(() => {
    setLocalContent(streamingContent)
  }, [streamingContent])

  const handleAccept = async () => {
    await onAccept(localContent)
  }

  // Split content into paragraphs for rendering
  const paragraphs = localContent.split(/\n\n+/).filter(p => p.trim())

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[360px] sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-base font-medium">AI 章节生成</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Streaming content as paragraphs */}
          {paragraphs.map((para, idx) => (
            <p key={idx} className="text-sm leading-relaxed text-foreground">
              {para}
            </p>
          ))}

          {/* Error state */}
          {status === 'error' && error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Generating indicator */}
          {status === 'generating' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>生成中...</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-border flex gap-2">
          {status === 'complete' && (
            <>
              <button
                onClick={handleAccept}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                采纳
              </button>
              <button
                onClick={onRegenerate}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted"
              >
                重新生成
              </button>
            </>
          )}
          {status === 'generating' && (
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted"
            >
              取消
            </button>
          )}
          {status === 'error' && (
            <button
              onClick={onRegenerate}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              重试
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}