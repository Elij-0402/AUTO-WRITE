import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('seeds a default charter and persists updates', async () => {
    const initial = await getProjectCharter(projectId)
    expect(initial.id).toBe('charter')
    expect(initial.projectId).toBe(projectId)
    expect(initial.storyPromise).toBe('')
    expect(initial.themes).toEqual([])
    expect(initial.targetReader).toBe('')
    expect(initial.styleDos).toEqual([])
    expect(initial.tabooList).toEqual([])
    expect(initial.positiveReferences).toEqual([])
    expect(initial.negativeReferences).toEqual([])
    expect(typeof initial.createdAt).toBe('number')
    expect(typeof initial.updatedAt).toBe('number')

    await saveProjectCharter(projectId, {
      oneLinePremise: '一个废柴皇子在边荒收拾旧山河',
      storyPromise: '高压权谋与热血复国并行',
      themes: ['失国', '复国', '权谋'],
      tone: '苍凉、克制、带锋刃',
      targetReader: '偏爱权谋成长线的长篇读者',
      styleDos: ['冲突落地到人物选择', '关键场景保留冷峻留白'],
      tabooList: ['油腻抒情', '套路打脸爽文腔'],
      positiveReferences: ['琅琊榜式布局感'],
      negativeReferences: ['短视频文案腔'],
    })

    const updated = await getProjectCharter(projectId)
    expect(updated.oneLinePremise).toContain('废柴皇子')
    expect(updated.storyPromise).toContain('复国')
    expect(updated.themes).toEqual(['失国', '复国', '权谋'])
    expect(updated.tone).toContain('锋刃')
    expect(updated.targetReader).toContain('权谋成长线')
    expect(updated.styleDos).toContain('冲突落地到人物选择')
    expect(updated.tabooList).toContain('油腻抒情')
    expect(updated.positiveReferences).toContain('琅琊榜式布局感')
    expect(updated.negativeReferences).toContain('短视频文案腔')
    expect(updated.aiUnderstanding).toContain('高压权谋')
    expect(updated.aiUnderstanding).toContain('失国')
    expect(updated.aiUnderstanding).toContain('长篇读者')
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

  it('orders preference memories newest-first even when Date.now repeats', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)

    await recordPreferenceMemory(projectId, {
      source: 'draft',
      messageId: 'm-1',
      verdict: 'reject',
      category: 'voice',
      note: '第一条',
    })
    await recordPreferenceMemory(projectId, {
      source: 'chat',
      messageId: 'm-2',
      verdict: 'reject',
      category: 'plot',
      note: '第二条',
    })

    const rows = await listPreferenceMemories(projectId)
    expect(rows.map(row => row.messageId)).toEqual(['m-2', 'm-1'])
    expect(rows.map(row => row.createdAt)).toEqual([1001, 1000])
  })

  it('accepts the exact preference memory category contract', async () => {
    await recordPreferenceMemory(projectId, {
      source: 'chat',
      messageId: 'm-3',
      verdict: 'reject',
      category: 'worldbuilding',
      note: '设定解释方式太硬，像资料卡',
    })

    const rows = await listPreferenceMemories(projectId)
    expect(rows[0].category).toBe('worldbuilding')
  })
})
