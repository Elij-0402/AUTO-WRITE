'use client'

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaDb } from '../db/meta-db'
import { createProjectDB } from '../db/project-db'
import { enqueueChange } from '../sync/sync-queue'
import { syncNewProject } from '../sync/sync-engine'
import { createClient } from '../supabase/client'
import { createDefaultProjectCharter } from '../types'
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

    const projectDb = createProjectDB(id)

    await metaDb.projectIndex.add(project)
    await projectDb.projects.put(project)
    await projectDb.projectCharter.put(createDefaultProjectCharter(id))

    // D-37: Immediate sync on new project creation
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await syncNewProject(id, user.id)
    }

    return id
  }, [])

  const updateProject = useCallback(async (id: string, data: Partial<ProjectMeta>): Promise<void> => {
    const existing = await metaDb.projectIndex.get(id) ?? await createProjectDB(id).projects.get(id)
    if (!existing) return

    const updatedProject = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    }

    await metaDb.projectIndex.put(updatedProject)
    await createProjectDB(id).projects.put(updatedProject)

    // Queue for cloud sync
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await enqueueChange({
        table: 'projectIndex',
        operation: 'update',
        data: updatedProject as unknown as Record<string, unknown>,
        localUpdatedAt: Date.now(),
        userId: user.id,
      })
    }
  }, [])

  const softDeleteProject = useCallback(async (id: string): Promise<void> => {
    const now = new Date()
    const existing = await metaDb.projectIndex.get(id) ?? await createProjectDB(id).projects.get(id)
    if (existing) {
      const deletedProject = { ...existing, deletedAt: now, updatedAt: now }
      await metaDb.projectIndex.put(deletedProject)
      await createProjectDB(id).projects.put(deletedProject)
    }

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
    const now = new Date()
    const existing = await metaDb.projectIndex.get(id) ?? await createProjectDB(id).projects.get(id)
    if (existing) {
      const restoredProject = { ...existing, deletedAt: null, updatedAt: now }
      await metaDb.projectIndex.put(restoredProject)
      await createProjectDB(id).projects.put(restoredProject)
    }
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
