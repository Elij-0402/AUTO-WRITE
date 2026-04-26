export type PreferenceMemorySource = 'chat' | 'draft'

export type PreferenceMemoryVerdict = 'accept' | 'reject'

export type PreferenceMemoryCategory =
  | 'voice'
  | 'plot'
  | 'character'
  | 'world'
  | 'pacing'
  | 'other'

export interface ProjectCharter {
  id: 'charter'
  projectId: string
  oneLinePremise: string
  storyPromise: string
  tone: string
  aiUnderstanding: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectCharterUpdate {
  oneLinePremise?: string
  storyPromise?: string
  tone?: string
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
