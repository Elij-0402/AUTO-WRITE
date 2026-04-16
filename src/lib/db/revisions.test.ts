import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createProjectDB, type InkForgeProjectDB } from './project-db'
import {
  createRevision,
  listRevisions,
  pruneRevisions,
  MAX_REVISIONS_PER_CHAPTER,
  AUTOSNAPSHOT_INTERVAL_MS,
} from './revisions'

const EMPTY_TIPTAP_DOC = { type: 'doc', content: [] }

function makeContent(text: string) {
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text }] },
    ],
  }
}

describe('revisions', () => {
  let db: InkForgeProjectDB

  beforeEach(async () => {
    const projectId = crypto.randomUUID()
    db = createProjectDB(projectId)
    await db.open()
  })

  it('creates and lists revisions newest first', async () => {
    const chapterId = 'c1'
    const id1 = await createRevision(db, {
      projectId: 'p',
      chapterId,
      snapshot: makeContent('第一稿'),
      source: 'manual',
    })
    const id2 = await createRevision(db, {
      projectId: 'p',
      chapterId,
      snapshot: makeContent('第二稿'),
      source: 'manual',
    })

    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()

    const list = await listRevisions(db, chapterId)
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(id2)
    expect(list[1].id).toBe(id1)
  })

  it('respects minIntervalMs: second call within window is a no-op', async () => {
    const chapterId = 'c1'
    const id1 = await createRevision(db, {
      projectId: 'p',
      chapterId,
      snapshot: EMPTY_TIPTAP_DOC,
      source: 'autosnapshot',
      minIntervalMs: AUTOSNAPSHOT_INTERVAL_MS,
    })
    const id2 = await createRevision(db, {
      projectId: 'p',
      chapterId,
      snapshot: EMPTY_TIPTAP_DOC,
      source: 'autosnapshot',
      minIntervalMs: AUTOSNAPSHOT_INTERVAL_MS,
    })

    expect(id1).toBeTruthy()
    expect(id2).toBeNull()
    const list = await listRevisions(db, chapterId)
    expect(list).toHaveLength(1)
  })

  it('prunes oldest autosnapshots while keeping labelled/manual revisions', async () => {
    const chapterId = 'c1'
    // Seed one labelled and one manual revision from the past.
    const labelledTs = Date.now() - 1000_000
    await db.revisions.add({
      id: 'labelled',
      projectId: 'p',
      chapterId,
      snapshot: EMPTY_TIPTAP_DOC,
      wordCount: 0,
      createdAt: new Date(labelledTs),
      source: 'manual',
      label: '定稿候选',
    })
    await db.revisions.add({
      id: 'manual-old',
      projectId: 'p',
      chapterId,
      snapshot: EMPTY_TIPTAP_DOC,
      wordCount: 0,
      createdAt: new Date(labelledTs + 1),
      source: 'manual',
    })
    // Fill up with autosnapshots.
    for (let i = 0; i < MAX_REVISIONS_PER_CHAPTER; i++) {
      await db.revisions.add({
        id: `auto-${i}`,
        projectId: 'p',
        chapterId,
        snapshot: EMPTY_TIPTAP_DOC,
        wordCount: 0,
        createdAt: new Date(labelledTs + 100 + i),
        source: 'autosnapshot',
      })
    }

    const deleted = await pruneRevisions(db, chapterId)
    expect(deleted).toBe(2)

    const remaining = await listRevisions(db, chapterId)
    expect(remaining).toHaveLength(MAX_REVISIONS_PER_CHAPTER)
    expect(remaining.find(r => r.id === 'labelled')).toBeTruthy()
    expect(remaining.find(r => r.id === 'manual-old')).toBeTruthy()
    // Two oldest autosnapshots should be gone.
    expect(remaining.find(r => r.id === 'auto-0')).toBeFalsy()
    expect(remaining.find(r => r.id === 'auto-1')).toBeFalsy()
  })
})
