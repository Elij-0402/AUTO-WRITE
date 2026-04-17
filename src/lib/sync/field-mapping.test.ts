import { describe, it, expect } from 'vitest'
import { mapCloudToLocal, mapLocalToCloud } from './field-mapping'

describe('field-mapping', () => {
  describe('mapCloudToLocal', () => {
    it('prefers updated_at over localUpdatedAt when both present', () => {
      const result = mapCloudToLocal('chapters', {
        id: 'c1',
        updated_at: '2026-04-18T10:00:00Z',
        localUpdatedAt: 123,
      })
      expect(result.updatedAt).toBe('2026-04-18T10:00:00Z')
      expect(result.localUpdatedAt).toBeUndefined()
      expect(result.updated_at).toBeUndefined()
    })

    it('falls back to localUpdatedAt when updated_at missing', () => {
      const result = mapCloudToLocal('chapters', {
        id: 'c1',
        localUpdatedAt: 456,
      })
      expect(result.updatedAt).toBe(456)
    })

    it('normalizes created_at and deleted_at to camel', () => {
      const result = mapCloudToLocal('worldEntries', {
        id: 'w1',
        created_at: '2026-04-01',
        deleted_at: '2026-04-10',
      })
      expect(result.createdAt).toBe('2026-04-01')
      expect(result.deletedAt).toBe('2026-04-10')
      expect(result.created_at).toBeUndefined()
      expect(result.deleted_at).toBeUndefined()
    })

    it('defaults deletedAt to null when absent', () => {
      const result = mapCloudToLocal('chapters', { id: 'c1' })
      expect(result.deletedAt).toBeNull()
    })

    it('strips user_id from local view', () => {
      const result = mapCloudToLocal('chapters', { id: 'c1', user_id: 'u1' })
      expect(result.user_id).toBeUndefined()
    })

    it('passes through unknown fields', () => {
      const result = mapCloudToLocal('chapters', {
        id: 'c1',
        title: 'Hello',
        wordCount: 100,
        custom_field: 'x',
      })
      expect(result.title).toBe('Hello')
      expect(result.wordCount).toBe(100)
      expect(result.custom_field).toBe('x')
    })

    it('keeps existing camel values over snake when both present', () => {
      const result = mapCloudToLocal('chapters', {
        id: 'c1',
        createdAt: 'camel-wins',
        created_at: 'snake-loses',
      })
      expect(result.createdAt).toBe('camel-wins')
    })
  })

  describe('mapLocalToCloud', () => {
    it('attaches user_id and localUpdatedAt', () => {
      const result = mapLocalToCloud(
        'chapters',
        { id: 'c1', title: 'Hi' },
        'user-42',
        999
      )
      expect(result.user_id).toBe('user-42')
      expect(result.localUpdatedAt).toBe(999)
      expect(result.id).toBe('c1')
      expect(result.title).toBe('Hi')
    })

    it('preserves id ordering against spread', () => {
      const result = mapLocalToCloud(
        'chapters',
        { title: 'Hi', id: 'c1' },
        'u',
        1
      )
      expect(result.id).toBe('c1')
    })
  })
})
