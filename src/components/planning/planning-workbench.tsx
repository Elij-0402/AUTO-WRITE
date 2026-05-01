'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { usePlanning } from '@/lib/hooks/use-planning'
import { useChapters } from '@/lib/hooks/use-chapters'
import { useAutoSave } from '@/lib/hooks/use-autosave'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PlanningAiPanel } from './planning-ai-panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PlanningSelection, SceneCard, SceneCardStatus } from '@/lib/types'

export type { PlanningSelection } from '@/lib/types'

interface PlanningWorkbenchProps {
  projectId: string
  selection: PlanningSelection | null
  onSelectItem?: (selection: PlanningSelection) => void
  onOpenLinkedChapter?: (chapterId: string) => void
}

function ContextMeta({ items }: { items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-6 py-3 divider-hair text-[12px] text-muted-foreground">
      {items.map((item) => (
        <span key={item} className="rounded-sm border border-[hsl(var(--border))] px-2 py-1">
          {item}
        </span>
      ))}
    </div>
  )
}

export function PlanningWorkbench({ projectId, selection, onSelectItem, onOpenLinkedChapter }: PlanningWorkbenchProps) {
  const {
    snapshot,
    createSceneCard,
    deleteSceneCard,
    reorderSceneCards,
    updateIdeaNote,
    updateStoryArc,
    updateChapterPlan,
    updateSceneCard,
  } = usePlanning(projectId)
  const { chapters, addChapter } = useChapters(projectId)

  const selectedIdea = selection?.kind === 'idea'
    ? snapshot.ideaNotes.find((item) => item.id === selection.id)
    : null
  const selectedArc = selection?.kind === 'arc'
    ? snapshot.storyArcs.find((item) => item.id === selection.id)
    : null
  const selectedChapterPlan = selection?.kind === 'chapter'
    ? snapshot.chapterPlans.find((item) => item.id === selection.id)
    : null
  const selectedArcChapterPlans = selectedArc
    ? snapshot.chapterPlans.filter((item) => item.arcId === selectedArc.id)
    : []
  const selectedChapterScenes = selectedChapterPlan
    ? snapshot.sceneCards.filter((item) => item.chapterPlanId === selectedChapterPlan.id)
    : []
  const parentArc = selectedChapterPlan
    ? snapshot.storyArcs.find((item) => item.id === selectedChapterPlan.arcId)
    : null

  const [title, setTitle] = useState(
    selectedIdea?.title ?? selectedArc?.title ?? selectedChapterPlan?.title ?? ''
  )
  const [premise, setPremise] = useState(selectedIdea?.premise ?? selectedArc?.premise ?? '')
  const [moodKeywords, setMoodKeywords] = useState(selectedIdea?.moodKeywords.join('、') ?? '')
  const [objective, setObjective] = useState(selectedArc?.objective ?? '')
  const [conflict, setConflict] = useState(selectedArc?.conflict ?? selectedChapterPlan?.conflict ?? '')
  const [payoff, setPayoff] = useState(selectedArc?.payoff ?? '')
  const [summary, setSummary] = useState(selectedChapterPlan?.summary ?? '')
  const [chapterGoal, setChapterGoal] = useState(selectedChapterPlan?.chapterGoal ?? '')
  const [turn, setTurn] = useState(selectedChapterPlan?.turn ?? '')
  const [reveal, setReveal] = useState(selectedChapterPlan?.reveal ?? '')
  const [linkedChapterId, setLinkedChapterId] = useState(selectedChapterPlan?.linkedChapterId ?? 'unlinked')
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null)
  const latestValuesRef = useRef({
    title,
    premise,
    moodKeywords,
    objective,
    conflict,
    payoff,
    summary,
    chapterGoal,
    turn,
    reveal,
    linkedChapterId,
  })
  const draftValues = {
    title,
    premise,
    moodKeywords: moodKeywords
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean),
  }

  const selectionVersion = selection
    ? [
        selection.kind,
        selection.id,
        selectedIdea?.updatedAt,
        selectedArc?.updatedAt,
        selectedChapterPlan?.updatedAt,
        selectedChapterPlan?.linkedChapterId,
        selection?.focusSceneId,
      ].join(':')
    : 'none'
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (selectedIdea) {
      setTitle(selectedIdea.title)
      setPremise(selectedIdea.premise)
      setMoodKeywords(selectedIdea.moodKeywords.join('、'))
      latestValuesRef.current = {
        ...latestValuesRef.current,
        title: selectedIdea.title,
        premise: selectedIdea.premise,
        moodKeywords: selectedIdea.moodKeywords.join('、'),
      }
      return
    }

    if (selectedArc) {
      setTitle(selectedArc.title)
      setPremise(selectedArc.premise)
      setObjective(selectedArc.objective)
      setConflict(selectedArc.conflict)
      setPayoff(selectedArc.payoff)
      latestValuesRef.current = {
        ...latestValuesRef.current,
        title: selectedArc.title,
        premise: selectedArc.premise,
        objective: selectedArc.objective,
        conflict: selectedArc.conflict,
        payoff: selectedArc.payoff,
      }
      return
    }

    if (selectedChapterPlan) {
      setTitle(selectedChapterPlan.title)
      setSummary(selectedChapterPlan.summary)
      setChapterGoal(selectedChapterPlan.chapterGoal)
      setConflict(selectedChapterPlan.conflict)
      setTurn(selectedChapterPlan.turn)
      setReveal(selectedChapterPlan.reveal)
      setLinkedChapterId(selectedChapterPlan.linkedChapterId ?? 'unlinked')
      setExpandedSceneId((current) => {
        if (selection?.focusSceneId && selectedChapterScenes.some((item) => item.id === selection.focusSceneId)) {
          return selection.focusSceneId
        }

        if (current && selectedChapterScenes.some((item) => item.id === current)) {
          return current
        }

        return selectedChapterScenes[0]?.id ?? null
      })
      latestValuesRef.current = {
        ...latestValuesRef.current,
        title: selectedChapterPlan.title,
        summary: selectedChapterPlan.summary,
        chapterGoal: selectedChapterPlan.chapterGoal,
        conflict: selectedChapterPlan.conflict,
        turn: selectedChapterPlan.turn,
        reveal: selectedChapterPlan.reveal,
        linkedChapterId: selectedChapterPlan.linkedChapterId ?? 'unlinked',
      }
    }
  }, [selectionVersion, selectedChapterScenes])
  /* eslint-enable react-hooks/exhaustive-deps */

  const { isSaving } = useAutoSave(
    async () => {
      if (!selectedIdea) return
      await updateIdeaNote(selectedIdea.id, {
        ...draftValues,
      })
    },
    [selectedIdea?.id, title, premise, moodKeywords],
    500
  )

  const { isSaving: isArcSaving } = useAutoSave(
    async () => {
      if (!selectedArc) return
      await updateStoryArc(selectedArc.id, {
        title,
        premise,
        objective,
        conflict,
        payoff,
      })
    },
    [selectedArc?.id, title, premise, objective, conflict, payoff],
    500
  )

  const { isSaving: isChapterSaving } = useAutoSave(
    async () => {
      if (!selectedChapterPlan) return
      await updateChapterPlan(selectedChapterPlan.id, {
        title,
        summary,
        chapterGoal,
        conflict,
        turn,
        reveal,
        linkedChapterId: linkedChapterId === 'unlinked' ? null : linkedChapterId,
      })
    },
    [selectedChapterPlan?.id, title, summary, chapterGoal, conflict, turn, reveal, linkedChapterId],
    500
  )

  const renderWithPanel = (content: ReactNode) => (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {content}
      </div>
      <PlanningAiPanel
        key={selection ? `${selection.kind}:${selection.id}` : 'none'}
        projectId={projectId}
        selection={selection}
        onSelectItem={onSelectItem ?? (() => undefined)}
      />
    </div>
  )

  if (!selection) {
    return renderWithPanel(
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <h2 className="font-display text-[36px] text-foreground/85">开始规划长篇</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          从左侧选择一条灵感、卷纲或章纲，逐步把这本书的骨架搭起来。
        </p>
      </div>
    )
  }

  if (selection.kind === 'idea' && selectedIdea) {
    return renderWithPanel(
      <>
        <div className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm font-medium">灵感卡</span>
          <span className="text-xs text-muted-foreground">{isSaving ? '保存中...' : '已保存'}</span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label htmlFor="planning-title" className="text-sm">标题</label>
            <Input
              id="planning-title"
              value={title}
              onChange={(e) => {
                latestValuesRef.current.title = e.target.value
                setTitle(e.target.value)
              }}
              onBlur={(e) => {
                void updateIdeaNote(selectedIdea.id, {
                  title: e.currentTarget.value,
                  premise: latestValuesRef.current.premise,
                  moodKeywords: latestValuesRef.current.moodKeywords
                    .split(/[、,，]/)
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="planning-premise" className="text-sm">核心设想</label>
            <Textarea
              id="planning-premise"
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="这条灵感到底在讲什么？"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="planning-mood" className="text-sm">情绪关键词</label>
            <Input
              id="planning-mood"
              value={moodKeywords}
              onChange={(e) => setMoodKeywords(e.target.value)}
              placeholder="压抑、宿命、宫廷"
            />
          </div>
        </div>
      </>
    )
  }

  if (selection.kind === 'arc' && selectedArc) {
    return renderWithPanel(
      <>
        <div className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm font-medium">卷纲卡</span>
          <span className="text-xs text-muted-foreground">{isArcSaving ? '保存中...' : '已保存'}</span>
        </div>
        <ContextMeta items={[`下挂 ${selectedArcChapterPlans.length} 章`]} />

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label htmlFor="arc-title" className="text-sm">卷纲标题</label>
            <Input
              id="arc-title"
              value={title}
              onChange={(e) => {
                latestValuesRef.current.title = e.target.value
                setTitle(e.target.value)
              }}
              onBlur={(e) => {
                void updateStoryArc(selectedArc.id, {
                  title: e.currentTarget.value,
                  premise: latestValuesRef.current.premise,
                  objective: latestValuesRef.current.objective,
                  conflict: latestValuesRef.current.conflict,
                  payoff: latestValuesRef.current.payoff,
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="arc-premise" className="text-sm">卷纲前提</label>
            <Textarea id="arc-premise" value={premise} onChange={(e) => setPremise(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="arc-objective" className="text-sm">阶段目标</label>
            <Textarea id="arc-objective" value={objective} onChange={(e) => setObjective(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="arc-conflict" className="text-sm">核心冲突</label>
            <Textarea id="arc-conflict" value={conflict} onChange={(e) => setConflict(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="arc-payoff" className="text-sm">阶段兑现</label>
            <Textarea id="arc-payoff" value={payoff} onChange={(e) => setPayoff(e.target.value)} />
          </div>
        </div>
      </>
    )
  }

  if (selection.kind === 'chapter' && selectedChapterPlan) {
    const handleLinkedChapterChange = (value: string) => {
      setLinkedChapterId(value)
      void updateChapterPlan(selectedChapterPlan.id, {
        title,
        summary,
        chapterGoal,
        conflict,
        turn,
        reveal,
        linkedChapterId: value === 'unlinked' ? null : value,
      })
    }

    const handleCreateAndBindChapter = async () => {
      const newChapterId = await addChapter(title.trim() || `第 ${selectedChapterPlan.order} 章`)
      setLinkedChapterId(newChapterId)
      await updateChapterPlan(selectedChapterPlan.id, {
        title,
        summary,
        chapterGoal,
        conflict,
        turn,
        reveal,
        linkedChapterId: newChapterId,
      })
      onOpenLinkedChapter?.(newChapterId)
    }

    const handleCreateSceneCard = async () => {
      const created = await createSceneCard({
        chapterPlanId: selectedChapterPlan.id,
        title: `场景 ${selectedChapterScenes.length + 1}`,
      })
      setExpandedSceneId(created.id)
    }

    const handleSceneMove = async (sceneId: string, direction: 'up' | 'down') => {
      const currentIndex = selectedChapterScenes.findIndex((item) => item.id === sceneId)
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selectedChapterScenes.length) return

      const orderedIds = selectedChapterScenes.map((item) => item.id)
      ;[orderedIds[currentIndex], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[currentIndex]]
      await reorderSceneCards(selectedChapterPlan.id, orderedIds)
    }

    const handleSceneDelete = async (sceneId: string) => {
      await deleteSceneCard(sceneId)
      if (expandedSceneId === sceneId) {
        const remaining = selectedChapterScenes.filter((item) => item.id !== sceneId)
        setExpandedSceneId(remaining[0]?.id ?? null)
      }
    }

    return renderWithPanel(
      <>
        <div className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm font-medium">章纲卡</span>
          <span className="text-xs text-muted-foreground">{isChapterSaving ? '保存中...' : '已保存'}</span>
        </div>
        <ContextMeta
          items={[
            parentArc ? `所属卷纲：${parentArc.title}` : '所属卷纲：未绑定',
            selectedChapterScenes.length > 0
              ? `场景拆解：${selectedChapterScenes.length} 张场景卡，已具备起草骨架`
              : '场景拆解：尚未开始，建议先补齐可执行场景卡',
          ]}
        />

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label htmlFor="chapter-title" className="text-sm">章纲标题</label>
            <Input
              id="chapter-title"
              value={title}
              onChange={(e) => {
                latestValuesRef.current.title = e.target.value
                setTitle(e.target.value)
              }}
              onBlur={(e) => {
                void updateChapterPlan(selectedChapterPlan.id, {
                  title: e.currentTarget.value,
                  summary: latestValuesRef.current.summary,
                  chapterGoal: latestValuesRef.current.chapterGoal,
                  conflict: latestValuesRef.current.conflict,
                  turn: latestValuesRef.current.turn,
                  reveal: latestValuesRef.current.reveal,
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="chapter-link" className="text-sm">绑定章节</label>
            <div className="flex gap-2">
              <Select aria-label="绑定章节" value={linkedChapterId} onValueChange={handleLinkedChapterChange}>
                <SelectTrigger id="chapter-link">
                  <SelectValue placeholder="选择章节" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlinked">未绑定</SelectItem>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => { void handleCreateAndBindChapter() }}>
                新建并绑定
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="chapter-summary" className="text-sm">章节摘要</label>
            <Textarea id="chapter-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="chapter-goal" className="text-sm">章节目标</label>
            <Textarea id="chapter-goal" value={chapterGoal} onChange={(e) => setChapterGoal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="chapter-conflict" className="text-sm">章节冲突</label>
            <Textarea id="chapter-conflict" value={conflict} onChange={(e) => setConflict(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="chapter-turn" className="text-sm">转折</label>
            <Textarea id="chapter-turn" value={turn} onChange={(e) => setTurn(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="chapter-reveal" className="text-sm">揭示</label>
            <Textarea id="chapter-reveal" value={reveal} onChange={(e) => setReveal(e.target.value)} />
          </div>
          <section className="space-y-3 rounded-sm border border-[hsl(var(--border))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">场景卡拆解</h3>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                  {selectedChapterScenes.length > 0
                    ? `当前章纲已拆出 ${selectedChapterScenes.length} 张场景卡，起草时会按当前顺序拼接场景上下文。`
                    : '还没有场景卡。先拆出 1-3 个关键场景，再进入章节起草会更稳。'}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => { void handleCreateSceneCard() }}>
                <Plus className="h-4 w-4" />
                新建场景卡
              </Button>
            </div>

            {selectedChapterScenes.length === 0 ? (
              <div className="rounded-sm border border-dashed border-[hsl(var(--border))] px-4 py-5 text-[13px] text-muted-foreground">
                暂无场景卡，先补一个开场场景，把视角、目标和结果定下来。
              </div>
            ) : (
              <div className="space-y-3">
                {selectedChapterScenes.map((scene, index) => (
                  <SceneCardEditor
                    key={scene.id}
                    scene={scene}
                    expanded={expandedSceneId === scene.id}
                    isFirst={index === 0}
                    isLast={index === selectedChapterScenes.length - 1}
                    onToggle={() => setExpandedSceneId((current) => current === scene.id ? null : scene.id)}
                    onMoveUp={() => { void handleSceneMove(scene.id, 'up') }}
                    onMoveDown={() => { void handleSceneMove(scene.id, 'down') }}
                    onDelete={() => { void handleSceneDelete(scene.id) }}
                    onUpdate={(fields) => updateSceneCard(scene.id, fields)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </>
    )
  }

  return renderWithPanel(
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <h2 className="font-display text-[28px] text-foreground/85">规划对象未找到</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        当前选中的规划对象可能已被删除，请从左侧重新选择。
      </p>
    </div>
  )
}

function SceneCardEditor({
  scene,
  expanded,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate,
}: {
  scene: SceneCard
  expanded: boolean
  isFirst: boolean
  isLast: boolean
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onUpdate: (fields: Partial<Omit<SceneCard, 'id' | 'projectId' | 'chapterPlanId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>) => Promise<void>
}) {
  const [title, setTitle] = useState(scene.title)
  const [viewpoint, setViewpoint] = useState(scene.viewpoint)
  const [location, setLocation] = useState(scene.location)
  const [objective, setObjective] = useState(scene.objective)
  const [obstacle, setObstacle] = useState(scene.obstacle)
  const [outcome, setOutcome] = useState(scene.outcome)
  const [continuityNotes, setContinuityNotes] = useState(scene.continuityNotes)
  const [status, setStatus] = useState<SceneCardStatus>(scene.status)

  useEffect(() => {
    setTitle(scene.title)
    setViewpoint(scene.viewpoint)
    setLocation(scene.location)
    setObjective(scene.objective)
    setObstacle(scene.obstacle)
    setOutcome(scene.outcome)
    setContinuityNotes(scene.continuityNotes)
    setStatus(scene.status)
  }, [scene])

  const fields = {
    title,
    viewpoint,
    location,
    objective,
    obstacle,
    outcome,
    continuityNotes,
    status,
  }

  const { isSaving } = useAutoSave(
    async () => {
      await onUpdate(fields)
    },
    [scene.id, title, viewpoint, location, objective, obstacle, outcome, continuityNotes, status],
    400
  )

  const persistNow = () => {
    void onUpdate(fields)
  }

  return (
    <div className="rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))]">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggle}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">#{scene.order}</span>
            <span className="truncate text-sm font-medium">{title || '未命名场景'}</span>
            <span className="rounded-sm border border-[hsl(var(--border))] px-2 py-0.5 text-[11px] text-muted-foreground">
              {SCENE_STATUS_LABELS[status]}
            </span>
          </div>
          <div className="mt-1 text-[12px] leading-5 text-muted-foreground">
            {viewpoint || '未设视角'} · {location || '未设地点'} · {objective || '未设目标'}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} aria-label="上移场景卡">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} aria-label="下移场景卡">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label="删除场景卡">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={`scene-status-${scene.id}`} className="text-sm">场景状态</label>
            <div className="flex items-center gap-2">
              <Select
                aria-label={`场景状态-${scene.order}`}
                value={status}
                onValueChange={(value) => {
                  const nextStatus = value as SceneCardStatus
                  setStatus(nextStatus)
                  void onUpdate({
                    ...fields,
                    status: nextStatus,
                  })
                }}
              >
                <SelectTrigger id={`scene-status-${scene.id}`} className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">待写</SelectItem>
                  <SelectItem value="drafting">起草中</SelectItem>
                  <SelectItem value="done">已完成</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground">{isSaving ? '保存中...' : '已保存'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor={`scene-title-${scene.id}`} className="text-sm">场景标题</label>
            <Input id={`scene-title-${scene.id}`} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={persistNow} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={`scene-viewpoint-${scene.id}`} className="text-sm">视角</label>
              <Input id={`scene-viewpoint-${scene.id}`} value={viewpoint} onChange={(e) => setViewpoint(e.target.value)} onBlur={persistNow} />
            </div>
            <div className="space-y-2">
              <label htmlFor={`scene-location-${scene.id}`} className="text-sm">地点</label>
              <Input id={`scene-location-${scene.id}`} value={location} onChange={(e) => setLocation(e.target.value)} onBlur={persistNow} />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor={`scene-objective-${scene.id}`} className="text-sm">目标</label>
            <Textarea id={`scene-objective-${scene.id}`} value={objective} onChange={(e) => setObjective(e.target.value)} onBlur={persistNow} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`scene-obstacle-${scene.id}`} className="text-sm">阻碍</label>
            <Textarea id={`scene-obstacle-${scene.id}`} value={obstacle} onChange={(e) => setObstacle(e.target.value)} onBlur={persistNow} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`scene-outcome-${scene.id}`} className="text-sm">结果</label>
            <Textarea id={`scene-outcome-${scene.id}`} value={outcome} onChange={(e) => setOutcome(e.target.value)} onBlur={persistNow} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`scene-continuity-${scene.id}`} className="text-sm">连续性提醒</label>
            <Textarea
              id={`scene-continuity-${scene.id}`}
              value={continuityNotes}
              onChange={(e) => setContinuityNotes(e.target.value)}
              onBlur={persistNow}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

const SCENE_STATUS_LABELS: Record<SceneCardStatus, string> = {
  planned: '待写',
  drafting: '起草中',
  done: '已完成',
}
