import { beforeEach, describe, expect, it } from 'vitest'
import { __resetProjectDBCache } from './project-db'
import {
  getProjectCharter,
  saveProjectCharter,
  recordPreferenceMemory,
  listPreferenceMemories,
} from './project-charter-queries'

describe('project charter queries', () => {
  const projectId = 'phase1-charter'

  beforeEach(async () => {
    __resetProjectDBCache()
    indexedDB.deleteDatabase(`inkforge-project-${projectId}`)
  })

  it('seeds a default charter and persists updates', async () => {
    const initial = await getProjectCharter(projectId)
    expect(initial.id).toBe('charter')
    expect(initial.projectId).toBe(projectId)
    expect(initial.storyPromise).toBe('')

    await saveProjectCharter(projectId, {
      oneLinePremise: '一个废柴皇子在边荒收拾旧山河',
      storyPromise: '高压权谋与热血复国并行',
      tone: '苍凉、克制、带锋刃',
    })

    const updated = await getProjectCharter(projectId)
    expect(updated.oneLinePremise).toContain('废柴皇子')
    expect(updated.storyPromise).toContain('复国')
    expect(updated.tone).toContain('锋刃')
    expect(updated.aiUnderstanding).toContain('高压权谋')
  })

  it('records preference memories newest-first', async () => {
    await recordPreferenceMemory(projectId, {
      source: 'draft',
      messageId: 'm-1',
      verdict: 'reject',
      category: 'voice',
      note: '语言太像通用古风，不像这本书',
    })
    await recordPreferenceMemory(projectId, {
      source: 'chat',
      messageId: 'm-2',
      verdict: 'reject',
      category: 'plot',
      note: '冲突升级太快，缺少铺垫',
    })

    const rows = await listPreferenceMemories(projectId)
    expect(rows).toHaveLength(2)
    expect(rows[0].messageId).toBe('m-2')
    expect(rows[1].messageId).toBe('m-1')
  })
})
