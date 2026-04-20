'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB, type Contradiction as DBDual } from '../db/project-db'
import type { WorldEntryType } from '../types'

export type Contradiction = DBDual

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export function useContradictions(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const all = useLiveQuery(
    () =>
      db.contradictions
        .where('projectId')
        .equals(projectId)
        .sortBy('createdAt'),
    [db, projectId],
    [] as Contradiction[]
  )

  const byEntry = useLiveQuery(
    () =>
      db.contradictions
        .where('projectId')
        .equals(projectId)
        .toArray()
        .then(rows => {
          const map = new Map<string, Contradiction[]>()
          for (const row of rows) {
            const existing = map.get(row.entryName) ?? []
            existing.push(row)
            map.set(row.entryName, existing)
          }
          return map
        }),
    [db, projectId],
    new Map<string, Contradiction[]>()
  )

  const entriesWithBadge = useLiveQuery(
    async (): Promise<Array<{ entryName: string; entryType: WorldEntryType; count: number }>> => {
      if (!all) return []
      const now = Date.now()
      const cutoff = now - SEVEN_DAYS
      const recent = all.filter(r => r.createdAt >= cutoff)
      const map = new Map<string, { entryType: WorldEntryType; count: number }>()
      for (const r of recent) {
        if (r.exempted) continue
        const existing = map.get(r.entryName)
        if (existing) {
          existing.count++
        } else {
          map.set(r.entryName, { entryType: r.entryType, count: 1 })
        }
      }
      return [...map.entries()]
        .filter(([, v]) => v.count >= 3)
        .map(([entryName, v]) => ({ entryName, entryType: v.entryType, count: v.count }))
    },
    [all],
    []
  )

  return { contradictions: all ?? [], byEntry: byEntry ?? new Map(), entriesWithBadge }
}
