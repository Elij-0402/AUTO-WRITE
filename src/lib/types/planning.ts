export type IdeaNoteStatus = 'seed' | 'selected' | 'parked'

export type StoryArcStatus = 'draft' | 'active' | 'completed'

export type ChapterPlanStatus = 'not_started' | 'planned' | 'drafting' | 'completed'

export type SceneCardStatus = 'planned' | 'drafting' | 'done'

export interface IdeaNote {
  id: string
  projectId: string
  title: string
  premise: string
  moodKeywords: string[]
  sourceType: 'manual' | 'ai'
  status: IdeaNoteStatus
  linkedArcId?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface StoryArc {
  id: string
  projectId: string
  title: string
  premise: string
  objective: string
  conflict: string
  payoff: string
  order: number
  status: StoryArcStatus
  sourceIdeaIds: string[]
  relatedEntryIds: string[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface ChapterPlan {
  id: string
  projectId: string
  arcId: string | null
  linkedChapterId: string | null
  title: string
  summary: string
  chapterGoal: string
  conflict: string
  turn: string
  reveal: string
  order: number
  status: ChapterPlanStatus
  targetWordCount: number | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface SceneCard {
  id: string
  projectId: string
  chapterPlanId: string
  title: string
  viewpoint: string
  location: string
  objective: string
  obstacle: string
  outcome: string
  continuityNotes: string
  order: number
  status: SceneCardStatus
  linkedEntryIds: string[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface PlanningSnapshot {
  ideaNotes: IdeaNote[]
  storyArcs: StoryArc[]
  chapterPlans: ChapterPlan[]
  sceneCards: SceneCard[]
}

export interface PlanningSelection {
  kind: 'idea' | 'arc' | 'chapter' | 'scene'
  id: string
}

export interface CreateIdeaNoteInput {
  title?: string
  premise?: string
  moodKeywords?: string[]
  sourceType?: 'manual' | 'ai'
  status?: IdeaNoteStatus
  linkedArcId?: string
}

export interface CreateStoryArcInput {
  title?: string
  premise?: string
  objective?: string
  conflict?: string
  payoff?: string
  order?: number
  status?: StoryArcStatus
  sourceIdeaIds?: string[]
  relatedEntryIds?: string[]
}

export interface CreateChapterPlanInput {
  arcId?: string | null
  linkedChapterId?: string | null
  title?: string
  summary?: string
  chapterGoal?: string
  conflict?: string
  turn?: string
  reveal?: string
  order?: number
  status?: ChapterPlanStatus
  targetWordCount?: number | null
}

export interface CreateSceneCardInput {
  chapterPlanId: string
  title?: string
  viewpoint?: string
  location?: string
  objective?: string
  obstacle?: string
  outcome?: string
  continuityNotes?: string
  order?: number
  status?: SceneCardStatus
  linkedEntryIds?: string[]
}
