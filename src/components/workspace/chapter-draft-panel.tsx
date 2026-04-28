'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2, PenLine, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePlanning } from '@/lib/hooks/use-planning'
import { useChapterDraftGeneration } from '@/lib/hooks/use-chapter-draft-generation'
import type { AIClientConfig } from '@/lib/ai/client'
import type { WorldEntry } from '@/lib/types/world-entry'
import { cn } from '@/lib/utils'
import {
  buildDraftGenerationSourceSummary,
  buildDraftOutlineFromPlanning,
  normalizeDraftForInsertion,
} from './chapter-draft-context'

export type DraftApplyMode = 'insert' | 'replace' | 'append'

interface WordCountPreset {
  label: string
  value: [number, number]
}

const WORD_COUNT_PRESETS: WordCountPreset[] = [
  { label: '1000-2000字', value: [1000, 2000] },
  { label: '2000-3000字', value: [2000, 3000] },
  { label: '3000-5000字', value: [3000, 5000] },
]

interface ChapterDraftPanelProps {
  projectId: string
  activeChapterId: string | null
  config: AIClientConfig
  worldEntries: WorldEntry[]
  onAcceptDraft: (draft: string, meta: { applyMode: DraftApplyMode; chapterTitle?: string; outline: string }) => void
  onClose?: () => void
  onOpenAIConfig: () => void
}

