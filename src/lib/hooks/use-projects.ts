'use client'

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaDb } from '../db/meta-db'
import { enqueueChange } from '../sync/sync-queue'
import { syncNewProject } from '../sync/sync-engine'
import { createClient } from '../supabase/client'
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

    // D-37: Immediate sync on new project creation
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await syncNewProject(id, user.id)
    }

    return id
  }, [])

  const updateProject = useCallback(async (id: string, data: Partial<ProjectMeta>): Promise<void> => {
    await metaDb.projectIndex.update(id, {
      ...data,
      updatedAt: new Date(),
    })

    // Queue for cloud sync
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const updated = await metaDb.projectIndex.get(id)
      if (updated) {
        await enqueueChange({
          table: 'projectIndex',
          operation: 'update',
          data: updated as unknown as Record<string, unknown>,
          localUpdatedAt: Date.now(),
          userId: user.id,
        })
      }
    }
  }, [])

  const softDeleteProject = useCallback(async (id: string): Promise<void> => {
    const now = new Date()
    await metaDb.projectIndex.update(id, {
      deletedAt: now,
      updatedAt: now,
    })

    // Queue for cloud sync
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await enqueueChange({
        table: 'projectIndex',
        operation: 'delete',
        data: { id } as Record<string, unknown>,
        localUpdatedAt: Date.now(),
        userId: user.id,
      })
    }
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
