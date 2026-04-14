import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createProjectDB, type InkForgeProjectDB } from './project-db'
import {
  addWorldEntry,
} from './world-entry-queries'
import {
  getRelationsForEntry,
  addRelation,
  deleteRelation,
  getRelationCount,
} from './relation-queries'

describe('relation-queries', () => {
  let db: InkForgeProjectDB
  let testCounter = 0

  beforeEach(async () => {
    testCounter++
    db = createProjectDB(`test-relation-${testCounter}`)
  })

  afterEach(async () => {
    await db.close()
  })

  describe('addRelation', () => {
    it('should create a character_relation between two entries', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '张三')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '李四')

      const relId = await addRelation(db, 'proj-1', id1, id2, 'character_relation', '师徒', '是师父')

      const relation = await db.relations.get(relId)
      expect(relation).toBeDefined()
      expect(relation!.id).toBe(relId)
      expect(relation!.projectId).toBe('proj-1')
      expect(relation!.sourceEntryId).toBe(id1)
      expect(relation!.targetEntryId).toBe(id2)
      expect(relation!.category).toBe('character_relation')
      expect(relation!.description).toBe('师徒')
      expect(relation!.sourceToTargetLabel).toBe('是师父')
      expect(relation!.deletedAt).toBeNull()
      expect(relation!.createdAt).toBeInstanceOf(Date)
    })

    it('should create a general relation between entries', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色')
      const id2 = await addWorldEntry(db, 'proj-1', 'location', '地点')

      const relId = await addRelation(db, 'proj-1', id1, id2, 'general', '居住', '住在')

      const relation = await db.relations.get(relId)
      expect(relation!.category).toBe('general')
      expect(relation!.description).toBe('居住')
      expect(relation!.sourceToTargetLabel).toBe('住在')
    })

    it('should assign NanoID-based id to each relation', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', 'A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', 'B')

      const id3 = await addRelation(db, 'proj-1', id1, id2, 'character_relation', '朋友', '是朋友')
      const id4 = await addRelation(db, 'proj-1', id1, id2, 'general', '关联', '属于')

      expect(id3).toBeDefined()
      expect(id4).toBeDefined()
      expect(id3).not.toBe(id4)
      expect(id3.length).toBeGreaterThan(0)
    })
  })

  describe('getRelationsForEntry', () => {
    it('should return all non-deleted relations where entry is source OR target (bidirectional per D-22)', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')
      const id3 = await addWorldEntry(db, 'proj-1', 'character', '角色C')

      // id1 is source in this relation
      await addRelation(db, 'proj-1', id1, id2, 'character_relation', '师徒', '是师父')
      // id1 is target in this relation
      await addRelation(db, 'proj-1', id3, id1, 'general', '盟友', '属于')

      // id2 is source, id3 is target — NOT involving id1
      await addRelation(db, 'proj-1', id2, id3, 'character_relation', '敌人', '是敌人')

      const relationsForA = await getRelationsForEntry(db, id1)
      expect(relationsForA).toHaveLength(2)
      // Both should involve id1
      expect(relationsForA.every(r =>
        r.sourceEntryId === id1 || r.targetEntryId === id1
      )).toBe(true)
    })

    it('should not include soft-deleted relations', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')

      const relId = await addRelation(db, 'proj-1', id1, id2, 'general', '关联', '属于')

      // Soft delete the relation
      await deleteRelation(db, relId)

      const relations = await getRelationsForEntry(db, id1)
      expect(relations).toHaveLength(0)
    })

    it('should return empty array when no relations exist for entry', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')

      const relations = await getRelationsForEntry(db, id1)
      expect(relations).toEqual([])
    })
  })

  describe('deleteRelation', () => {
    it('should soft-delete a relation by setting deletedAt', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')

      const relId = await addRelation(db, 'proj-1', id1, id2, 'general', '关联', '属于')

      await deleteRelation(db, relId)

      const relation = await db.relations.get(relId)
      expect(relation!.deletedAt).not.toBeNull()

      // Should not appear in getRelationsForEntry results
      const relations = await getRelationsForEntry(db, id1)
      expect(relations).toHaveLength(0)
    })
  })

  describe('getRelationCount', () => {
    it('should return count of non-deleted relations for an entry', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')
      const id3 = await addWorldEntry(db, 'proj-1', 'character', '角色C')

      await addRelation(db, 'proj-1', id1, id2, 'general', '关联1', '属于1')
      await addRelation(db, 'proj-1', id1, id3, 'general', '关联2', '属于2')

      const count = await getRelationCount(db, id1)
      expect(count).toBe(2)
    })

    it('should count bidirectional relations (entry as both source and target)', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')
      const id3 = await addWorldEntry(db, 'proj-1', 'character', '角色C')

      // id1 is source
      await addRelation(db, 'proj-1', id1, id2, 'general', '关联', '属于')
      // id1 is target
      await addRelation(db, 'proj-1', id3, id1, 'general', '关联', '属于')

      const count = await getRelationCount(db, id1)
      expect(count).toBe(2)
    })

    it('should not count soft-deleted relations', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')
      const id2 = await addWorldEntry(db, 'proj-1', 'character', '角色B')

      const relId = await addRelation(db, 'proj-1', id1, id2, 'general', '关联', '属于')

      await deleteRelation(db, relId)

      const count = await getRelationCount(db, id1)
      expect(count).toBe(0)
    })

    it('should return 0 when no relations exist for an entry', async () => {
      const id1 = await addWorldEntry(db, 'proj-1', 'character', '角色A')

      const count = await getRelationCount(db, id1)
      expect(count).toBe(0)
    })
  })
})