export function ChapterDraftPanel({
  projectId,
  activeChapterId,
  config,
  worldEntries,
  onAcceptDraft,
  onClose,
  onOpenAIConfig,
}: ChapterDraftPanelProps) {
  const { snapshot } = usePlanning(projectId)
  const [outline, setOutline] = useState('')
  const [chapterTitle, setChapterTitle] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0)
  const [customWordCount, setCustomWordCount] = useState('')
  const [appliedPlanningPrefillKey, setAppliedPlanningPrefillKey] = useState<string | null>(null)
  const [applyMode, setApplyMode] = useState<DraftApplyMode>('insert')

  const linkedChapterPlan = useMemo(
    () => snapshot.chapterPlans.find((plan) => plan.linkedChapterId === activeChapterId) ?? null,
    [activeChapterId, snapshot.chapterPlans]
  )
  const linkedSceneCards = useMemo(
    () => linkedChapterPlan
      ? snapshot.sceneCards.filter((scene) => scene.chapterPlanId === linkedChapterPlan.id)
      : [],
    [linkedChapterPlan, snapshot.sceneCards]
  )
  const sourceSummary = useMemo(
    () => linkedChapterPlan
      ? buildDraftGenerationSourceSummary(linkedChapterPlan, linkedSceneCards)
      : null,
    [linkedChapterPlan, linkedSceneCards]
  )

  const planningPrefillKey = linkedChapterPlan
    ? `${linkedChapterPlan.id}:${linkedChapterPlan.updatedAt}:${linkedSceneCards.length}`
    : null

  if (linkedChapterPlan && planningPrefillKey && planningPrefillKey !== appliedPlanningPrefillKey) {
    setAppliedPlanningPrefillKey(planningPrefillKey)
    setChapterTitle((current) => current || linkedChapterPlan.title)
    setOutline((current) => current || buildDraftOutlineFromPlanning(linkedChapterPlan, linkedSceneCards))

    const targetWordCount = linkedChapterPlan.targetWordCount
    if (targetWordCount) {
      const matchedPreset = WORD_COUNT_PRESETS.findIndex(
        (preset) =>
          targetWordCount >= preset.value[0] &&
          targetWordCount <= preset.value[1]
      )

      if (matchedPreset >= 0) {
        setSelectedPreset(matchedPreset)
      } else {
        setSelectedPreset(null)
        setCustomWordCount((current) => current || `${targetWordCount}-${targetWordCount}`)
      }
    }
  }

  const {
    state,
    draft,
    error,
    progress,
    startGeneration,
    acceptDraft,
    dismissDraft,
    cancelGeneration,
  } = useChapterDraftGeneration({
    projectId,
    config,
    worldEntries,
  })

  const isConfigured = Boolean(config.apiKey?.trim())
  const isGenerating = state === 'generating'
  const isDraftReady = state === 'draft_ready'
  const hasError = Boolean(error)
  const normalizedDraft = draft ? normalizeDraftForInsertion(draft) : ''
  const displayCount = draft?.trim().length ?? 0
  const insertionCount = normalizedDraft.length

  const handleGenerate = async () => {
    if (!outline.trim()) return

    let targetWordCount: [number, number] | undefined
    if (selectedPreset === null && customWordCount) {
      const match = customWordCount.match(/(\d+)[-,](\d+)/)
      if (match) {
        targetWordCount = [parseInt(match[1], 10), parseInt(match[2], 10)]
      }
    } else if (selectedPreset !== null && selectedPreset >= 0) {
      targetWordCount = WORD_COUNT_PRESETS[selectedPreset].value
    }

    await startGeneration({
      chapterId: activeChapterId,
      outline: outline.trim(),
      targetWordCount,
      chapterTitle: chapterTitle.trim() || undefined,
    })
  }

  const handleAccept = () => {
    if (!draft) return
    acceptDraft()
    onAcceptDraft(normalizedDraft, {
      applyMode,
      chapterTitle: chapterTitle.trim() || undefined,
      outline: outline.trim(),
    })
  }

  const handleRegenerate = () => {
    dismissDraft()
    void handleGenerate()
  }

  if (!isConfigured) {
    return (
      <div
        data-testid="draft-panel"
        className="m-3 rounded-[6px] border border-border bg-[hsl(var(--surface-1))] px-4 py-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[13px] font-medium text-foreground">先配置 AI，之后才能生成章节草稿</div>
            <p className="mt-1 text-[12px] leading-[1.6] text-muted-foreground">
              配置完成后会停留在当前起草模式，章节上下文不会丢。
            </p>
          </div>
          <Button size="sm" onClick={onOpenAIConfig}>
            去配置 AI
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="draft-panel" className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold text-foreground">章节草稿</div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              基于当前章节和世界观，先起一版可继续讨论的草稿。
            </p>
          </div>
          {onClose ? (
            <Button variant="ghost" size="sm" onClick={onClose}>
              返回聊天
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="chapter-title">章节标题（可选）</Label>
          <Input
            id="chapter-title"
            placeholder="例如：第一章 觉醒"
            value={chapterTitle}
            onChange={(event) => setChapterTitle(event.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="outline">章节大纲</Label>
          {linkedChapterPlan ? (
            <div className="space-y-1">
              <p className="text-[12px] text-muted-foreground">
                已根据当前章纲和场景卡预填，可继续改写后再生成。
              </p>
              {sourceSummary ? (
                <div className="rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] px-3 py-2 text-[12px] text-muted-foreground">
                  {sourceSummary}
                </div>
              ) : null}
            </div>
          ) : null}
          <Textarea
            id="outline"
            placeholder="描述本章的主要情节、转折点、关键场景..."
            rows={6}
            value={outline}
            onChange={(event) => setOutline(event.target.value)}
            disabled={isGenerating || isDraftReady}
          />
        </div>

        <div className="space-y-1.5">
          <Label>目标字数</Label>
          <div className="flex flex-wrap gap-2">
            {WORD_COUNT_PRESETS.map((preset, index) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSelectedPreset(index)}
                disabled={isGenerating || isDraftReady}
                className={cn(
                  'px-3 py-1.5 rounded-sm text-[13px] border transition-colors',
                  selectedPreset === index
                    ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 text-foreground'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] text-muted-foreground hover:border-[hsl(var(--border-strong))]'
                )}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedPreset(null)}
              disabled={isGenerating || isDraftReady}
              className={cn(
                'px-3 py-1.5 rounded-sm text-[13px] border transition-colors',
                selectedPreset === null
                  ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 text-foreground'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] text-muted-foreground hover:border-[hsl(var(--border-strong))]'
              )}
            >
              自定义
            </button>
          </div>
          {selectedPreset === null ? (
            <Input
              placeholder="输入字数范围，如 2500-3500"
              value={customWordCount}
              onChange={(event) => setCustomWordCount(event.target.value)}
              disabled={isGenerating || isDraftReady}
              className="mt-2"
            />
          ) : null}
        </div>

        {isGenerating ? (
          <div className="rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] px-3 py-2 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{progress || '生成中...'}</span>
            </div>
          </div>
        ) : null}

        {hasError ? (
          <div className="rounded-sm bg-destructive/10 border border-destructive/20 p-3 text-[13px] text-destructive">
            {error}
          </div>
        ) : null}

        {isDraftReady && draft ? (
          <>
            <div className="space-y-2 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-[12px]">插入策略</Label>
                <Select value={applyMode} onValueChange={(value) => setApplyMode(value as DraftApplyMode)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insert">插入到光标处</SelectItem>
                    <SelectItem value="replace">覆盖当前正文</SelectItem>
                    <SelectItem value="append">追加为后续内容</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[12px] text-muted-foreground">
                预览字数 {displayCount} 字，插入正文后 {insertionCount} 字。
                {displayCount !== insertionCount ? ' 插入时会清理首尾空行。' : ''}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>生成的草稿预览</Label>
                <span className="text-[11px] text-muted-foreground">{displayCount} 字</span>
              </div>
              <div className="rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-3">
                <p className="max-h-[280px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-[1.8]">
                  {draft}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="border-t border-border px-4 py-3">
        {isDraftReady ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => { dismissDraft(); onClose?.() }} className="gap-1.5">
              <X className="h-4 w-4" />
              关闭
            </Button>
            <Button variant="outline" onClick={handleRegenerate} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              重新生成
            </Button>
            <Button onClick={handleAccept} className="gap-1.5">
              <Check className="h-4 w-4" />
              插入到正文
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {isGenerating ? (
              <Button variant="ghost" onClick={cancelGeneration}>
                取消
              </Button>
            ) : null}
            <Button
              onClick={() => void handleGenerate()}
              disabled={!outline.trim() || isGenerating}
              className="gap-1.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4" />
                  生成草稿
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
