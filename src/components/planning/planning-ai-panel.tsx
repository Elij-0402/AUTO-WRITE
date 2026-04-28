'use client'

import { useMemo, useState } from 'react'
import { Bot, Check, Lightbulb, ListTree, Loader2, Map as MapIcon, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlanning } from '@/lib/hooks/use-planning'
import { usePlanningAi } from '@/lib/hooks/use-planning-ai'
import { useProjectCharter } from '@/lib/hooks/use-project-charter'
import { useStoryTrackers } from '@/lib/hooks/use-story-trackers'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useChapters } from '@/lib/hooks/use-chapters'
import type { PlanningSelection } from './planning-workbench'
import type {
  PlanningArcDraft,
  PlanningChapterPlanDraft,
  PlanningSceneCardDraft,
  PlanningNextStepDraft,
  PlanningAction,
} from '@/lib/ai/planning-prompts'

interface PlanningAiPanelProps {
  projectId: string
  selection: PlanningSelection | null
  onSelectItem: (selection: PlanningSelection) => void
}

export function PlanningAiPanel({
  projectId,
  selection,
  onSelectItem,
}: PlanningAiPanelProps) {
  const { snapshot, createStoryArc, createChapterPlan, createSceneCard } = usePlanning(projectId)
  const { charter } = useProjectCharter(projectId)
  const { trackers } = useStoryTrackers(projectId)
  const { entries } = useWorldEntries(projectId)
  const { chapters } = useChapters(projectId)
  const { loading, error, runningAction, result, runAction, dismissResult } = usePlanningAi()
  const [applyError, setApplyError] = useState<string | null>(null)

  const selectedIdea = selection?.kind === 'idea'
    ? snapshot.ideaNotes.find((item) => item.id === selection.id) ?? null
    : null
  const selectedArc = selection?.kind === 'arc'
    ? snapshot.storyArcs.find((item) => item.id === selection.id) ?? null
    : null
  const selectedChapterPlan = selection?.kind === 'chapter'
    ? snapshot.chapterPlans.find((item) => item.id === selection.id) ?? null
    : null

  const latestIdea = useMemo(() => {
    return [...snapshot.ideaNotes].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
  }, [snapshot.ideaNotes])

  const progress = useMemo(() => ({
    totalChapters: chapters.length,
    linkedChapterPlans: snapshot.chapterPlans.filter((plan) => plan.linkedChapterId).length,
    unlinkedChapterPlans: snapshot.chapterPlans.filter((plan) => !plan.linkedChapterId).length,
    pendingSceneChapterPlans: snapshot.chapterPlans.filter(
      (plan) => snapshot.sceneCards.every((scene) => scene.chapterPlanId !== plan.id)
    ).length,
  }), [chapters.length, snapshot.chapterPlans, snapshot.sceneCards])

  const canGenerateArc = snapshot.ideaNotes.length > 0 && (!selection || selection.kind === 'idea')
  const canGenerateChapterPlan = !!selectedArc
  const canGenerateSceneCards = !!selectedChapterPlan

  const handleRun = async (action: PlanningAction) => {
    setApplyError(null)
    const focusIdea = selectedIdea ?? latestIdea ?? undefined

    await runAction(action, {
      charter,
      worldEntries: entries ?? [],
      storyTrackers: trackers,
      planningSnapshot: snapshot,
      focusIdea,
      focusArc: selectedArc ?? undefined,
      focusChapterPlan: selectedChapterPlan ?? undefined,
      currentProgress: progress,
      focusIdeaId: focusIdea?.id,
      focusArcId: selectedArc?.id,
      focusChapterPlanId: selectedChapterPlan?.id,
    })
  }

  const handleApply = async () => {
    if (!result) return
    setApplyError(null)

    try {
      if (result.action === 'generate_arc') {
        const order = nextOrder(snapshot.storyArcs.map((item) => item.order))
        const created = await createStoryArc({
          ...result.data.item,
          order,
          sourceIdeaIds: selectedIdea ? [selectedIdea.id] : latestIdea ? [latestIdea.id] : [],
        })
        onSelectItem({ kind: 'arc', id: created.id })
      } else if (result.action === 'generate_chapter_plan' && selectedArc) {
        const startOrder = nextOrder(
          snapshot.chapterPlans
            .filter((item) => item.arcId === selectedArc.id)
            .map((item) => item.order)
        )

        let nextSelectionId: string | null = null
        for (const [index, item] of result.data.items.entries()) {
          const created = await createChapterPlan({
            ...item,
            arcId: selectedArc.id,
            order: startOrder + index,
            targetWordCount: item.targetWordCount ?? null,
          })
          nextSelectionId = nextSelectionId ?? created?.id ?? null
        }

        if (nextSelectionId) {
          onSelectItem({ kind: 'chapter', id: nextSelectionId })
        }
      } else if (result.action === 'generate_scene_cards' && selectedChapterPlan) {
        const startOrder = nextOrder(
          snapshot.sceneCards
            .filter((item) => item.chapterPlanId === selectedChapterPlan.id)
            .map((item) => item.order)
        )

        let nextSelectionId: string | null = null
        for (const [index, item] of result.data.items.entries()) {
          const created = await createSceneCard({
            ...item,
            chapterPlanId: selectedChapterPlan.id,
            order: startOrder + index,
          })
          nextSelectionId = nextSelectionId ?? created?.id ?? null
        }

        if (nextSelectionId) {
          onSelectItem({ kind: 'scene', id: nextSelectionId })
        }
      } else if (result.action === 'suggest_next_step') {
        const target = resolveSuggestionTarget(result.data.item, snapshot)
        if (target) {
          onSelectItem(target)
        }
      }

      dismissResult()
    } catch (applyRunError) {
      setApplyError(applyRunError instanceof Error ? applyRunError.message : '应用结果失败')
    }
  }

  const primaryActionLabel = result?.action === 'suggest_next_step' ? '定位建议' : '应用结果'

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col divider-hair-v surface-1">
      <div className="px-4 py-3 divider-hair">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4 text-primary" />
          <span>规划动作</span>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          先生成预览，再确认写入规划对象。
        </p>
      </div>

      <div className="px-4 py-3 divider-hair">
        <div className="grid grid-cols-1 gap-2">
          <ActionButton
            icon={Lightbulb}
            label="基于灵感生成卷纲"
            disabled={!canGenerateArc || loading}
            loading={runningAction === 'generate_arc'}
            onClick={() => { void handleRun('generate_arc') }}
          />
          <ActionButton
            icon={MapIcon}
            label="基于卷纲生成章纲"
            disabled={!canGenerateChapterPlan || loading}
            loading={runningAction === 'generate_chapter_plan'}
            onClick={() => { void handleRun('generate_chapter_plan') }}
          />
          <ActionButton
            icon={ListTree}
            label="基于章纲拆解场景卡"
            disabled={!canGenerateSceneCards || loading}
            loading={runningAction === 'generate_scene_cards'}
            onClick={() => { void handleRun('generate_scene_cards') }}
          />
          <ActionButton
            icon={Sparkles}
            label="推荐下一步"
            disabled={loading}
            loading={runningAction === 'suggest_next_step'}
            onClick={() => { void handleRun('suggest_next_step') }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error ? (
          <StatusMessage tone="error" message={error} />
        ) : applyError ? (
          <StatusMessage tone="error" message={applyError} />
        ) : loading ? (
          <StatusMessage tone="loading" message="正在生成规划建议..." />
        ) : result ? (
          <PlanningResultPreview result={result} />
        ) : (
          <div className="text-[12px] text-muted-foreground leading-6">
            选择一个规划对象，然后让 AI 帮你补齐下一层结构。
          </div>
        )}
      </div>

      {result ? (
        <div className="flex gap-2 px-4 py-3 divider-hair">
          <Button type="button" variant="outline" className="flex-1" onClick={dismissResult}>
            <X className="h-4 w-4" />
            关闭预览
          </Button>
          <Button type="button" className="flex-1" onClick={() => { void handleApply() }}>
            <Check className="h-4 w-4" />
            {primaryActionLabel}
          </Button>
        </div>
      ) : null}
    </aside>
  )
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  loading,
  onClick,
}: {
  icon: typeof Bot
  label: string
  disabled: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" className="justify-start" disabled={disabled} onClick={onClick}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </Button>
  )
}

