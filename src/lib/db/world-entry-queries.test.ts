import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createProjectDB, type InkForgeProjectDB } from './project-db'
import {
  getWorldEntries,
  addWorldEntry,
  renameWorldEntry,
  updateWorldEntryFields,
  softDeleteWorldEntry,
  searchWorldEntries,
  getWorldEntryById,
  queryEntriesByKeyword,
  getEntriesByTypeForContext,
} from './world-entry-queries'
import { addRelation } from './relation-queries'

describe('world-entry-queries', () => {
  let db: InkForgeProjectDB
  let testCounter = 0

  beforeEach(async () => {
    testCounter++
    db = createProjectDB(`test-world-entry-${testCounter}`)
  })

  afterEach(async () => {
    await db.close()
  })

  describe('addWorldEntry', () => {
    it('should create a character entry with NanoID and correct defaults per type', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character')

      const entry = await db.worldEntries.get(id)
      expect(entry).toBeDefined()
      expect(entry!.id).toBe(id)
      expect(entry!.projectId).toBe('proj-1')
      expect(entry!.type).toBe('character')
      expect(entry!.name).toBe('未命名角色')
      expect(entry!.tags).toEqual([])
      expect(entry!.deletedAt).toBeNull()
      expect(entry!.createdAt).toBeInstanceOf(Date)
      expect(entry!.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a location entry with correct default name', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'location')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('未命名地点')
      expect(entry!.type).toBe('location')
    })

    it('should create a rule entry with correct default name', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'rule')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('未命名规则')
      expect(entry!.type).toBe('rule')
    })

    it('should create a faction entry with correct default name', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'faction')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('未命名势力')
      expect(entry!.type).toBe('faction')
    })

    it('should create a secret entry with correct default name', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'secret')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('未命名秘密')
      expect(entry!.type).toBe('secret')
    })

    it('should create an event entry with correct default name', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'event')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('未命名事件')
      expect(entry!.type).toBe('event')
    })

    it('should create a timeline entry with correct default name', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'timeline')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('未命名时间线')
      expect(entry!.type).toBe('timeline')
    })

    it('should create an entry with a custom name when provided', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character', '张三')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('张三')
    })

    it('should assign NanoID-based id to each entry', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character')
      const id2 = await addWorldEntry(db, 'proj-1', 'character')

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('getWorldEntries', () => {
    it('should return all non-deleted entries sorted alphabetically by name', async () => {
      await addWorldEntry(db, 'proj-1', 'character', '赵云')
      await addWorldEntry(db, 'proj-1', 'character', '刘备')
      await addWorldEntry(db, 'proj-1', 'character', '关羽')

      const entries = await getWorldEntries(db, 'proj-1')
      expect(entries).toHaveLength(3)
      // Sorted by localeCompare (Chinese pinyin order)
      expect(entries[0].name).toBe('关羽')
      expect(entries[1].name).toBe('刘备')
      expect(entries[2].name).toBe('赵云')
    })

    it('should filter entries by type when type is provided', async () => {
      await addWorldEntry(db, 'proj-1', 'character', '角色A')
      await addWorldEntry(db, 'proj-1', 'location', '地点B')
      await addWorldEntry(db, 'proj-1', 'character', '角色C')

      const characters = await getWorldEntries(db, 'proj-1', 'character')
      expect(characters).toHaveLength(2)
      expect(characters.every(e => e.type === 'character')).toBe(true)
    })

    it('should exclude soft-deleted entries', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '可见角色')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '删除的角色')

      await softDeleteWorldEntry(db, id2)

      const entries = await getWorldEntries(db, 'proj-1')
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toBe(id1)
    })

    it('should return empty array when no entries exist', async () => {
      const entries = await getWorldEntries(db, 'proj-1')
      expect(entries).toEqual([])
    })

    it('should sort event entries by timeOrder before falling back to name', async () => {
      const earlyId = await addWorldEntry(db, 'proj-1', 'event', '终局')
      const laterId = await addWorldEntry(db, 'proj-1', 'event', '序章')
      const noOrderId = await addWorldEntry(db, 'proj-1', 'event', '补遗')

      await updateWorldEntryFields(db, earlyId, { timeOrder: 1 })
      await updateWorldEntryFields(db, laterId, { timeOrder: 5 })

      const events = await getWorldEntries(db, 'proj-1', 'event')
      expect(events.map(entry => entry.name)).toEqual(['终局', '序章', '补遗'])
      expect(events.map(entry => entry.id)).toEqual([earlyId, laterId, noOrderId])
    })

    it('should sort timeline entries by timeOrder before falling back to name', async () => {
      const laterId = await addWorldEntry(db, 'proj-1', 'timeline', '终章')
      const noOrderId = await addWorldEntry(db, 'proj-1', 'timeline', '中章')
      const earlierId = await addWorldEntry(db, 'proj-1', 'timeline', '序章')

      await updateWorldEntryFields(db, laterId, { timeOrder: 20 })
      await updateWorldEntryFields(db, earlierId, { timeOrder: 10 })

      const timelines = await getWorldEntries(db, 'proj-1', 'timeline')
      expect(timelines.map(entry => entry.name)).toEqual(['序章', '终章', '中章'])
      expect(timelines.map(entry => entry.id)).toEqual([earlierId, laterId, noOrderId])
    })

    it('should treat null and undefined timeOrder as missing order for event sorting', async () => {
      const numberedId = await addWorldEntry(db, 'proj-1', 'event', '终局')
      const nullOrderId = await addWorldEntry(db, 'proj-1', 'event', '补遗')
      const undefinedOrderId = await addWorldEntry(db, 'proj-1', 'event', '序章')

      await updateWorldEntryFields(db, numberedId, { timeOrder: 2 })
      await updateWorldEntryFields(db, nullOrderId, { timeOrder: null })

      const events = await getWorldEntries(db, 'proj-1', 'event')
      expect(events.map(entry => entry.name)).toEqual(['终局', '补遗', '序章'])
      expect(events.map(entry => entry.id)).toEqual([numberedId, nullOrderId, undefinedOrderId])
    })
  })

  describe('searchWorldEntries', () => {
    it('should find entries by name partial match (case-insensitive)', async () => {
      await addWorldEntry(db, 'proj-1', 'character', '张三丰')
      await addWorldEntry(db, 'proj-1', 'character', '李四')
      await addWorldEntry(db, 'proj-1', 'character', '张无忌')

      const results = await searchWorldEntries(db, 'proj-1', '张')
      expect(results).toHaveLength(2)
      expect(results.every(e => e.name.includes('张'))).toBe(true)
    })

    it('should find entries by tag match', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')
      await updateWorldEntryFields(db, id1, { tags: ['主角', '武侠'] })
      await updateWorldEntryFields(db, id2, { tags: ['配角', '仙侠'] })

      const results = await searchWorldEntries(db, 'proj-1', '侠')
      expect(results).toHaveLength(2) // Both have tags containing '侠'
    })

    it('should filter search results by type when type is provided', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '张三')
      await addWorldEntry(db, 'proj-1', 'location', '张家庄')
      await updateWorldEntryFields(db, id1, { tags: ['武侠'] })

      const results = await searchWorldEntries(db, 'proj-1', '张', 'character')
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('character')
    })

    it('should exclude soft-deleted entries from search results', async () => {
      await addWorldEntry(db, 'proj-1', 'character', '删除的角色')
      const id = await addWorldEntry(db, 'proj-1', 'character', '保留的角色')

      // Both should be found initially
      let results = await searchWorldEntries(db, 'proj-1', '角色')
      expect(results).toHaveLength(2)

      // Soft delete one
      await softDeleteWorldEntry(db, id)
      results = await searchWorldEntries(db, 'proj-1', '角色')
      expect(results).toHaveLength(1)
    })

    it('should return empty array when no matches found', async () => {
      await addWorldEntry(db, 'proj-1', 'character', '名字')

      const results = await searchWorldEntries(db, 'proj-1', '不存在的词')
      expect(results).toEqual([])
    })
  })

  describe('renameWorldEntry', () => {
    it('should update name and updatedAt', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character')

      await renameWorldEntry(db, id, '新名字')

      const entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('新名字')
      expect(entry!.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('updateWorldEntryFields', () => {
    it('should update type-specific fields for a character', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character')

      await updateWorldEntryFields(db, id, {
        alias: '别名',
        appearance: '英俊潇洒',
        personality: '豪爽仗义',
        background: '出身名门',
        tags: ['主角', '武侠'],
      })

      const entry = await db.worldEntries.get(id)
      expect(entry!.alias).toBe('别名')
      expect(entry!.appearance).toBe('英俊潇洒')
      expect(entry!.personality).toBe('豪爽仗义')
      expect(entry!.background).toBe('出身名门')
      expect(entry!.tags).toEqual(['主角', '武侠'])
    })

    it('should update fields for a location', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'location')

      await updateWorldEntryFields(db, id, {
        description: '一座古城',
        features: '城墙、护城河',
        tags: ['场景'],
      })

      const entry = await db.worldEntries.get(id)
      expect(entry!.description).toBe('一座古城')
      expect(entry!.features).toBe('城墙、护城河')
      expect(entry!.tags).toEqual(['场景'])
    })

    it('should update fields for a rule', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'rule')

      await updateWorldEntryFields(db, id, {
        content: '修炼需要灵气',
        scope: '全世界',
        tags: ['规则'],
      })

      const entry = await db.worldEntries.get(id)
      expect(entry!.content).toBe('修炼需要灵气')
      expect(entry!.scope).toBe('全世界')
    })

    it('should update fields for a timeline entry', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'timeline')

      await updateWorldEntryFields(db, id, {
        timePoint: '第三年春',
        eventDescription: '大战爆发',
        tags: ['重要事件'],
      })

      const entry = await db.worldEntries.get(id)
      expect(entry!.timePoint).toBe('第三年春')
      expect(entry!.eventDescription).toBe('大战爆发')
    })

    it('should do partial updates — only specified fields change', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character')

      await updateWorldEntryFields(db, id, { alias: '别名' })
      let entry = await db.worldEntries.get(id)
      expect(entry!.alias).toBe('别名')
      expect(entry!.name).toBe('未命名角色') // Unchanged

      await updateWorldEntryFields(db, id, { name: '新名字' })
      entry = await db.worldEntries.get(id)
      expect(entry!.name).toBe('新名字')
      expect(entry!.alias).toBe('别名') // Still set from previous update
    })

    it('should set updatedAt on every update', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character')

      await updateWorldEntryFields(db, id, { alias: '别名' })

      const entry = await db.worldEntries.get(id)
      expect(entry!.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('softDeleteWorldEntry', () => {
    it('should set deletedAt and cascade delete related relations', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')
      const id3 = await addWorldEntry(db, 'proj-1', 'character', '角色C')

      // Create relations involving id1
      await addRelation(db, 'proj-1', id1, id2, 'character_relation', '师徒', '是师父')
      await addRelation(db, 'proj-1', id3, id1, 'character_relation', '朋友', '是朋友')

      // Delete id1 — should cascade to both relations
      await softDeleteWorldEntry(db, id1)

      // Entry should be soft-deleted
      const entry = await db.worldEntries.get(id1)
      expect(entry!.deletedAt).not.toBeNull()

      // Both relations involving id1 should also be deleted
      const relations = await db.relations
        .filter(r => r.sourceEntryId === id1 || r.targetEntryId === id1)
        .toArray()
      // All relations involving id1 should have deletedAt set
      const activeRelations = relations.filter(r => r.deletedAt === null)
      expect(activeRelations).toHaveLength(0)

      // getWorldEntries should not return the deleted entry
      const entries = await getWorldEntries(db, 'proj-1')
      expect(entries.find(e => e.id === id1)).toBeUndefined()
    })

    it('should not delete relations unrelated to the deleted entry', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')
      const id3 = await addWorldEntry(db, 'proj-1', 'character', '角色C')

      // Relation between id2 and id3 (not involving id1)
      const relId = await addRelation(db, 'proj-1', id2, id3, 'general', '关联', '属于')

      // Delete id1
      await softDeleteWorldEntry(db, id1)

      // Relation between id2 and id3 should still be active
      const relation = await db.relations.get(relId)
      expect(relation!.deletedAt).toBeNull()
    })
  })

  describe('getWorldEntryById', () => {
    it('should return a single entry by id', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character', '角色')

      const entry = await getWorldEntryById(db, id)
      expect(entry).toBeDefined()
      expect(entry!.name).toBe('角色')
      expect(entry!.type).toBe('character')
    })

    it('should return undefined for non-existent id', async () => {
      const entry = await getWorldEntryById(db, 'nonexistent-id')
      expect(entry).toBeUndefined()
    })
  })

  describe('queryEntriesByKeyword', () => {
    it('should match faction core fields', async () => {
      const factionId = await addWorldEntry(db, 'proj-1', 'faction', '玄镜司')
      await updateWorldEntryFields(db, factionId, {
        factionRole: '监察天下异术',
        factionGoal: '清剿禁术',
        factionStyle: '铁律森严',
      })

      const results = await queryEntriesByKeyword(db, '禁术', 'proj-1')
      expect(results.map(entry => entry.id)).toContain(factionId)
    })

    it('should match secret core fields', async () => {
      const secretId = await addWorldEntry(db, 'proj-1', 'secret', '龙脉真相')
      await updateWorldEntryFields(db, secretId, {
        secretContent: '皇城地下封印着龙脉裂隙',
        secretScope: '皇族内部',
        revealCondition: '祭天仪式失败时暴露',
      })

      const results = await queryEntriesByKeyword(db, '祭天', 'proj-1')
      expect(results.map(entry => entry.id)).toContain(secretId)
    })

    it('should match event core fields', async () => {
      const eventId = await addWorldEntry(db, 'proj-1', 'event', '白塔之变')
      await updateWorldEntryFields(db, eventId, {
        eventDescription: '白塔倒塌引发全城戒严',
        eventImpact: '三大势力停战',
        timePoint: '天启三年冬',
      })

      const results = await queryEntriesByKeyword(db, '停战', 'proj-1')
      expect(results.map(entry => entry.id)).toContain(eventId)
    })
  })

  describe('getEntriesByTypeForContext', () => {
    it('should expose all seven world entry groups', async () => {
      const types = [
        'character',
        'faction',
        'location',
        'rule',
        'secret',
        'event',
        'timeline',
      ] as const

      for (const type of types) {
        await addWorldEntry(db, 'proj-1', type, `${type}-entry`)
      }

      const grouped = await getEntriesByTypeForContext(db, 'proj-1')

      expect(Object.keys(grouped).sort()).toEqual(types.slice().sort())
      expect(grouped.character).toHaveLength(1)
      expect(grouped.faction).toHaveLength(1)
      expect(grouped.location).toHaveLength(1)
      expect(grouped.rule).toHaveLength(1)
      expect(grouped.secret).toHaveLength(1)
      expect(grouped.event).toHaveLength(1)
      expect(grouped.timeline).toHaveLength(1)
    })
  })

  describe('entry name uniqueness', () => {
    it('should allow duplicate names across different types per D-07', async () => {
      await addWorldEntry(db, 'proj-1', 'character', '沧海')
      await addWorldEntry(db, 'proj-1', 'location', '沧海')

      const entries = await getWorldEntries(db, 'proj-1')
      expect(entries).toHaveLength(2)

      const characters = await getWorldEntries(db, 'proj-1', 'character')
      const locations = await getWorldEntries(db, 'proj-1', 'location')
      expect(characters).toHaveLength(1)
      expect(locations).toHaveLength(1)
    })

    it('should allow duplicate names within the same type per D-07', async () => {
      await addWorldEntry(db, 'proj-1', 'character', '张三')
      await addWorldEntry(db, 'proj-1', 'character', '张三')

      const entries = await getWorldEntries(db, 'proj-1', 'character')
      expect(entries).toHaveLength(2)
      // Both entries have the same name but different IDs
      expect(entries[0].id).not.toBe(entries[1].id)
    })
  })

  describe('Dexie v3 migration', () => {
    it('should add worldEntries and relations tables to existing databases', async () => {
      // Verify the tables exist in the schema
      expect(db.worldEntries).toBeDefined()
      expect(db.relations).toBeDefined()

      // Verify we can add entries to the new tables
      const entryId = await addWorldEntry(db, 'proj-1', 'character', '测试角色')
      const relId = await addRelation(db, 'proj-1', entryId, entryId, 'general', 'test', 'test')

      const entry = await db.worldEntries.get(entryId)
      expect(entry).toBeDefined()
      expect(entry!.name).toBe('测试角色')

      const relation = await db.relations.get(relId)
      expect(relation).toBeDefined()
    })
  })

  describe('v13 inferredVoice field (T4)', () => {
    it('persists character inferredVoice with userEdit only', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character', '小明')
      const generatedAt = new Date()
      await updateWorldEntryFields(db, id, {
        inferredVoice: {
          aiDraft: '',
          userEdit: '说话温和，爱用反问句。',
          generatedAt,
        },
      })
      const entry = await db.worldEntries.get(id)
      expect(entry?.inferredVoice?.aiDraft).toBe('')
      expect(entry?.inferredVoice?.userEdit).toBe('说话温和，爱用反问句。')
    })

    it('persists location inferredVoice with aiDraft + userEdit (dual column)', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'location', '青云寺')
      await updateWorldEntryFields(db, id, {
        inferredVoice: {
          aiDraft: '叙述时多用雾、钟声、远山等意象，节奏舒缓。',
          userEdit: '叙述时多用雾、钟声、远山；节奏要再慢一点。',
          generatedAt: new Date(),
        },
      })
      const entry = await db.worldEntries.get(id)
      expect(entry?.inferredVoice?.aiDraft).toBeTruthy()
      expect(entry?.inferredVoice?.userEdit).toBeTruthy()
      // userEdit should differ from aiDraft — we keep the diff.
      expect(entry?.inferredVoice?.userEdit).not.toBe(entry?.inferredVoice?.aiDraft)
    })

    it('leaves inferredVoice undefined on rule + timeline entries (v0.3 scope)', async () => {
      const ruleId = await addWorldEntry(db, 'proj-1', 'rule', '门派规矩')
      const timeId = await addWorldEntry(db, 'proj-1', 'timeline', '开国年')
      const rule = await db.worldEntries.get(ruleId)
      const time = await db.worldEntries.get(timeId)
      expect(rule?.inferredVoice).toBeUndefined()
      expect(time?.inferredVoice).toBeUndefined()
    })

    it('clears inferredVoice by setting it undefined', async () => {
      const id = await addWorldEntry(db, 'proj-1', 'character', '小红')
      await updateWorldEntryFields(db, id, {
        inferredVoice: {
          aiDraft: '',
          userEdit: 'first',
          generatedAt: new Date(),
        },
      })
      await updateWorldEntryFields(db, id, { inferredVoice: undefined })
      const entry = await db.worldEntries.get(id)
      expect(entry?.inferredVoice).toBeUndefined()
    })
  })
})
