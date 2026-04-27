'use client'

import { Lightbulb, Map as MapIcon, ListTree, Clapperboard, Plus } from 'lucide-react'
import { usePlanning } from '@/lib/hooks/use-planning'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlanningSelection } from './planning-workbench'

interface PlanningSidebarTabProps {
  projectId: string
  activeSelection: PlanningSelection | null
  onSelectItem: (selection: PlanningSelection) => void
}

interface PlanningSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  createLabel: string
  onCreate: () => void
  items: Array<{ id: string; title: string; kind: PlanningSelection['kind'] }>
  emptyText: string
  activeSelection: PlanningSelection | null
  onSelectItem: (selection: PlanningSelection) => void
}

interface ChapterPlanSceneSectionProps {
  chapterPlans: Array<{ id: string; title: string }>
  sceneCards: Array<{ id: string; title: string; chapterPlanId: string; kind: PlanningSelection['kind'] }>
  activeSelection: PlanningSelection | null
  onSelectItem: (selection: PlanningSelection) => void
}

interface StoryArcChapterSectionProps {
  storyArcs: Array<{ id: string; title: string }>
  chapterPlans: Array<{ id: string; title: string; arcId: string | null; kind: PlanningSelection['kind'] }>
  activeSelection: PlanningSelection | null
  onSelectItem: (selection: PlanningSelection) => void
}

function PlanningSection({
  title,
  icon: Icon,
  createLabel,
  onCreate,
  items,
  emptyText,
  activeSelection,
  onSelectItem,
}: PlanningSectionProps) {
  return (
    <section className="px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span>{title}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label={createLabel}
          onClick={onCreate}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="px-2 py-2 text-[12px] text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'truncate px-2 py-1.5 text-[13px] cursor-pointer transition-[background-color] duration-150',
                activeSelection?.kind === item.kind && activeSelection.id === item.id
                  ? 'bg-[hsl(var(--surface-3))]/70 text-foreground'
                  : 'text-foreground/85 hover:bg-[hsl(var(--surface-3))]/40'
              )}
              onClick={() => onSelectItem({ kind: item.kind, id: item.id })}
            >
              {item.title}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ChapterPlanSceneSection({
  chapterPlans,
  sceneCards,
  activeSelection,
  onSelectItem,
}: ChapterPlanSceneSectionProps) {
  if (chapterPlans.length === 0) {
    return (
      <div className="px-2 py-2 text-[12px] text-muted-foreground">
        先创建章纲，再继续拆场景
      </div>
    )
  }

  const sceneCardsByChapterPlanId = new Map<string, Array<{ id: string; title: string; chapterPlanId: string; kind: PlanningSelection['kind'] }>>()
  for (const scene of sceneCards) {
    const bucket = sceneCardsByChapterPlanId.get(scene.chapterPlanId) ?? []
    bucket.push(scene)
    sceneCardsByChapterPlanId.set(scene.chapterPlanId, bucket)
  }

  return (
    <div className="space-y-2">
      {chapterPlans.map((chapterPlan) => {
        const groupedScenes = sceneCardsByChapterPlanId.get(chapterPlan.id) ?? []
        return (
          <div key={chapterPlan.id} className="space-y-1">
            <div className="px-2 py-1.5 text-[12px] text-muted-foreground">
              {chapterPlan.title}
            </div>
            {groupedScenes.length === 0 ? (
              <div className="pl-6 pr-2 py-1 text-[11px] text-muted-foreground/70">
                还没有场景卡
              </div>
            ) : (
              groupedScenes.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'truncate pl-6 pr-2 py-1.5 text-[13px] cursor-pointer transition-[background-color] duration-150',
                    activeSelection?.kind === item.kind && activeSelection.id === item.id
                      ? 'bg-[hsl(var(--surface-3))]/70 text-foreground'
                      : 'text-foreground/85 hover:bg-[hsl(var(--surface-3))]/40'
                  )}
                  onClick={() => onSelectItem({ kind: item.kind, id: item.id })}
                >
                  {item.title}
                </div>
              ))
            )}
          </div>
        )
      })}
      {sceneCards.filter(scene => !chapterPlans.some(chapterPlan => chapterPlan.id === scene.chapterPlanId)).length > 0 ? (
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">未归属章纲</div>
          {sceneCards
            .filter(scene => !chapterPlans.some(chapterPlan => chapterPlan.id === scene.chapterPlanId))
            .map((item) => (
              <div
                key={item.id}
                className={cn(
                  'truncate pl-6 pr-2 py-1.5 text-[13px] cursor-pointer transition-[background-color] duration-150',
                  activeSelection?.kind === item.kind && activeSelection.id === item.id
                    ? 'bg-[hsl(var(--surface-3))]/70 text-foreground'
                    : 'text-foreground/85 hover:bg-[hsl(var(--surface-3))]/40'
                )}
                onClick={() => onSelectItem({ kind: item.kind, id: item.id })}
              >
                {item.title}
              </div>
            ))}
        </div>
      ) : null}
    </div>
  )
}

