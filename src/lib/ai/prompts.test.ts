import { describe, it, expect } from 'vitest'
import {
  buildSegmentedSystemPrompt,
  buildWorldBibleBlock,
  flattenSystemPrompt,
  BASE_INSTRUCTION,
} from './prompts'
import type { StoryTracker } from '../types'
import type { WorldEntry } from '../types/world-entry'

const sampleCharacter: WorldEntry = {
  id: 'c1',
  projectId: 'p1',
  type: 'character',
  name: '云归',
  personality: '冷静寡言',
  appearance: '白衣长发',
  background: '仙门弃徒',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const sampleFaction: WorldEntry = {
  id: 'f1',
  projectId: 'p1',
  type: 'faction',
  name: '玄霄司',
  factionRole: '帝都秘监',
  factionGoal: '追回失落天玺',
  factionStyle: '潜伏渗透，先礼后兵',
  tags: ['朝堂'],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const sampleSecret: WorldEntry = {
  id: 's1',
  projectId: 'p1',
  type: 'secret',
  name: '天玺裂痕',
  secretContent: '天玺其实早已分裂成三片',
  secretScope: '皇族与玄霄司高层',
  revealCondition: '太庙祭典失控时暴露',
  tags: ['核心谜团'],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const sampleTimeline: WorldEntry = {
  id: 't1',
  projectId: 'p1',
  type: 'timeline',
  name: '北境失守',
  timePoint: '景和三年冬',
  eventDescription: '北境防线崩塌，流民南下',
  timeOrder: 10,
  tags: ['国变'],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const sampleEvent: WorldEntry = {
  id: 'e1',
  projectId: 'p1',
  type: 'event',
  name: '太庙血夜',
  timePoint: '景和四年春',
  eventDescription: '祭典刺杀引发旧案翻涌',
  eventImpact: '皇权失衡，诸侯观望',
  timeOrder: 20,
  tags: ['转折'],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const sampleTracker: StoryTracker = {
  id: 'tracker-1',
  projectId: 'p1',
  kind: 'foreshadow',
  title: '云归欠下的血债',
  summary: '第三章埋下的复仇誓言仍未兑现',
  subjectEntryIds: ['c1'],
  relatedEntryIds: ['f1'],
  linkedTimelineEntryId: 'e1',
  status: 'active',
  createdAt: 1,
  updatedAt: 2,
  deletedAt: null,
}

const resolvedTracker: StoryTracker = {
  ...sampleTracker,
  id: 'tracker-2',
  title: '已解决伏笔',
  status: 'resolved',
}

describe('buildWorldBibleBlock', () => {
  it('emits placeholder when there are no entries', () => {
    const block = buildWorldBibleBlock([])
    expect(block).toContain('【世界观百科】')
    expect(block).toContain('(暂无相关世界观条目)')
  })

  it('formats entries into the 【世界观百科】 section', () => {
    const block = buildWorldBibleBlock([sampleCharacter])
    expect(block.startsWith('【世界观百科】')).toBe(true)
    expect(block).toContain('云归')
    expect(block).toContain('冷静寡言')
  })

  it('groups richer story bible context for factions, secrets, timeline and unresolved trackers', () => {
    const block = buildWorldBibleBlock(
      [sampleCharacter, sampleFaction, sampleSecret, sampleTimeline, sampleEvent],
      [sampleTracker, resolvedTracker]
    )

    expect(block).toContain('【势力】')
    expect(block).toContain('玄霄司：角色=帝都秘监；目标=追回失落天玺；风格=潜伏渗透，先礼后兵')
    expect(block).toContain('【秘密】')
    expect(block).toContain('天玺裂痕：内容=天玺其实早已分裂成三片；影响范围=皇族与玄霄司高层；揭露条件=太庙祭典失控时暴露')
    expect(block).toContain('【事件与时间线】')
    expect(block).toContain('景和三年冬｜北境失守：北境防线崩塌，流民南下')
    expect(block).toContain('景和四年春｜太庙血夜：祭典刺杀引发旧案翻涌；影响=皇权失衡，诸侯观望')
    expect(block).toContain('【未解决追踪】')
    expect(block).toContain('伏笔｜云归欠下的血债：第三章埋下的复仇誓言仍未兑现')
    expect(block).not.toContain('已解决伏笔')
  })
})

describe('buildSegmentedSystemPrompt', () => {
  it('includes base instruction, world bible and runtime context separately', () => {
    const segments = buildSegmentedSystemPrompt({
      worldEntries: [sampleCharacter],
      selectedText: '她转身离去。',
    })

    expect(segments.baseInstruction).toBe(BASE_INSTRUCTION)
    expect(segments.worldBibleContext).toContain('云归')
    expect(segments.runtimeContext).toContain('她转身离去')
    expect(segments.runtimeContext).toContain('【当前讨论】')
  })

  it('omits runtime context when no selected text', () => {
    const segments = buildSegmentedSystemPrompt({ worldEntries: [] })
    expect(segments.runtimeContext).toBe('')
  })

  it('includes a project charter block before the world bible block', () => {
    const segments = buildSegmentedSystemPrompt({
      projectCharter: {
        id: 'charter',
        projectId: 'p-1',
        oneLinePremise: '流亡太子重建山河',
        storyPromise: '权谋、征伐、缓慢燃烧的君臣关系',
        themes: ['复国', '忠诚'],
        tone: '冷峻克制',
        targetReader: '喜欢高压权谋的网文读者',
        styleDos: ['少说教', '冲突递进'],
        tabooList: ['现代吐槽腔'],
        positiveReferences: ['史诗感'],
        negativeReferences: ['轻飘玩梗'],
        aiUnderstanding: '故事核心：流亡太子重建山河',
        createdAt: 1,
        updatedAt: 1,
      },
      worldEntries: [],
    })

    expect(segments.projectCharterContext).toContain('【作品宪章】')
    expect(flattenSystemPrompt(segments)).toMatch(/【作品宪章】[\s\S]*【世界观百科】/)
  })

  it('passes story trackers into the world bible context', () => {
    const segments = buildSegmentedSystemPrompt({
      worldEntries: [sampleFaction, sampleSecret, sampleTimeline, sampleEvent],
      storyTrackers: [sampleTracker, resolvedTracker],
    })

    expect(segments.worldBibleContext).toContain('【未解决追踪】')
    expect(segments.worldBibleContext).toContain('云归欠下的血债')
    expect(segments.worldBibleContext).not.toContain('已解决伏笔')
  })
})

describe('flattenSystemPrompt', () => {
  it('joins non-empty segments with blank lines', () => {
    const flat = flattenSystemPrompt({
      baseInstruction: 'A',
      projectCharterContext: '',
      worldBibleContext: 'B',
      runtimeContext: '',
    })
    expect(flat).toBe('A\n\nB')
  })

  it('preserves order: base → charter → world → runtime', () => {
    const flat = flattenSystemPrompt({
      baseInstruction: 'BASE',
      projectCharterContext: 'CHARTER',
      worldBibleContext: 'WORLD',
      runtimeContext: 'RUN',
    })
    expect(flat).toBe('BASE\n\nCHARTER\n\nWORLD\n\nRUN')
  })
})
