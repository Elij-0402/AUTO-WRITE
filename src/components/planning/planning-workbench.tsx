'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
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

export interface PlanningSelection {
  kind: 'idea' | 'arc' | 'chapter'
  id: string
}

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
    updateIdeaNote,
    updateStoryArc,
    updateChapterPlan,
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
  }, [selectionVersion])
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
              onBlur={() => {
                void updateIdeaNote(selectedIdea.id, {
                  title: latestValuesRef.current.title,
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
              onBlur={() => {
                void updateStoryArc(selectedArc.id, {
                  title: latestValuesRef.current.title,
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
              ? `已有 ${selectedChapterScenes.length} 条旧场景资料`
              : '可直接为本章补齐摘要、目标与转折',
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
              onBlur={() => {
                void updateChapterPlan(selectedChapterPlan.id, {
                  title: latestValuesRef.current.title,
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
              <Select value={linkedChapterId} onValueChange={handleLinkedChapterChange}>
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
