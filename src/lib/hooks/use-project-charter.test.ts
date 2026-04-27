import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProjectCharter } from './use-project-charter'

const getProjectCharterSnapshot = vi.fn()
const saveProjectCharter = vi.fn()

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

vi.mock('../db/project-charter-queries', () => ({
  getProjectCharter: vi.fn(),
  getProjectCharterSnapshot: (...args: unknown[]) => getProjectCharterSnapshot(...args),
  saveProjectCharter: (...args: unknown[]) => saveProjectCharter(...args),
}))

import { useLiveQuery } from 'dexie-react-hooks'

describe('useProjectCharter', () => {
  beforeEach(() => {
    vi.mocked(useLiveQuery).mockReset()
    getProjectCharterSnapshot.mockReset()
    saveProjectCharter.mockReset()
  })

  it('reads charter data through the snapshot query, not the write-through getter', async () => {
    const expected = {
      id: 'charter',
      projectId: 'project-1',
      oneLinePremise: '',
      storyPromise: '',
      themes: [],
      tone: '',
      targetReader: '',
      styleDos: [],
      tabooList: [],
      positiveReferences: [],
      negativeReferences: [],
      aiUnderstanding: '',
      createdAt: 1,
      updatedAt: 1,
    }

    vi.mocked(useLiveQuery).mockImplementation((query) => {
      void query()
      return expected
    })
    getProjectCharterSnapshot.mockResolvedValue(expected)

    const { result } = renderHook(() => useProjectCharter('project-1'))

    expect(getProjectCharterSnapshot).toHaveBeenCalledWith('project-1')
    expect(result.current.charter).toEqual(expected)
  })
})
