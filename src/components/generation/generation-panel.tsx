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
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 text-sm">
          {status === 'generating' && (
            <>
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="font-medium">章节生成中...</span>
            </>
          )}
          {status === 'complete' && (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">生成完成</span>
            </>
          )}
          {status === 'idle' && (
            <span className="text-muted-foreground">章节生成</span>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium">生成失败</span>
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
            <Button size="sm" variant="outline" onClick={cancelGeneration}>
              取消
            </Button>
          )}
          {(status === 'complete' || status === 'error') && (
            <Button size="sm" variant="outline" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent
        ref={contentRef}
        className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto"
      >
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Lightbulb className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">点击"开始生成"基于大纲创作章节</p>
          </div>
        )}

        {status === 'generating' && (
          <div className="max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">
              {streamingContent}
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
            </p>
          </div>
        )}

        {status === 'complete' && (
          <div className="max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">
              {streamingContent}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-[200px] text-destructive">
            <AlertCircle className="h-10 w-10 mb-3 opacity-70" />
            <p className="text-sm mb-3">{error}</p>
            <Button size="sm" variant="destructive" onClick={handleRetry}>
              重试
            </Button>
          </div>
        )}
      </CardContent>

      {status === 'complete' && (
        <CardFooter className="p-3 border-t justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>
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