function StatusMessage({ tone, message }: { tone: 'error' | 'loading'; message: string }) {
  return (
    <div className={tone === 'error' ? 'text-[12px] text-destructive leading-6' : 'flex items-center gap-2 text-[12px] text-muted-foreground'}>
      {tone === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      <span>{message}</span>
    </div>
  )
}

function PlanningResultPreview({
  result,
}: {
  result: ReturnType<typeof usePlanningAi>['result']
}) {
  if (!result) return null

  if (result.action === 'generate_arc') {
    return <ArcPreview item={result.data.item} />
  }

  if (result.action === 'generate_chapter_plan') {
    return <ChapterPlanPreview items={result.data.items} />
  }

  if (result.action === 'generate_scene_cards') {
    return <SceneCardPreview items={result.data.items} />
  }

  return <NextStepPreview item={result.data.item} />
}

function ArcPreview({ item }: { item: PlanningArcDraft }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{item.title}</h3>
      <PreviewField label="卷纲前提" value={item.premise} />
      <PreviewField label="阶段目标" value={item.objective} />
      <PreviewField label="核心冲突" value={item.conflict} />
      <PreviewField label="阶段兑现" value={item.payoff} />
    </div>
  )
}

function ChapterPlanPreview({ items }: { items: PlanningChapterPlanDraft[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="space-y-2 pb-3 divider-hair">
          <h3 className="text-sm font-medium">{item.title}</h3>
          <PreviewField label="摘要" value={item.summary} />
          <PreviewField label="目标" value={item.chapterGoal} />
          <PreviewField label="冲突" value={item.conflict} />
          <PreviewField label="转折" value={item.turn} />
          <PreviewField label="揭示" value={item.reveal} />
        </div>
      ))}
    </div>
  )
}

