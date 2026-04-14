import { describe, it, expect, beforeEach } from 'vitest'
import { createProjectDB } from './project-db'
import type { Chapter } from '../types'

describe('InkForgeProjectDB', () => {
  beforeEach(async () => {
    // Clean up any existing databases
  })

  it('should open a per-project database with projectId suffix', async () => {
    const projectId = 'test-project-1'
    const db = createProjectDB(projectId)

    expect(db.name).toBe(`inkforge-project-${projectId}`)

    // Should have the expected tables
    expect(db.tables.map(t => t.name)).toContain('projects')
    expect(db.tables.map(t => t.name)).toContain('chapters')

    // Add a chapter and verify
    const chapter: Chapter = {
      id: 'chapter-1',
      projectId,
      order: 1,
      title: '第一章 天地初开',
      content: null,
      wordCount: 0,
      status: 'draft',
      outlineSummary: '',
      outlineTargetWordCount: null,
      outlineStatus: 'not_started',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    await db.chapters.add(chapter)
    const stored = await db.chapters.get('chapter-1')
    expect(stored).toBeDefined()
    expect(stored!.title).toBe('第一章 天地初开')
    expect(stored!.projectId).toBe(projectId)

    await db.close()
  })

  it('should support separate databases for different projects', async () => {
    const db1 = createProjectDB('proj-alpha')
    const db2 = createProjectDB('proj-beta')

    await db1.chapters.add({
      id: 'ch-alpha-1',
      projectId: 'proj-alpha',
      order: 1,
      title: 'Alpha Chapter',
      content: null,
      wordCount: 0,
      status: 'draft',
      outlineSummary: '',
      outlineTargetWordCount: null,
      outlineStatus: 'not_started',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    await db2.chapters.add({
      id: 'ch-beta-1',
      projectId: 'proj-beta',
      order: 1,
      title: 'Beta Chapter',
      content: null,
      wordCount: 0,
      status: 'completed',
      outlineSummary: '',
      outlineTargetWordCount: null,
      outlineStatus: 'not_started',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    const alphaChapters = await db1.chapters.toArray()
    const betaChapters = await db2.chapters.toArray()

    expect(alphaChapters).toHaveLength(1)
    expect(alphaChapters[0].title).toBe('Alpha Chapter')
    expect(betaChapters).toHaveLength(1)
    expect(betaChapters[0].title).toBe('Beta Chapter')

    await db1.close()
    await db2.close()
  })
})
