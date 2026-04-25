import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProjectMeta } from './use-project-meta'
import { metaDb } from '../db/meta-db'
import { createProjectDB, __resetProjectDBCache } from '../db/project-db'
import type { ProjectMeta } from '../types'

const PROJECT: ProjectMeta = {
  id: 'meta-hook-project',
  title: '深链测试项目',
  genre: '科幻',
  synopsis: '用于测试项目元数据回填',
  coverImageId: null,
  wordCount: 1200,
  todayWordCount: 300,
  todayDate: '2026-04-26',
  createdAt: new Date('2026-04-26T00:00:00.000Z'),
  updatedAt: new Date('2026-04-26T00:00:00.000Z'),
  deletedAt: null,
}

describe('useProjectMeta', () => {
  beforeEach(async () => {
    await metaDb.projectIndex.clear()
    __resetProjectDBCache()
  })

  it('returns mirrored project data and backfills meta db', async () => {
    await createProjectDB(PROJECT.id).projects.put(PROJECT)

    const { result } = renderHook(() => useProjectMeta(PROJECT.id))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.project?.title).toBe(PROJECT.title)
    })

    await waitFor(async () => {
      const mirrored = await metaDb.projectIndex.get(PROJECT.id)
      expect(mirrored?.title).toBe(PROJECT.title)
    })
  })

  it('backfills per-project mirror from meta db', async () => {
    await metaDb.projectIndex.put(PROJECT)

    const { result } = renderHook(() => useProjectMeta(PROJECT.id))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.project?.title).toBe(PROJECT.title)
    })

    await waitFor(async () => {
      const mirrored = await createProjectDB(PROJECT.id).projects.get(PROJECT.id)
      expect(mirrored?.title).toBe(PROJECT.title)
    })
  })
})
