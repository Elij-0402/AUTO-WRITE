import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createProjectDB, InkForgeProjectDB, __resetProjectDBCache } from './project-db'

describe('project-db v14 migration', () => {
  beforeEach(() => {
    __resetProjectDBCache()
  })

  it('opens at the current schema version successfully', async () => {
    const db = createProjectDB('test-migration-v14')
    const referenceDb = new InkForgeProjectDB('test-migration-v14-reference')
    await db.open()
    expect(db.verno).toBe(referenceDb.verno)
    db.close()
    referenceDb.close()
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
