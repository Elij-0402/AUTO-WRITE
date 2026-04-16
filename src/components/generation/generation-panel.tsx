'use client'

import { useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react'
import { useChapterGeneration } from '@/lib/hooks/use-chapter-generation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'

interface GenerationPanelProps {
  projectId: string
  chapterId: string
  onClose?: () => void
}

export function GenerationPanel({ projectId, chapterId, onClose }: GenerationPanelProps) {
  const {
    status,
    streamingContent,
    error,
    startGeneration,
    cancelGeneration,
    acceptContent,
    resetGeneration,
  } = useChapterGeneration(projectId, chapterId)

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [streamingContent])

  const handleAccept = async () => {
    const result = await acceptContent()
    if (result.success && onClose) {
      onClose()
    }
  }

  const handleRetry = () => {
    resetGeneration()
    startGeneration()
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 divider-hair flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.15em]">
          {status === 'generating' && (
            <>
              <Loader2 className="h-3.5 w-3.5 text-[hsl(var(--accent-amber))] animate-spin" />
              <span className="text-foreground">章节生成中…</span>
            </>
          )}
          {status === 'complete' && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--accent-jade))]" />
              <span className="text-foreground">生成完成</span>
            </>
          )}
          {status === 'idle' && (
            <span className="text-muted-foreground">章节生成</span>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--accent-coral))]" />
              <span className="text-[hsl(var(--accent-coral))]">生成失败</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <Button size="sm" onClick={startGeneration}>
              开始生成
            </Button>
          )}
          {status === 'generating' && (
            <Button size="sm" variant="subtle" onClick={cancelGeneration}>
              取消
            </Button>
          )}
          {(status === 'complete' || status === 'error') && (
            <Button size="sm" variant="subtle" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent
        ref={contentRef}
        className="p-5 min-h-[220px] max-h-[420px] overflow-y-auto"
      >
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground bg-amber-vignette">
            <Lightbulb className="h-10 w-10 mb-3 text-[hsl(var(--accent-amber))]/40" strokeWidth={1.5} />
            <p className="text-[13px]">点击&ldquo;开始生成&rdquo;基于大纲创作章节</p>
          </div>
        )}

        {status === 'generating' && (
          <div className="max-w-none">
            <p className="whitespace-pre-wrap leading-[1.9] text-[14px] text-foreground/95">
              {streamingContent}
              <span className="inline-block w-[2px] h-[1.1em] ml-1 align-middle bg-[hsl(var(--accent-amber))] animate-caret" />
            </p>
          </div>
        )}

        {status === 'complete' && (
          <div className="max-w-none">
            <p className="whitespace-pre-wrap leading-[1.9] text-[14px] text-foreground/95">
              {streamingContent}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <AlertCircle className="h-10 w-10 mb-3 text-[hsl(var(--accent-coral))]/70" />
            <p className="text-[13px] mb-3 text-[hsl(var(--accent-coral))]">{error}</p>
            <Button size="sm" variant="destructive" onClick={handleRetry}>
              重试
            </Button>
          </div>
        )}
      </CardContent>

      {status === 'complete' && (
        <CardFooter className="p-3 divider-hair justify-end gap-2">
          <Button size="sm" variant="subtle" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleAccept}>
            采纳到编辑器
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
