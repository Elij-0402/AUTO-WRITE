import { describe, it, expect, beforeEach } from 'vitest'
import { InkForgeMetaDB } from './meta-db'
import type { ProjectMeta } from '../types'

describe('InkForgeMetaDB', () => {
  let db: InkForgeMetaDB

  beforeEach(async () => {
    // Create a fresh database instance for each test
    db = new InkForgeMetaDB()
    // Clear all data
    await db.projectIndex.clear()
  })

  it('should store a project with correct fields', async () => {
    const project: ProjectMeta = {
      id: 'test-id-1',
      title: '我的小说',
      genre: '玄幻',
      synopsis: '一个修仙的故事',
      coverImageId: null,
      wordCount: 0,
      todayWordCount: 0,
      todayDate: '2026-01-01',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: null,
    }

    await db.projectIndex.add(project)
    const stored = await db.projectIndex.get('test-id-1')

    expect(stored).toBeDefined()
    expect(stored!.id).toBe('test-id-1')
    expect(stored!.title).toBe('我的小说')
    expect(stored!.genre).toBe('玄幻')
    expect(stored!.synopsis).toBe('一个修仙的故事')
    expect(stored!.coverImageId).toBeNull()
    expect(stored!.wordCount).toBe(0)
    expect(stored!.updatedAt).toBeInstanceOf(Date)
    expect(stored!.deletedAt).toBeNull()
  })

  it('should return only non-deleted projects from default queries', async () => {
    const activeProject: ProjectMeta = {
      id: 'active-1',
      title: '活跃项目',
      genre: '都市',
      synopsis: '',
      coverImageId: null,
      wordCount: 100,
      todayWordCount: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    const deletedProject: ProjectMeta = {
      id: 'deleted-1',
      title: '已删除项目',
      genre: '科幻',
      synopsis: '',
      coverImageId: null,
      wordCount: 200,
      todayWordCount: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    }

    await db.projectIndex.bulkAdd([activeProject, deletedProject])

    // Filtered query approach — null deletedAt indicates active
    const allActive = await db.projectIndex
      .filter(p => p.deletedAt === null)
      .toArray()

    expect(allActive).toHaveLength(1)
    expect(allActive[0].id).toBe('active-1')
  })

  it('should soft-delete a project by setting deletedAt', async () => {
    const project: ProjectMeta = {
      id: 'to-delete',
      title: '待删除',
      genre: '武侠',
      synopsis: '',
      coverImageId: null,
      wordCount: 0,
      todayWordCount: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    await db.projectIndex.add(project)

    // Soft delete
    const now = new Date()
    await db.projectIndex.update('to-delete', { deletedAt: now, updatedAt: now })

    const updated = await db.projectIndex.get('to-delete')
    expect(updated!.deletedAt).toBeInstanceOf(Date)
    expect(updated!.deletedAt).not.toBeNull()

    // Should be excluded from active queries
    const active = await db.projectIndex
      .filter(p => p.deletedAt === null)
      .toArray()
    expect(active).toHaveLength(0)
  })
})
