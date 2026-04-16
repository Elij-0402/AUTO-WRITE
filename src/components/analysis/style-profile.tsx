'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '@/lib/db/project-db'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useAIConfig } from '@/lib/hooks/use-ai-config'
import { streamChat } from '@/lib/ai/client'
import { extractPlainText, contentHash } from '@/lib/analysis/content-hash'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface StyleProfileProps {
  projectId: string
}

const STYLE_PROMPT = `你是一位中文网文文本分析师。阅读作者的草稿节选并输出简明的「文风指纹」。

请从以下维度分析（每项 1-2 句）：
1. 句长节奏：平均句长、长短句分布给人的感觉
2. 叙述视角：第几人称、聚焦模式
3. 情感基调：整体冷/暖/张/弛
4. 修辞偏好：是否多用比喻/白描/排比/环境烘托
5. 对白比重：对白密度与对白风格
6. 独特标签：3-5 条能快速识别这位作者的关键特征

使用简体中文，不要使用 Markdown 标题，用序号列表即可，语气客观。`

export function StyleProfile({ projectId }: StyleProfileProps) {
  const { chapters } = useChapters(projectId)
  const { config } = useAIConfig(projectId)
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const chapterTexts = useMemo(() => {
    return chapters
      .filter(c => !c.deletedAt)
      .sort((a, b) => a.order - b.order)
      .map(c => extractPlainText(c.content))
      .filter(Boolean)
  }, [chapters])

  const currentHash = useMemo(() => contentHash(chapterTexts), [chapterTexts])

  const cached = useLiveQuery(
    () =>
      db.analyses
        .where({ kind: 'style-profile' })
        .first(),
    [db]
  )

  const [loading, setLoading] = useState(false)
  const [streamed, setStreamed] = useState('')
  const [error, setError] = useState<string | null>(null)

  const staleness =
    !cached ? 'none' : cached.invalidationKey === currentHash ? 'fresh' : 'stale'

  const displayResult = loading
    ? streamed
    : cached && typeof cached.result === 'string'
      ? cached.result
      : ''

  const generate = useCallback(async () => {
    if (!config.apiKey) {
      setError('请先在 AI 设置中配置 API Key')
      return
    }
    if (chapterTexts.length === 0) {
      setError('暂无章节内容可供分析')
      return
    }

    setLoading(true)
    setError(null)
    setStreamed('')

    // Cap input to keep a single-shot analysis cheap: take the first ~6000
    // characters across chapters, concatenated.
    const joined = chapterTexts.join('\n\n').slice(0, 6000)
    const segmentedSystem = {
      baseInstruction: STYLE_PROMPT,
      worldBibleContext: '',
      runtimeContext: '',
    }

    try {
      const events = streamChat(
        {
          provider: config.provider,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        },
        {
          segmentedSystem,
          messages: [{ role: 'user', content: `以下是草稿节选：\n\n${joined}` }],
        }
      )

      let full = ''
      for await (const event of events) {
        if (event.type === 'text_delta') {
          full += event.delta
          setStreamed(full)
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      await db.analyses.put({
        id: `style-profile`,
        projectId,
        kind: 'style-profile',
        invalidationKey: currentHash,
        result: full,
        createdAt: new Date(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }, [config, chapterTexts, currentHash, db, projectId])

  // Auto-clear streamed buffer after caching.
  useEffect(() => {
    if (!loading) setStreamed('')
  }, [loading])

  if (chapterTexts.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <p className="text-sm font-medium mb-1">暂无章节内容</p>
        <p className="text-xs text-muted-foreground">写入一些章节后即可生成文风分析。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">文风指纹</p>
          <p className="text-xs text-muted-foreground">
            {staleness === 'fresh' && '已是最新分析'}
            {staleness === 'stale' && '章节已更新，建议重新生成'}
            {staleness === 'none' && '尚未生成分析'}
          </p>
        </div>
        <Button size="sm" onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              分析中...
            </>
          ) : staleness === 'none' ? (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              生成分析
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              重新生成
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {displayResult ? (
        <div className="border rounded-md p-4 whitespace-pre-wrap text-sm leading-relaxed">
          {displayResult}
        </div>
      ) : !loading ? (
        <div className="border rounded-md p-8 text-center text-sm text-muted-foreground">
          点击「生成分析」让 AI 读取你的草稿节选并输出文风指纹。
        </div>
      ) : null}
    </div>
  )
}
