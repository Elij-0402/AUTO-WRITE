import type {
  ChapterPlan,
  CreateChapterPlanInput,
  CreateIdeaNoteInput,
  CreateSceneCardInput,
  CreateStoryArcInput,
  IdeaNote,
  PlanningSnapshot,
  SceneCard,
  StoryArc,
} from '../types'
import type { InkForgeProjectDB } from './project-db'

async function nextOrder<T extends { order: number; deletedAt: number | null }>(
  rows: Promise<T[]>
): Promise<number> {
  const items = await rows
  if (items.length === 0) return 1
  return Math.max(...items.map(item => item.order)) + 1
}

function compareByUpdatedAtDesc<T extends { updatedAt: number }>(a: T, b: T): number {
  return b.updatedAt - a.updatedAt
}

function compareByOrder<T extends { order: number; title: string }>(a: T, b: T): number {
  if (a.order !== b.order) return a.order - b.order
  return a.title.localeCompare(b.title, 'zh-CN')
}

export async function createIdeaNote(
  db: InkForgeProjectDB,
  projectId: string,
  input: CreateIdeaNoteInput
): Promise<IdeaNote> {
  const now = Date.now()
  const row: IdeaNote = {
    id: crypto.randomUUID(),
    projectId,
    title: input.title?.trim() || '未命名灵感',
    premise: input.premise?.trim() || '',
    moodKeywords: input.moodKeywords ?? [],
    sourceType: input.sourceType ?? 'manual',
    status: input.status ?? 'seed',
    linkedArcId: input.linkedArcId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await db.ideaNotes.add(row)
  return row
}

export async function createStoryArc(
  db: InkForgeProjectDB,
  projectId: string,
  input: CreateStoryArcInput
): Promise<StoryArc> {
  const now = Date.now()
  const row: StoryArc = {
    id: crypto.randomUUID(),
    projectId,
    title: input.title?.trim() || '未命名卷纲',
    premise: input.premise?.trim() || '',
    objective: input.objective?.trim() || '',
    conflict: input.conflict?.trim() || '',
    payoff: input.payoff?.trim() || '',
    order:
      input.order ??
      await nextOrder(
        db.storyArcs.where('projectId').equals(projectId).filter(item => item.deletedAt === null).toArray()
      ),
    status: input.status ?? 'draft',
    sourceIdeaIds: input.sourceIdeaIds ?? [],
    relatedEntryIds: input.relatedEntryIds ?? [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await db.storyArcs.add(row)
  return row
}

export async function createChapterPlan(
  db: InkForgeProjectDB,
  projectId: string,
  input: CreateChapterPlanInput
): Promise<ChapterPlan> {
  const now = Date.now()
  const row: ChapterPlan = {
    id: crypto.randomUUID(),
    projectId,
    arcId: input.arcId ?? null,
    linkedChapterId: input.linkedChapterId ?? null,
    title: input.title?.trim() || '未命名章纲',
    summary: input.summary?.trim() || '',
    chapterGoal: input.chapterGoal?.trim() || '',
    conflict: input.conflict?.trim() || '',
    turn: input.turn?.trim() || '',
    reveal: input.reveal?.trim() || '',
    order:
      input.order ??
      await nextOrder(
        db.chapterPlans.where('projectId').equals(projectId).filter(item => item.deletedAt === null).toArray()
      ),
    status: input.status ?? 'not_started',
    targetWordCount: input.targetWordCount ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await db.chapterPlans.add(row)
  return row
}

export async function createSceneCard(
  db: InkForgeProjectDB,
  projectId: string,
  input: CreateSceneCardInput
): Promise<SceneCard> {
  const now = Date.now()
  const row: SceneCard = {
    id: crypto.randomUUID(),
    projectId,
    chapterPlanId: input.chapterPlanId,
    title: input.title?.trim() || '未命名场景',
    viewpoint: input.viewpoint?.trim() || '',
    location: input.location?.trim() || '',
    objective: input.objective?.trim() || '',
    obstacle: input.obstacle?.trim() || '',
    outcome: input.outcome?.trim() || '',
    continuityNotes: input.continuityNotes?.trim() || '',
    order:
      input.order ??
      await nextOrder(
        db.sceneCards
          .where('[projectId+chapterPlanId]')
          .equals([projectId, input.chapterPlanId])
          .filter(item => item.deletedAt === null)
          .toArray()
      ),
    status: input.status ?? 'planned',
    linkedEntryIds: input.linkedEntryIds ?? [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await db.sceneCards.add(row)
  return row
}

export async function listPlanningSnapshot(
  db: InkForgeProjectDB,
  projectId: string
): Promise<PlanningSnapshot> {
  const [ideaNotes, storyArcs, chapterPlans, sceneCards] = await Promise.all([
    db.ideaNotes.where('projectId').equals(projectId).filter(item => item.deletedAt === null).toArray(),
    db.storyArcs.where('projectId').equals(projectId).filter(item => item.deletedAt === null).toArray(),
    db.chapterPlans.where('projectId').equals(projectId).filter(item => item.deletedAt === null).toArray(),
    db.sceneCards.where('projectId').equals(projectId).filter(item => item.deletedAt === null).toArray(),
  ])

  return {
    ideaNotes: ideaNotes.sort(compareByUpdatedAtDesc),
    storyArcs: storyArcs.sort(compareByOrder),
    chapterPlans: chapterPlans.sort(compareByOrder),
    sceneCards: sceneCards.sort(compareByOrder),
  }
}

export async function updateIdeaNote(
  db: InkForgeProjectDB,
  id: string,
  fields: Partial<Pick<IdeaNote, 'title' | 'premise' | 'moodKeywords' | 'status' | 'linkedArcId'>>
): Promise<void> {
  await db.ideaNotes.update(id, {
    ...fields,
    updatedAt: Date.now(),
  })
}

export async function updateStoryArc(
  db: InkForgeProjectDB,
  id: string,
  fields: Partial<Omit<StoryArc, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
): Promise<void> {
  await db.storyArcs.update(id, {
    ...fields,
    updatedAt: Date.now(),
  })
}

export async function updateChapterPlan(
  db: InkForgeProjectDB,
  id: string,
  fields: Partial<Omit<ChapterPlan, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
): Promise<void> {
  await db.chapterPlans.update(id, {
    ...fields,
    updatedAt: Date.now(),
  })
}

export async function updateSceneCard(
  db: InkForgeProjectDB,
  id: string,
  fields: Partial<Omit<SceneCard, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
): Promise<void> {
  await db.sceneCards.update(id, {
    ...fields,
    updatedAt: Date.now(),
  })
}

export async function deleteSceneCard(
  db: InkForgeProjectDB,
  id: string
): Promise<void> {
  const card = await db.sceneCards.get(id)
  if (!card || card.deletedAt !== null) return

  const now = Date.now()
  await db.transaction('rw', db.sceneCards, async () => {
    await db.sceneCards.update(id, {
      deletedAt: now,
      updatedAt: now,
    })

    const siblings = await db.sceneCards
      .where('[projectId+chapterPlanId]')
      .equals([card.projectId, card.chapterPlanId])
      .filter((item) => item.deletedAt === null)
      .sortBy('order')

    await Promise.all(
      siblings.map((item, index) => db.sceneCards.update(item.id, {
        order: index + 1,
        updatedAt: now,
      }))
    )
  })
}

export async function reorderSceneCards(
  db: InkForgeProjectDB,
  projectId: string,
  chapterPlanId: string,
  orderedIds: string[]
): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.sceneCards, async () => {
    const cards = await db.sceneCards
      .where('[projectId+chapterPlanId]')
      .equals([projectId, chapterPlanId])
      .filter((item) => item.deletedAt === null)
      .sortBy('order')

    const orderedIdSet = new Set(orderedIds)
    const preservedIds = cards
      .map((item) => item.id)
      .filter((id) => !orderedIdSet.has(id))
    const nextIds = [...orderedIds.filter((id) => cards.some((item) => item.id === id)), ...preservedIds]

    await Promise.all(
      nextIds.map((id, index) => db.sceneCards.update(id, {
        order: index + 1,
        updatedAt: now,
      }))
    )
  })
}