function StoryArcChapterSection({
  storyArcs,
  chapterPlans,
  activeSelection,
  onSelectItem,
}: StoryArcChapterSectionProps) {
  if (chapterPlans.length === 0) {
    return (
      <div className="px-2 py-2 text-[12px] text-muted-foreground">
        还没有章纲，点击添加
      </div>
    )
  }

  const chapterPlansByArcId = new Map<string, Array<{ id: string; title: string; arcId: string | null; kind: PlanningSelection['kind'] }>>()
  for (const chapterPlan of chapterPlans) {
    if (!chapterPlan.arcId) continue
    const bucket = chapterPlansByArcId.get(chapterPlan.arcId) ?? []
    bucket.push(chapterPlan)
    chapterPlansByArcId.set(chapterPlan.arcId, bucket)
  }

  const orphanChapterPlans = chapterPlans.filter((chapterPlan) => !chapterPlan.arcId)

  return (
    <div className="space-y-2">
      {storyArcs.map((storyArc) => {
        const groupedChapterPlans = chapterPlansByArcId.get(storyArc.id) ?? []
        return (
          <div key={storyArc.id} className="space-y-1">
            <div className="px-2 py-1.5 text-[12px] text-muted-foreground">
              {storyArc.title}
            </div>
            {groupedChapterPlans.length === 0 ? (
              <div className="pl-6 pr-2 py-1 text-[11px] text-muted-foreground/70">
                还没有章纲
              </div>
            ) : (
              groupedChapterPlans.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'truncate pl-6 pr-2 py-1.5 text-[13px] cursor-pointer transition-[background-color] duration-150',
                    activeSelection?.kind === item.kind && activeSelection.id === item.id
                      ? 'bg-[hsl(var(--surface-3))]/70 text-foreground'
                      : 'text-foreground/85 hover:bg-[hsl(var(--surface-3))]/40'
                  )}
                  onClick={() => onSelectItem({ kind: item.kind, id: item.id })}
                >
                  {item.title}
                </div>
              ))
            )}
          </div>
        )
      })}
      {orphanChapterPlans.length > 0 ? (
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">未归属卷纲</div>
          {orphanChapterPlans.map((item) => (
            <div
              key={item.id}
              className={cn(
                'truncate pl-6 pr-2 py-1.5 text-[13px] cursor-pointer transition-[background-color] duration-150',
                activeSelection?.kind === item.kind && activeSelection.id === item.id
                  ? 'bg-[hsl(var(--surface-3))]/70 text-foreground'
                  : 'text-foreground/85 hover:bg-[hsl(var(--surface-3))]/40'
              )}
              onClick={() => onSelectItem({ kind: item.kind, id: item.id })}
            >
              {item.title}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function PlanningSidebarTab({
  projectId,
  activeSelection,
  onSelectItem,
}: PlanningSidebarTabProps) {
  const {
    snapshot,
    loading,
    createIdeaNote,
    createStoryArc,
    createChapterPlan,
    createSceneCard,
  } = usePlanning(projectId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        加载中...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <PlanningSection
        title="灵感"
        icon={Lightbulb}
        createLabel="新建灵感"
        onCreate={() => { void createIdeaNote({ title: '新灵感' }) }}
        items={snapshot.ideaNotes.map((item) => ({ id: item.id, title: item.title, kind: 'idea' as const }))}
        emptyText="还没有灵感，点击添加"
        activeSelection={activeSelection}
        onSelectItem={onSelectItem}
      />
      <div className="mx-3 divider-hair" />
      <PlanningSection
        title="卷纲"
        icon={MapIcon}
        createLabel="新建卷纲"
        onCreate={() => { void createStoryArc({ title: `第 ${snapshot.storyArcs.length + 1} 卷` }) }}
        items={snapshot.storyArcs.map((item) => ({ id: item.id, title: item.title, kind: 'arc' as const }))}
        emptyText="还没有卷纲，点击添加"
        activeSelection={activeSelection}
        onSelectItem={onSelectItem}
      />
      <div className="mx-3 divider-hair" />
      <PlanningSection
        title="章纲"
        icon={ListTree}
        createLabel="新建章纲"
        onCreate={() => { void createChapterPlan({ title: `第 ${snapshot.chapterPlans.length + 1} 章` }) }}
        items={[]}
        emptyText=""
        activeSelection={activeSelection}
        onSelectItem={onSelectItem}
      />
      <div className="px-3 pb-3">
        <StoryArcChapterSection
          storyArcs={snapshot.storyArcs.map((item) => ({ id: item.id, title: item.title }))}
          chapterPlans={snapshot.chapterPlans.map((item) => ({ id: item.id, title: item.title, arcId: item.arcId, kind: 'chapter' as const }))}
          activeSelection={activeSelection}
          onSelectItem={onSelectItem}
        />
      </div>
      <div className="mx-3 divider-hair" />
      <PlanningSection
        title="场景卡"
        icon={Clapperboard}
        createLabel="新建场景卡"
        onCreate={() => {
          const firstPlan = snapshot.chapterPlans[0]
          if (!firstPlan) return
          void createSceneCard({
            chapterPlanId: firstPlan.id,
            title: `场景 ${snapshot.sceneCards.length + 1}`,
          })
        }}
        items={[]}
        emptyText=""
        activeSelection={activeSelection}
        onSelectItem={onSelectItem}
      />
      <div className="px-3 pb-3">
        <ChapterPlanSceneSection
          chapterPlans={snapshot.chapterPlans.map((item) => ({ id: item.id, title: item.title }))}
          sceneCards={snapshot.sceneCards.map((item) => ({ id: item.id, title: item.title, chapterPlanId: item.chapterPlanId, kind: 'scene' as const }))}
          activeSelection={activeSelection}
          onSelectItem={onSelectItem}
        />
      </div>
    </div>
  )
}