function SceneCardPreview({ items }: { items: PlanningSceneCardDraft[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="space-y-2 pb-3 divider-hair">
          <h3 className="text-sm font-medium">{item.title}</h3>
          <PreviewField label="视角人物" value={item.viewpoint} />
          <PreviewField label="场景地点" value={item.location} />
          <PreviewField label="目标" value={item.objective} />
          <PreviewField label="阻碍" value={item.obstacle} />
          <PreviewField label="结果" value={item.outcome} />
          <PreviewField label="连续性提醒" value={item.continuityNotes} />
        </div>
      ))}
    </div>
  )
}

function NextStepPreview({ item }: { item: PlanningNextStepDraft }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">下一步建议</h3>
      <PreviewField label="建议" value={item.summary} />
      <PreviewField label="原因" value={item.reason} />
      {item.targetTitle ? <PreviewField label="建议定位" value={item.targetTitle} /> : null}
    </div>
  )
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="text-[13px] leading-6 text-foreground/85">{value || '(待补充)'}</div>
    </div>
  )
}

function nextOrder(orders: number[]): number {
  if (orders.length === 0) return 1
  return Math.max(...orders) + 1
}

function resolveSuggestionTarget(
  item: PlanningNextStepDraft,
  snapshot: ReturnType<typeof usePlanning>['snapshot']
): PlanningSelection | null {
  if (!item.targetKind || !item.targetTitle) return null

  switch (item.targetKind) {
    case 'idea': {
      const match = snapshot.ideaNotes.find((row) => row.title === item.targetTitle)
      return match ? { kind: 'idea', id: match.id } : null
    }
    case 'arc': {
      const match = snapshot.storyArcs.find((row) => row.title === item.targetTitle)
      return match ? { kind: 'arc', id: match.id } : null
    }
    case 'chapter': {
      const match = snapshot.chapterPlans.find((row) => row.title === item.targetTitle)
      return match ? { kind: 'chapter', id: match.id } : null
    }
    case 'scene': {
      const match = snapshot.sceneCards.find((row) => row.title === item.targetTitle)
      return match ? { kind: 'scene', id: match.id } : null
    }
    default:
      return null
  }
}
