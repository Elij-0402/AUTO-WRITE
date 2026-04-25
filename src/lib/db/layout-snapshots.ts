import { nanoid } from 'nanoid'
import type { LayoutSnapshot } from './project-db'
import { createProjectDB } from './project-db'

export type { LayoutSnapshot }

const DEFAULT_LAYOUT_ID = 'default'

/**
 * Load all layout snapshots for a project+layout.
 * Returns a Map of nodeId -> LayoutSnapshot for O(1) lookup.
 */
export async function loadLayoutSnapshots(
  projectId: string,
  layoutId: string = DEFAULT_LAYOUT_ID
): Promise<Map<string, LayoutSnapshot>> {
  const db = createProjectDB(projectId)
  const snapshots = await db.layoutSnapshots
    .where('[projectId+layoutId]')
    .equals([projectId, layoutId])
    .toArray()
  return new Map(snapshots.map(s => [s.nodeId, s]))
}

/**
 * Save or update a single node's position.
 * Uses put() (upsert) so it works for both insert and update.
 */
export async function saveLayoutSnapshot(
  projectId: string,
  layoutId: string,
  nodeId: string,
  x: number,
  y: number
): Promise<void> {
  const db = createProjectDB(projectId)
  const existing = await db.layoutSnapshots
    .where('[projectId+layoutId]')
    .equals([projectId, layoutId])
    .and(s => s.nodeId === nodeId)
    .first()

  const record: LayoutSnapshot = {
    id: existing?.id ?? nanoid(),
    projectId,
    layoutId,
    nodeId,
    x,
    y,
    isDefault: layoutId === DEFAULT_LAYOUT_ID,
    updatedAt: Date.now(),
  }

  await db.layoutSnapshots.put(record)
}

/**
 * Delete all layout snapshots for a given nodeId.
 * Called when a WorldEntry is deleted (cascade cleanup).
 */
export async function deleteLayoutSnapshotsForNode(
  projectId: string,
  nodeId: string
): Promise<void> {
  const db = createProjectDB(projectId)
  await db.layoutSnapshots.where('nodeId').equals(nodeId).delete()
}

/**
 * Clear all layout snapshots for a project+layout.
 * Used when user requests a layout reset.
 */
export async function clearLayoutSnapshots(
  projectId: string,
  layoutId: string = DEFAULT_LAYOUT_ID
): Promise<void> {
  const db = createProjectDB(projectId)
  await db.layoutSnapshots.where('[projectId+layoutId]').equals([projectId, layoutId]).delete()
}
