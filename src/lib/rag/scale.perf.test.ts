/**
 * Scale performance test — per deep-interview spec AC-5.
 *
 * Validates hybrid-search p95 latency under the documented target corpus
 * (500 WorldEntries × 300 Chapters × 2000 Relations). Uses fake-indexeddb
 * so it runs in the normal vitest pipeline; absolute numbers will differ
 * from real browser IndexedDB, but the test catches algorithmic regressions
 * (e.g. accidental O(n²) merges, reindexing on every query).
 *
 * Threshold: p95 < 800ms over 100 steady-state queries with warm index.
 * Adjust the threshold in CI if hardware variance becomes a flaky source;
 * the important property is that it stays bounded and does not drift up
 * across releases.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createProjectDB, __resetProjectDBCache, type InkForgeProjectDB } from '../db/project-db'
import type { WorldEntry } from '../types/world-entry'
import type { Relation } from '../types/relation'
import type { Chapter } from '../types/chapter'
import type { EntriesByType } from '../hooks/use-context-injection'
import { searchRelevantEntries } from './search'
import { __resetEmbedderForTests, getDefaultEmbedder } from './default-embedder'
import type { Embedder } from './embedder'

const CHARACTER_POOL = [
  '李', '王', '赵', '张', '陈', '刘', '林', '周', '周', '谢',
  '孙', '钱', '吴', '郑', '韩', '何', '沈', '苏', '萧', '魏',
]
const NAME_POOL = [
  '浩然', '清风', '晨曦', '寒霜', '惊鸿', '玄机', '墨渊', '紫萱',
  '素素', '璎珞', '昭华', '子衿', '凤九', '夜华', '墨书白',
]
const LOC_POOL = [
  '青山', '苍云', '洛水', '幽冥', '九渊', '丹阳', '落霞',
  '天机阁', '无妄谷', '归墟', '寒玉岛', '北荒', '东渡', '西境',
]
const RULE_POOL = [
  '灵气运转', '符咒契约', '天道法则', '结界维持', '因果循环', '轮回禁忌',
  '血脉传承', '封印解除', '渡劫规则',
]
const TIMELINE_POOL = [
  '开天辟地', '三皇治世', '封神之战', '灵气复苏', '上古战役', '归墟事变',
]

function createCharacter(i: number): WorldEntry {
  const surname = CHARACTER_POOL[i % CHARACTER_POOL.length]
  const given = NAME_POOL[i % NAME_POOL.length]
  return {
    id: `char-${i}`,
    projectId: PROJECT_ID,
    type: 'character',
    name: `${surname}${given}`,
    alias: i % 5 === 0 ? `${given}公子` : undefined,
    appearance: `身高${160 + (i % 30)}cm，${i % 2 === 0 ? '红眼' : '墨瞳'}，白衣`,
    personality: `${i % 3 === 0 ? '沉默寡言' : '意气风发'}，对${LOC_POOL[i % LOC_POOL.length]}之事最为敏感`,
    background: `幼年丧父，习武于${LOC_POOL[(i + 3) % LOC_POOL.length]}，师承无名散人`,
    tags: [`修真界`, `${i % 10}级`],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }
}

function createLocation(i: number): WorldEntry {
  return {
    id: `loc-${i}`,
    projectId: PROJECT_ID,
    type: 'location',
    name: `${LOC_POOL[i % LOC_POOL.length]}-${i}`,
    description: `位于${i % 2 === 0 ? '东南' : '西北'}的险境，终年${i % 3 === 0 ? '雪雾' : '雷电'}缭绕`,
    features: `奇花异草丛生，${i % 4 === 0 ? '灵气充沛' : '煞气冲天'}`,
    tags: [`秘境`],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }
}

function createRule(i: number): WorldEntry {
  return {
    id: `rule-${i}`,
    projectId: PROJECT_ID,
    type: 'rule',
    name: `${RULE_POOL[i % RULE_POOL.length]}#${i}`,
    content: `任何修士在${LOC_POOL[i % LOC_POOL.length]}行使术法，必须经${i % 5 === 0 ? '天道' : '掌门'}核准`,
    scope: `仅适用于${i % 2 === 0 ? '筑基期' : '金丹期'}以上修士`,
    tags: [`宗门律法`],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }
}

function createTimeline(i: number): WorldEntry {
  return {
    id: `time-${i}`,
    projectId: PROJECT_ID,
    type: 'timeline',
    name: `${TIMELINE_POOL[i % TIMELINE_POOL.length]} · 第${i}纪`,
    timePoint: `距今${i * 1000}年`,
    eventDescription: `${TIMELINE_POOL[i % TIMELINE_POOL.length]}后余波，${LOC_POOL[i % LOC_POOL.length]}元气大伤`,
    tags: [`史料`],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }
}

function generateEntries(total: number): WorldEntry[] {
  const entries: WorldEntry[] = []
  for (let i = 0; i < total; i++) {
    const mod = i % 10
    if (mod < 5) entries.push(createCharacter(i))
    else if (mod < 8) entries.push(createLocation(i))
    else if (mod < 9) entries.push(createRule(i))
    else entries.push(createTimeline(i))
  }
  return entries
}

function generateRelations(entries: WorldEntry[], total: number): Relation[] {
  const relations: Relation[] = []
  const characters = entries.filter(e => e.type === 'character')
  for (let i = 0; i < total; i++) {
    const a = characters[i % characters.length]
    const b = characters[(i + 7) % characters.length]
    if (!a || !b || a.id === b.id) continue
    relations.push({
      id: `rel-${i}`,
      projectId: PROJECT_ID,
      sourceEntryId: a.id,
      targetEntryId: b.id,
      sourceRoleDescription: i % 2 === 0 ? '师父' : '挚友',
      targetRoleDescription: i % 2 === 0 ? '弟子' : '挚友',
      category: 'character_relation',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  }
  return relations
}

function generateChapters(total: number): Chapter[] {
  const chapters: Chapter[] = []
  for (let i = 0; i < total; i++) {
    chapters.push({
      id: `chap-${i}`,
      projectId: PROJECT_ID,
      title: `第${i + 1}章 · ${LOC_POOL[i % LOC_POOL.length]}`,
      content: { type: 'doc', content: [] },
      order: i,
      status: 'draft',
      wordCount: 3000 + (i % 500),
      outlineStatus: 'not_started',
      outlineSummary: '',
      outlineTargetWordCount: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  }
  return chapters
}

function groupByType(entries: WorldEntry[]): EntriesByType {
  const out: EntriesByType = { character: [], location: [], rule: [], timeline: [] }
  for (const e of entries) {
    if (e.deletedAt) continue
    if (e.type === 'character') out.character.push(e)
    else if (e.type === 'location') out.location.push(e)
    else if (e.type === 'rule') out.rule.push(e)
    else if (e.type === 'timeline') out.timeline.push(e)
  }
  return out
}

const PROJECT_ID = 'stress-test-project'
const ENTRY_COUNT = 500
const CHAPTER_COUNT = 300
const RELATION_COUNT = 2000
const QUERY_COUNT = 100

const QUERIES = [
  '李浩然最近去哪了',
  '红眼的人物都有谁',
  '青山秘境里有什么',
  '师父和弟子的关系',
  '封神之战发生在什么时候',
  '天道法则是如何运转的',
  '筑基期修士需要注意什么',
  '北荒的灵气是不是很充沛',
  '墨渊师承何人',
  '谁在归墟事变中受伤了',
]

describe('RAG hybrid-search scale performance (500×300 corpus)', () => {
  let db: InkForgeProjectDB
  let embedder: Embedder
  let entries: WorldEntry[]
  let entriesByType: EntriesByType

  beforeAll(async () => {
    __resetProjectDBCache()
    __resetEmbedderForTests()
    // Ensure no stale DB from earlier runs.
    const scratch = createProjectDB(PROJECT_ID)
    await scratch.delete().catch(() => { /* ignore */ })
    __resetProjectDBCache()
    db = createProjectDB(PROJECT_ID)
    embedder = getDefaultEmbedder()

    entries = generateEntries(ENTRY_COUNT)
    const relations = generateRelations(entries, RELATION_COUNT)
    const chapters = generateChapters(CHAPTER_COUNT)
    entriesByType = groupByType(entries)

    await db.worldEntries.bulkAdd(entries)
    await db.relations.bulkAdd(relations)
    await db.chapters.bulkAdd(chapters)

    // Warm up: index entries so subsequent queries hit skipReindex path.
    await searchRelevantEntries({
      db,
      projectId: PROJECT_ID,
      embedder,
      query: '预热',
      entries,
      entriesByType,
    })
  }, 120_000)

  afterAll(async () => {
    try { await db.delete() } catch { /* db may already be closed */ }
    __resetProjectDBCache()
  })

  it('p95 hybrid-search latency < 800ms across 100 steady-state queries', async () => {
    const latencies: number[] = []
    for (let i = 0; i < QUERY_COUNT; i++) {
      const query = QUERIES[i % QUERIES.length]
      const start = performance.now()
      const results = await searchRelevantEntries({
        db,
        projectId: PROJECT_ID,
        embedder,
        query,
        entries,
        entriesByType,
        skipReindex: true,
      })
      const elapsed = performance.now() - start
      latencies.push(elapsed)
      expect(results.length).toBeGreaterThan(0)
    }

    latencies.sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)]
    const p95 = latencies[Math.floor(latencies.length * 0.95)]
    const p99 = latencies[Math.floor(latencies.length * 0.99)]
    const max = latencies[latencies.length - 1]

    console.log(
      `[scale.perf] entries=${ENTRY_COUNT} chapters=${CHAPTER_COUNT} relations=${RELATION_COUNT} ` +
        `queries=${QUERY_COUNT} | p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms ` +
        `p99=${p99.toFixed(1)}ms max=${max.toFixed(1)}ms`
    )

    expect(p95).toBeLessThan(800)
  }, 120_000)
})
