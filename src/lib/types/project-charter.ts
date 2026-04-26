export type PreferenceMemorySource = 'chat' | 'draft'

export type PreferenceMemoryVerdict = 'accept' | 'reject'

export type PreferenceMemoryCategory =
  | 'voice'
  | 'worldbuilding'
  | 'plot'
  | 'character'
  | 'other'

export interface ProjectCharter {
  id: 'charter'
  projectId: string
  oneLinePremise: string
  storyPromise: string
  themes: string[]
  tone: string
  targetReader: string
  styleDos: string[]
  tabooList: string[]
  positiveReferences: string[]
  negativeReferences: string[]
  aiUnderstanding: string
  createdAt: number
  updatedAt: number
}

export interface ProjectCharterUpdate {
  oneLinePremise?: string
  storyPromise?: string
  themes?: string[]
  tone?: string
  targetReader?: string
  styleDos?: string[]
  tabooList?: string[]
  positiveReferences?: string[]
  negativeReferences?: string[]
}

export interface PreferenceMemory {
  id: string
  projectId: string
  source: PreferenceMemorySource
  messageId: string
  verdict: PreferenceMemoryVerdict
  category: PreferenceMemoryCategory
  note: string
  createdAt: number
}

export interface CreatePreferenceMemoryInput {
  source: PreferenceMemorySource
  messageId: string
  verdict: PreferenceMemoryVerdict
  category: PreferenceMemoryCategory
  note: string
}
