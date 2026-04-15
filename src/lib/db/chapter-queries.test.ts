import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createProjectDB, type InkForgeProjectDB } from './project-db'
import {
  getChapters,
  addChapter,
  reorderChapters,
  renameChapter,
  softDeleteChapter,
  duplicateChapter,
  updateChapterContent,
  updateChapterStatus,
  getChapterNumber,
} from './chapter-queries'
import type { Chapter } from '../types'

describe('chapter-queries', () => {
  let db: InkForgeProjectDB
  let testCounter = 0

  beforeEach(async () => {
    // Use unique database name per test to avoid state leakage
    testCounter++
    db = createProjectDB(`test-chapter-queries-${testCounter}`)
  })

  afterEach(async () => {
    await db.close()
  })

  describe('addChapter', () => {
    it('should add a chapter with correct fields and auto-incremented order', async () => {
      const id1 = await addChapter(db, 'proj-1', '天地初开')
      expect(id1).toBeDefined()

      const chapters = await db.chapters.toArray()
      expect(chapters).toHaveLength(1)
      expect(chapters[0].title).toBe('天地初开')
      expect(chapters[0].order).toBe(0) // First chapter has order 0
      expect(chapters[0].status).toBe('draft')
      expect(chapters[0].content).toBeNull()
      expect(chapters[0].wordCount).toBe(0)
      expect(chapters[0].deletedAt).toBeNull()
      expect(chapters[0].projectId).toBe('proj-1')
    })

    it('should auto-increment order for subsequent chapters', async () => {
      await addChapter(db, 'proj-1', '第一章')
      await addChapter(db, 'proj-1', '第二章')
      await addChapter(db, 'proj-1', '第三章')

      const chapters = await getChapters(db) // Returns sorted by order
      expect(chapters).toHaveLength(3)
      expect(chapters[0].order).toBe(0)
      expect(chapters[1].order).toBe(1)
      expect(chapters[2].order).toBe(2)
    })

    it('should assign NanoID-based id to each chapter', async () => {
      const id1 = await addChapter(db, 'proj-1', '第一章')
      const id2 = await addChapter(db, 'proj-1', '第二章')

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      // NanoID generates IDs of length 21
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('getChapters', () => {
    it('should return all non-deleted chapters ordered by order ascending', async () => {
      await addChapter(db, 'proj-1', '第三章')
      await addChapter(db, 'proj-1', '第一章')
      await addChapter(db, 'proj-1', '第二章')

      const chapters = await getChapters(db)
      expect(chapters).toHaveLength(3)
      // Should be ordered by order field ascending
      expect(chapters[0].order).toBeLessThan(chapters[1].order)
      expect(chapters[1].order).toBeLessThan(chapters[2].order)
    })

    it('should exclude soft-deleted chapters', async () => {
      await addChapter(db, 'proj-1', '第一章')
      const id2 = await addChapter(db, 'proj-1', '第二章')
      await addChapter(db, 'proj-1', '第三章')

      // Soft delete the middle chapter
      await softDeleteChapter(db, id2)

      const chapters = await getChapters(db)
      expect(chapters).toHaveLength(2)
      expect(chapters.find(c => c.id === id2)).toBeUndefined()
    })
  })

  describe('reorderChapters', () => {
    it('should update order fields atomically for all affected chapters', async () => {
      const id1 = await addChapter(db, 'proj-1', '第一章')
      const id2 = await addChapter(db, 'proj-1', '第二章')
      const id3 = await addChapter(db, 'proj-1', '第三章')

      // Reverse the order: 3, 2, 1
      await reorderChapters(db, [id3, id2, id1])

      const chapters = await getChapters(db)
      expect(chapters[0].id).toBe(id3)
      expect(chapters[0].order).toBe(0)
      expect(chapters[1].id).toBe(id2)
      expect(chapters[1].order).toBe(1)
      expect(chapters[2].id).toBe(id1)
      expect(chapters[2].order).toBe(2)
    })

    it('should handle partial reorder correctly', async () => {
      const id1 = await addChapter(db, 'proj-1', '第一章')
      const id2 = await addChapter(db, 'proj-1', '第二章')
      const id3 = await addChapter(db, 'proj-1', '第三章')

      // Move chapter 1 to the middle: 2, 1, 3
      await reorderChapters(db, [id2, id1, id3])

      const chapters = await getChapters(db)
      expect(chapters[0].id).toBe(id2)
      expect(chapters[0].order).toBe(0)
      expect(chapters[1].id).toBe(id1)
      expect(chapters[1].order).toBe(1)
      expect(chapters[2].id).toBe(id3)
      expect(chapters[2].order).toBe(2)
    })
  })

  describe('renameChapter', () => {
    it('should update title and updatedAt', async () => {
      const id = await addChapter(db, 'proj-1', '原标题')

      await renameChapter(db, id, '新标题')

      const chapter = await db.chapters.get(id)
      expect(chapter!.title).toBe('新标题')
      // updatedAt should be updated
      expect(chapter!.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('softDeleteChapter', () => {
    it('should set deletedAt and reorder remaining chapters', async () => {
      const id1 = await addChapter(db, 'proj-1', '第一章')
      const id2 = await addChapter(db, 'proj-1', '第二章')
      const id3 = await addChapter(db, 'proj-1', '第三章')

      // Delete the second chapter
      await softDeleteChapter(db, id2)

      const chapters = await getChapters(db)
      expect(chapters).toHaveLength(2)
      // Remaining chapters should be reordered
      expect(chapters[0].id).toBe(id1)
      expect(chapters[0].order).toBe(0)
      expect(chapters[1].id).toBe(id3)
      expect(chapters[1].order).toBe(1)

      // Deleted chapter should still exist but with deletedAt
      const deletedChapter = await db.chapters.get(id2)
      expect(deletedChapter!.deletedAt).not.toBeNull()
    })
  })

  describe('duplicateChapter', () => {
    it('should create a copy with （副本）suffix in title, placed after original', async () => {
      const id1 = await addChapter(db, 'proj-1', '风云际会')

      const dupId = await duplicateChapter(db, id1)

      const chapters = await getChapters(db)
      expect(chapters).toHaveLength(2)

      const duplicate = chapters.find(c => c.id === dupId)
      expect(duplicate).toBeDefined()
      expect(duplicate!.title).toBe('风云际会（副本）')
      expect(duplicate!.order).toBe(1) // Placed after original (order 0)
      expect(duplicate!.status).toBe('draft')
      expect(duplicate!.projectId).toBe('proj-1')
    })

    it('should copy content from original chapter', async () => {
      const id = await addChapter(db, 'proj-1', '有内容章节')

      // Update content
      const content = { type: 'doc', content: 'some content' }
      await updateChapterContent(db, id, content)

      await duplicateChapter(db, id)

      const chapters = await getChapters(db)
      const duplicate = chapters.find(c => c.title === '有内容章节（副本）')
      expect(duplicate).toBeDefined()
      expect(duplicate!.content).toEqual(content)
    })
  })

  describe('updateChapterContent', () => {
    it('should update content and wordCount', async () => {
      const id = await addChapter(db, 'proj-1', '第一章')

      // Tiptap document format: nodes with text content
      const content = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '这是测试内容' }] }
        ]
      }
      await updateChapterContent(db, id, content)

      const chapter = await db.chapters.get(id)
      expect(chapter!.content).toEqual(content)
      // wordCount should be precomputed (count Chinese chars minus whitespace)
      // "这是测试内容" has 6 non-whitespace characters
      expect(chapter!.wordCount).toBe(6)
    })
  })

  describe('updateChapterStatus', () => {
    it('should update status and updatedAt', async () => {
      const id = await addChapter(db, 'proj-1', '第一章')

      await updateChapterStatus(db, id, 'completed')

      const chapter = await db.chapters.get(id)
      expect(chapter!.status).toBe('completed')
      expect(chapter!.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('getChapterNumber', () => {
    it('should return 第1章 for order 0', () => {
      expect(getChapterNumber(0)).toBe('第1章')
    })

    it('should return 第5章 for order 4', () => {
      expect(getChapterNumber(4)).toBe('第5章')
    })

    it('should return 第10章 for order 9', () => {
      expect(getChapterNumber(9)).toBe('第10章')
    })
  })
})