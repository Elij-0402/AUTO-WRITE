import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjects } from './use-projects'
import { metaDb } from '../db/meta-db'
import { createProjectDB, __resetProjectDBCache } from '../db/project-db'

// We need to test the hook without actual React reactive queries
// since useLiveQuery requires a DexieProvider. For unit tests,
// we test the underlying logic.

describe('useProjects', () => {
  beforeEach(async () => {
    await metaDb.projectIndex.clear()
    __resetProjectDBCache()
  })

  it('should create a project with generated NanoID', async () => {
    const { result } = renderHook(() => useProjects())

    let createdId: string | undefined

    await act(async () => {
      createdId = await result.current.createProject({
        title: '测试小说',
        genre: '玄幻',
        synopsis: '测试简介',
      })
    })

    expect(createdId).toBeDefined()
    expect(createdId!.length).toBeGreaterThan(0)

    // Verify stored in database
    const stored = await metaDb.projectIndex.get(createdId!)
    const mirrored = await createProjectDB(createdId!).projects.get(createdId!)
    expect(stored).toBeDefined()
    expect(mirrored).toBeDefined()
    expect(stored!.title).toBe('测试小说')
    expect(mirrored!.title).toBe('测试小说')
    expect(stored!.genre).toBe('玄幻')
    expect(stored!.synopsis).toBe('测试简介')
    expect(stored!.deletedAt).toBeNull()
    expect(stored!.wordCount).toBe(0)
  })

  it('should list projects sorted by updatedAt descending', async () => {
    const now = new Date()

    await metaDb.projectIndex.bulkAdd([
      {
        id: 'old-project',
        title: '旧项目',
        genre: '武侠',
        synopsis: '',
        coverImageId: null,
        wordCount: 1000,
        todayWordCount: 0,
        todayDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date(now.getTime() - 86400000),
        updatedAt: new Date(now.getTime() - 86400000),
        deletedAt: null,
      },
      {
        id: 'new-project',
        title: '新项目',
        genre: '都市',
        synopsis: '',
        coverImageId: null,
        wordCount: 500,
        todayWordCount: 0,
        todayDate: new Date().toISOString().slice(0, 10),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ])

    const allProjects = await metaDb.projectIndex
      .filter(p => p.deletedAt === null)
      .reverse()
      .sortBy('updatedAt')

    expect(allProjects[0].id).toBe('new-project')
    expect(allProjects[1].id).toBe('old-project')
  })

  it('should soft-delete a project', async () => {
    await metaDb.projectIndex.add({
      id: 'delete-me',
      title: '待删除',
      genre: '仙侠',
      synopsis: '',
      coverImageId: null,
      wordCount: 0,
      todayWordCount: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    const { result } = renderHook(() => useProjects())

    await act(async () => {
      await result.current.softDeleteProject('delete-me')
    })

    const stored = await metaDb.projectIndex.get('delete-me')
    const mirrored = await createProjectDB('delete-me').projects.get('delete-me')
    expect(stored!.deletedAt).not.toBeNull()
    expect(mirrored!.deletedAt).not.toBeNull()
  })

  it('should restore a soft-deleted project', async () => {
    await metaDb.projectIndex.add({
      id: 'restore-me',
      title: '待恢复',
      genre: '历史',
      synopsis: '',
      coverImageId: null,
      wordCount: 0,
      todayWordCount: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    })

    const { result } = renderHook(() => useProjects())

    await act(async () => {
      await result.current.restoreProject('restore-me')
    })

    const stored = await metaDb.projectIndex.get('restore-me')
    const mirrored = await createProjectDB('restore-me').projects.get('restore-me')
    expect(stored!.deletedAt).toBeNull()
    expect(mirrored!.deletedAt).toBeNull()
  })

  it('should update project metadata', async () => {
    await metaDb.projectIndex.add({
      id: 'update-me',
      title: '原标题',
      genre: '玄幻',
      synopsis: '',
      coverImageId: null,
      wordCount: 0,
      todayWordCount: 0,
      todayDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    const { result } = renderHook(() => useProjects())

    await act(async () => {
      await result.current.updateProject('update-me', {
        title: '新标题',
        genre: '都市',
      })
    })

    const stored = await metaDb.projectIndex.get('update-me')
    const mirrored = await createProjectDB('update-me').projects.get('update-me')
    expect(stored!.title).toBe('新标题')
    expect(stored!.genre).toBe('都市')
    expect(mirrored!.title).toBe('新标题')
    expect(mirrored!.genre).toBe('都市')
  })
})
