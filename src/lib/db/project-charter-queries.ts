import Dexie from 'dexie'
import type {
  CreatePreferenceMemoryInput,
  PreferenceMemory,
  ProjectCharter,
  ProjectCharterUpdate,
} from '../types'
import { createDefaultProjectCharter } from '../types'
import { createProjectDB } from './project-db'

function buildAiUnderstanding(charter: ProjectCharter): string {
  return [
    `一句话 premise：${charter.oneLinePremise}`.trim(),
    `故事承诺：${charter.storyPromise}`.trim(),
    `主题关键词：${charter.themes.join('、')}`.trim(),
    `整体语气：${charter.tone}`.trim(),
    `目标读者：${charter.targetReader}`.trim(),
    `风格要做：${charter.styleDos.join('；')}`.trim(),
    `明确禁区：${charter.tabooList.join('；')}`.trim(),
    `正向参考：${charter.positiveReferences.join('；')}`.trim(),
    `反向参考：${charter.negativeReferences.join('；')}`.trim(),
  ]
    .filter(line => !line.endsWith('：'))
    .join('\n')
}

async function getLatestPreferenceMemoryCreatedAt(projectId: string): Promise<number | null> {
  const db = createProjectDB(projectId)
  const latest = await db.preferenceMemories
    .where('[projectId+createdAt]')
    .between([projectId, Dexie.minKey], [projectId, Dexie.maxKey])
    .reverse()
    .first()
  return latest?.createdAt ?? null
}

export async function getProjectCharter(projectId: string): Promise<ProjectCharter> {
  const db = createProjectDB(projectId)
  const existing = await db.projectCharter.get('charter')
  if (existing) {
    return existing
  }

  const charter = createDefaultProjectCharter(projectId)
  await db.projectCharter.put(charter)
  return charter
}

export async function getProjectCharterSnapshot(projectId: string): Promise<ProjectCharter> {
  const db = createProjectDB(projectId)
  const existing = await db.projectCharter.get('charter')
  if (existing) {
    return existing
  }

  return createDefaultProjectCharter(projectId)
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
    updatedAt: Date.now(),
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
  const now = Date.now()
  const latestCreatedAt = await getLatestPreferenceMemoryCreatedAt(projectId)
  const row: PreferenceMemory = {
    id: crypto.randomUUID(),
    projectId,
    createdAt: latestCreatedAt === null ? now : Math.max(now, latestCreatedAt + 1),
    ...input,
  }
  await db.preferenceMemories.add(row)
  return row
}

export async function listPreferenceMemories(projectId: string): Promise<PreferenceMemory[]> {
  const db = createProjectDB(projectId)
  return db.preferenceMemories
    .where('[projectId+createdAt]')
    .between([projectId, Dexie.minKey], [projectId, Dexie.maxKey])
    .reverse()
    .toArray()
}
