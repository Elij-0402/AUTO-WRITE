import type {
  CreatePreferenceMemoryInput,
  PreferenceMemory,
  ProjectCharter,
  ProjectCharterUpdate,
} from '../types'
import { createProjectDB } from './project-db'

function buildAiUnderstanding(charter: Pick<ProjectCharter, 'oneLinePremise' | 'storyPromise' | 'tone'>): string {
  return [
    `一句话 premise：${charter.oneLinePremise}`.trim(),
    `故事承诺：${charter.storyPromise}`.trim(),
    `整体语气：${charter.tone}`.trim(),
  ].join('\n')
}

function createDefaultCharter(projectId: string): ProjectCharter {
  const now = new Date()
  const charter: ProjectCharter = {
    id: 'charter',
    projectId,
    oneLinePremise: '',
    storyPromise: '',
    tone: '',
    aiUnderstanding: '',
    createdAt: now,
    updatedAt: now,
  }
  return charter
}

export async function getProjectCharter(projectId: string): Promise<ProjectCharter> {
  const db = createProjectDB(projectId)
  const existing = await db.projectCharter.get('charter')
  if (existing) {
    return existing
  }

  const charter = createDefaultCharter(projectId)
  await db.projectCharter.put(charter)
  return charter
}

export async function saveProjectCharter(
  projectId: string,
  updates: ProjectCharterUpdate
): Promise<ProjectCharter> {
  const db = createProjectDB(projectId)
  const current = await getProjectCharter(projectId)
  const next: ProjectCharter = {
    ...current,
    ...updates,
    updatedAt: new Date(),
  }
  next.aiUnderstanding = buildAiUnderstanding(next)
  await db.projectCharter.put(next)
  return next
}

export async function recordPreferenceMemory(
  projectId: string,
  input: CreatePreferenceMemoryInput
): Promise<PreferenceMemory> {
  const db = createProjectDB(projectId)
  const row: PreferenceMemory = {
    id: crypto.randomUUID(),
    projectId,
    createdAt: Date.now(),
    ...input,
  }
  await db.preferenceMemories.add(row)
  return row
}

export async function listPreferenceMemories(projectId: string): Promise<PreferenceMemory[]> {
  const db = createProjectDB(projectId)
  const rows = await db.preferenceMemories.where('projectId').equals(projectId).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}
