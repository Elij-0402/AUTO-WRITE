'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createProjectDB } from '../db/project-db'
import {
  createChapterPlan,
  createIdeaNote,
  createStoryArc,
  listPlanningSnapshot,
  updateChapterPlan,
  updateIdeaNote,
  updateStoryArc,
} from '../db/planning-queries'
import type {
  CreateChapterPlanInput,
  CreateIdeaNoteInput,
  CreateStoryArcInput,
  PlanningSnapshot,
} from '../types'

const EMPTY_SNAPSHOT: PlanningSnapshot = {
  ideaNotes: [],
  storyArcs: [],
  chapterPlans: [],
  sceneCards: [],
}

export function usePlanning(projectId: string) {
  const db = useMemo(() => createProjectDB(projectId), [projectId])

  const snapshot = useLiveQuery(
    () => listPlanningSnapshot(db, projectId),
    [db, projectId],
    null
  )

  return {
    db,
    snapshot: snapshot ?? EMPTY_SNAPSHOT,
    loading: snapshot === null,
    createIdeaNote: (input: CreateIdeaNoteInput) => createIdeaNote(db, projectId, input),
    createStoryArc: (input: CreateStoryArcInput) => createStoryArc(db, projectId, input),
    createChapterPlan: (input: CreateChapterPlanInput) => createChapterPlan(db, projectId, input),
    updateIdeaNote: (
      id: string,
      fields: Parameters<typeof updateIdeaNote>[2]
    ) => updateIdeaNote(db, id, fields),
    updateStoryArc: (
      id: string,
      fields: Parameters<typeof updateStoryArc>[2]
    ) => updateStoryArc(db, id, fields),
    updateChapterPlan: (
      id: string,
      fields: Parameters<typeof updateChapterPlan>[2]
    ) => updateChapterPlan(db, id, fields),
  }
}
