'use client'

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaDb } from '../db/meta-db'
import type { ProjectMeta, CreateProjectInput } from '../types'

/**
 * Hook for project CRUD operations with reactive Dexie queries.
 * Per D-05: projects ordered by most recently edited.
 * Per D-06: soft delete with confirmation.
 * Per D-26: NanoID for entity IDs.
 */
export function useProjects() {
  // Reactive query: all non-deleted projects sorted by updatedAt descending
  const projects = useLiveQuery(
    () =>
      metaDb.projectIndex
        .filter(p => p.deletedAt === null)
        .reverse()
        .sortBy('updatedAt'),
    [],
    [] // default to empty array while loading
  )

  const createProject = useCallback(async (input: CreateProjectInput): Promise<string> => {
    const { nanoid } = await import('nanoid')
    const id = nanoid()
    const now = new Date()

    const project: ProjectMeta = {
      id,
      title: input.title,
      genre: input.genre ?? '',
      synopsis: input.synopsis ?? '',
      coverImageId: null,
      wordCount: 0,
      todayWordCount: 0,
      todayDate: now.toISOString().split('T')[0],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }

    await metaDb.projectIndex.add(project)
    return id
  }, [])

  const updateProject = useCallback(async (id: string, data: Partial<ProjectMeta>): Promise<void> => {
    await metaDb.projectIndex.update(id, {
      ...data,
      updatedAt: new Date(),
    })
  }, [])

  const softDeleteProject = useCallback(async (id: string): Promise<void> => {
    const now = new Date()
    await metaDb.projectIndex.update(id, {
      deletedAt: now,
      updatedAt: now,
    })
  }, [])

  const restoreProject = useCallback(async (id: string): Promise<void> => {
    await metaDb.projectIndex.update(id, {
      deletedAt: null,
      updatedAt: new Date(),
    })
  }, [])

  return {
    projects,
    loading: projects === undefined,
    createProject,
    updateProject,
    softDeleteProject,
    restoreProject,
  }
}
