import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { __resetProjectDBCache, createProjectDB } from '../db/project-db'
import { createIdeaNote, createStoryArc } from '../db/planning-queries'
import { usePlanning } from './use-planning'

describe('usePlanning', () => {
  const projectId = 'use-planning-hook'

  beforeEach(async () => {
    __resetProjectDBCache()
    await Dexie.delete(`inkforge-project-${projectId}`)
  })

  afterEach(async () => {
    __resetProjectDBCache()
    await Dexie.delete(`inkforge-project-${projectId}`)
  })

  it('returns grouped planning rows ordered for the planning sidebar', async () => {
    const db = createProjectDB(projectId)
    await createIdeaNote(db, projectId, {
      title: '雨夜宫变',
      premise: '一个将军之女被迫卷入废立之争',
    })
    await createStoryArc(db, projectId, {
      title: '第二卷',
      order: 2,
    })
    await createStoryArc(db, projectId, {
      title: '第一卷',
      order: 1,
    })

    const { result } = renderHook(() => usePlanning(projectId))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.snapshot.ideaNotes).toHaveLength(1)
    expect(result.current.snapshot.storyArcs.map((arc) => arc.title)).toEqual([
      '第一卷',
      '第二卷',
    ])
  })
})
