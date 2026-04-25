import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createProjectDB, __resetProjectDBCache, type InkForgeProjectDB } from './project-db'
import {
  loadLayoutSnapshots,
  saveLayoutSnapshot,
  deleteLayoutSnapshotsForNode,
  clearLayoutSnapshots,
} from './layout-snapshots'

describe('layout-snapshots', () => {
  let db: InkForgeProjectDB
  let testCounter = 0

  beforeEach(async () => {
    testCounter++
    db = createProjectDB(`test-layout-snapshots-${testCounter}`)
  })

  afterEach(async () => {
    await db.close()
    __resetProjectDBCache()
  })

  it('should save and load a layout snapshot', async () => {
    const projectId = `test-layout-snapshots-${testCounter}`
    await saveLayoutSnapshot(projectId, 'default', 'node-1', 100, 200)
    const snapshots = await loadLayoutSnapshots(projectId, 'default')

    expect(snapshots.size).toBe(1)
    const snap = snapshots.get('node-1')
    expect(snap).toEqual(expect.objectContaining({
      nodeId: 'node-1',
      x: 100,
      y: 200,
      layoutId: 'default',
    }))
  })

  it('should overwrite existing snapshot on save', async () => {
    const projectId = `test-layout-snapshots-${testCounter}`
    await saveLayoutSnapshot(projectId, 'default', 'node-1', 100, 200)
    await saveLayoutSnapshot(projectId, 'default', 'node-1', 300, 400)
    const snapshots = await loadLayoutSnapshots(projectId, 'default')

    expect(snapshots.size).toBe(1)
    const snap = snapshots.get('node-1')
    expect(snap!.x).toBe(300)
    expect(snap!.y).toBe(400)
  })

  it('should delete snapshots for a specific node', async () => {
    const projectId = `test-layout-snapshots-${testCounter}`
    await saveLayoutSnapshot(projectId, 'default', 'node-1', 100, 200)
    await saveLayoutSnapshot(projectId, 'default', 'node-2', 150, 250)
    await deleteLayoutSnapshotsForNode(projectId, 'node-1')
    const snapshots = await loadLayoutSnapshots(projectId, 'default')

    expect(snapshots.size).toBe(1)
    expect(snapshots.has('node-1')).toBe(false)
    expect(snapshots.has('node-2')).toBe(true)
  })

  it('should clear all snapshots for a layout', async () => {
    const projectId = `test-layout-snapshots-${testCounter}`
    await saveLayoutSnapshot(projectId, 'default', 'node-1', 100, 200)
    await saveLayoutSnapshot(projectId, 'default', 'node-2', 150, 250)
    await clearLayoutSnapshots(projectId, 'default')
    const snapshots = await loadLayoutSnapshots(projectId, 'default')

    expect(snapshots.size).toBe(0)
  })
})
