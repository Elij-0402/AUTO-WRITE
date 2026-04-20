import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createProjectDB, __resetProjectDBCache } from './project-db'

describe('project-db v14 migration', () => {
  beforeEach(() => {
    __resetProjectDBCache()
  })

  it('opens at version 15 successfully', async () => {
    const db = createProjectDB('test-migration-v14')
    await db.open()
    expect(db.verno).toBe(15)
    db.close()
  })

  it('does not have an embeddings table', async () => {
    const db = createProjectDB('test-no-embeddings')
    await db.open()
    const tableNames = db.tables.map(t => t.name)
    expect(tableNames).not.toContain('embeddings')
    db.close()
  })

  it('does not have an abTestMetrics table (dropped in v15)', async () => {
    const db = createProjectDB('test-no-abmetrics')
    await db.open()
    const tableNames = db.tables.map(t => t.name)
    expect(tableNames).not.toContain('abTestMetrics')
    db.close()
  })
})