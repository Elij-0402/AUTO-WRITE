import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConsistencyExemptions } from './use-consistency-exemptions'

// All mock state must be defined at top level so vi.mock can reference them
const deleteSpy = vi.fn()
const updateSpy = vi.fn()
const exemptionsWhereSpy = vi.fn()
const contradictionsWhereSpy = vi.fn()
const exemptionsEqualsSpy = vi.fn()
const contradictionsEqualsSpy = vi.fn()

const mockDb = {
  consistencyExemptions: {
    where: exemptionsWhereSpy,
    delete: deleteSpy,
  },
  contradictions: {
    where: contradictionsWhereSpy,
    update: updateSpy,
  },
}

// Mock useLiveQuery
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

// Mock project-db before importing the hook
vi.mock('../db/project-db', () => ({
  createProjectDB: () => mockDb,
}))

import { useLiveQuery } from 'dexie-react-hooks'

describe('useConsistencyExemptions', () => {
  beforeEach(() => {
    vi.mocked(useLiveQuery).mockReset()
    vi.mocked(useLiveQuery).mockReturnValue([])
    deleteSpy.mockClear()
    updateSpy.mockClear()
    exemptionsWhereSpy.mockClear()
    contradictionsWhereSpy.mockClear()
    exemptionsEqualsSpy.mockClear()
    contradictionsEqualsSpy.mockClear()
  })

  describe('revokeExemption', () => {
    it('deletes exemption record and unmarks all matching contradiction rows', async () => {
      const projectId = 'test-project'
      const entryName = '张三'
      const entryType = 'character'

      // Mock exemption record
      const mockExemption = {
        id: 'exemption-1',
        projectId,
        exemptionKey: `${entryName}:${entryType}`,
        createdAt: Date.now(),
        note: '豁免',
      }

      // Mock contradiction rows
      const mockContradictions = [
        { id: 'c1', projectId, entryName, entryType, exempted: true },
        { id: 'c2', projectId, entryName, entryType, exempted: true },
        { id: 'c3', projectId, entryName, entryType, exempted: false },
      ]

      exemptionsWhereSpy.mockReturnValue({
        equals: exemptionsEqualsSpy.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([mockExemption]),
        }),
      })

      contradictionsWhereSpy.mockReturnValue({
        equals: contradictionsEqualsSpy.mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockContradictions),
        }),
      })

      const { result } = renderHook(() => useConsistencyExemptions(projectId))

      expect(result.current.revokeExemption).toBeDefined()

      await act(async () => {
        await result.current.revokeExemption(entryName, entryType)
      })

      // Verify the exemption record was deleted
      expect(deleteSpy).toHaveBeenCalledWith('exemption-1')

      // Verify matching exempted rows were unmarked (c1 and c2, not c3)
      expect(updateSpy).toHaveBeenCalledWith('c1', { exempted: false })
      expect(updateSpy).toHaveBeenCalledWith('c2', { exempted: false })
      expect(updateSpy).not.toHaveBeenCalledWith('c3', expect.anything())
    })

    it('handles case where no exemption exists', async () => {
      const projectId = 'test-project'
      const entryName = '不存在的条目'
      const entryType = 'character'

      exemptionsWhereSpy.mockReturnValue({
        equals: exemptionsEqualsSpy.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      })

      contradictionsWhereSpy.mockReturnValue({
        equals: contradictionsEqualsSpy.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      })

      const { result } = renderHook(() => useConsistencyExemptions(projectId))

      await act(async () => {
        await result.current.revokeExemption(entryName, entryType)
      })

      // Should not call delete when no exemption exists
      expect(deleteSpy).not.toHaveBeenCalled()
      // Should not update any rows when no exemption found
      expect(updateSpy).not.toHaveBeenCalled()
    })
  })
})