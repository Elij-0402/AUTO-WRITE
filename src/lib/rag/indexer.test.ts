/**
 * Regression tests for indexer.ts — content-signature matching path and the
 * new chapter indexer (T7 rescoped per /autoplan final gate).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { HashGramEmbedder, type Embedder } from './embedder'
import {
  indexWorldEntries,
  indexChapters,
  chunkChapterText,
  CHAPTER_CHUNK_TARGET,
} from './indexer'
import type { WorldEntry } from '../types/world-entry'
import type { Chapter } from '../types/chapter'
import type { Embedding } from './types'

function makeEntry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: overrides.id ?? `we-${Math.random().toString(36).slice(2, 8)}`,
    projectId: overrides.projectId ?? 'proj-1',
    type: overrides.type ?? 'character',
    name: overrides.name ?? '小明',
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    deletedAt: overrides.deletedAt ?? null,
    ...overrides,
  }
}

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: overrides.id ?? `ch-${Math.random().toString(36).slice(2, 8)}`,
    projectId: overrides.projectId ?? 'proj-1',
    order: overrides.order ?? 0,
    title: overrides.title ?? '第一章',
    content: overrides.content ?? {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '开头一句。' }] },
      ],
    },
    wordCount: overrides.wordCount ?? 100,
    status: overrides.status ?? 'draft',
    outlineSummary: overrides.outlineSummary ?? '',
    outlineTargetWordCount: overrides.outlineTargetWordCount ?? null,
    outlineStatus: overrides.outlineStatus ?? 'not_started',
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    deletedAt: overrides.deletedAt ?? null,
    ...overrides,
  }
}

describe('indexer.ts (RAG)', () => {
  let db: Dexie
  const embedder: Embedder = new HashGramEmbedder({ dim: 32 })

  beforeEach(async () => {
    db = new Dexie(`test-indexer-${Math.random().toString(36).slice(2)}`)
    db.version(1).stores({
      embeddings:
        'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
    })
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  describe('indexWorldEntries — content-signature matching (regression)', () => {
    it('no-op when both entries and existing embeddings are empty', async () => {
      const result = await indexWorldEntries(db, {
        projectId: 'proj-1',
        entries: [],
        embedder,
      })
      expect(result).toEqual({ added: 0, skipped: 0, removed: 0 })
    })

    it('embeds all entries on a cold index (all-changed path)', async () => {
      const entries = [
        makeEntry({ id: 'a', name: '张三' }),
        makeEntry({ id: 'b', name: '李四' }),
      ]
      const result = await indexWorldEntries(db, {
        projectId: 'proj-1',
        entries,
        embedder,
      })
      expect(result).toEqual({ added: 2, skipped: 0, removed: 0 })

      const rows = await db.table('embeddings').toArray()
      expect(rows).toHaveLength(2)
      for (const r of rows as Embedding[]) {
        expect(r.lastIndexedAt).toBeInstanceOf(Date)
      }
    })

    it('skips unchanged entries on a warm index (no-change path)', async () => {
      const entries = [
        makeEntry({ id: 'a', name: '张三' }),
        makeEntry({ id: 'b', name: '李四' }),
      ]
      await indexWorldEntries(db, { projectId: 'proj-1', entries, embedder })
      const result = await indexWorldEntries(db, {
        projectId: 'proj-1',
        entries,
        embedder,
      })
      expect(result).toEqual({ added: 0, skipped: 2, removed: 0 })
    })

    it('re-embeds only changed entries (partial-change path)', async () => {
      const a = makeEntry({ id: 'a', name: '张三' })
      const b = makeEntry({ id: 'b', name: '李四' })
      await indexWorldEntries(db, { projectId: 'proj-1', entries: [a, b], embedder })

      // Mutate only entry B
      const bChanged = { ...b, name: '李四 (改名)' }
      const result = await indexWorldEntries(db, {
        projectId: 'proj-1',
        entries: [a, bChanged],
        embedder,
      })
      expect(result).toEqual({ added: 1, skipped: 1, removed: 0 })
    })

    it('removes embeddings for deleted entries', async () => {
      const a = makeEntry({ id: 'a', name: '张三' })
      const b = makeEntry({ id: 'b', name: '李四' })
      await indexWorldEntries(db, { projectId: 'proj-1', entries: [a, b], embedder })

      // Soft-delete B — filter excludes it → removed path.
      const result = await indexWorldEntries(db, {
        projectId: 'proj-1',
        entries: [a, { ...b, deletedAt: new Date() }],
        embedder,
      })
      expect(result).toEqual({ added: 0, skipped: 1, removed: 1 })
      const rows = await db.table('embeddings').toArray()
      expect(rows).toHaveLength(1)
      expect((rows[0] as Embedding).sourceId).toBe('a')
    })
  })

  describe('chunkChapterText (T7 chapter chunking)', () => {
    it('empty text produces zero chunks', () => {
      expect(chunkChapterText('')).toEqual([])
      expect(chunkChapterText('   \n\n   ')).toEqual([])
    })

    it('single short paragraph is one chunk', () => {
      const chunks = chunkChapterText('就这一段。')
      expect(chunks).toEqual(['就这一段。'])
    })

    it('merges small paragraphs up to the target size', () => {
      const paragraphs = Array(20).fill('短段落，约十个字。').map((p, i) => `${p}${i}`)
      const text = paragraphs.join('\n\n')
      const chunks = chunkChapterText(text, 100)
      expect(chunks.length).toBeGreaterThan(1)
      for (const c of chunks) {
        // No chunk wildly exceeds the target by more than 25% (soft cap)
        expect(c.length).toBeLessThanOrEqual(100 * 1.25 + 5)
      }
    })

    it('splits a runaway paragraph at char boundaries', () => {
      const big = 'A'.repeat(5_000)
      const chunks = chunkChapterText(big, 800)
      expect(chunks.length).toBeGreaterThanOrEqual(6)
      for (const c of chunks) {
        expect(c.length).toBeLessThanOrEqual(800)
      }
    })
  })

  describe('indexChapters — chunk-level RAG (T7 new surface)', () => {
    const sample = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '一段。' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '两段。' }] },
      ],
    }

    it('no-op when no chapters', async () => {
      const result = await indexChapters(db, {
        projectId: 'proj-1',
        chapters: [],
        embedder,
      })
      expect(result).toEqual({ added: 0, skipped: 0, removed: 0 })
    })

    it('adds chunks for each chapter on a cold index', async () => {
      const ch = makeChapter({ id: 'ch-1', content: sample })
      const result = await indexChapters(db, {
        projectId: 'proj-1',
        chapters: [ch],
        embedder,
      })
      expect(result.added).toBeGreaterThanOrEqual(1)
      expect(result.skipped).toBe(0)
      expect(result.removed).toBe(0)

      const rows = (await db.table('embeddings').toArray()) as Embedding[]
      expect(rows.every(r => r.sourceType === 'chapterChunk')).toBe(true)
      expect(rows.every(r => r.sourceId === 'ch-1')).toBe(true)
      expect(rows.every(r => r.lastIndexedAt instanceof Date)).toBe(true)
      expect(rows.every(r => typeof r.chunkIndex === 'number')).toBe(true)
    })

    it('skips unchanged chapters on re-run', async () => {
      const ch = makeChapter({ id: 'ch-1', content: sample })
      await indexChapters(db, { projectId: 'proj-1', chapters: [ch], embedder })
      const result = await indexChapters(db, {
        projectId: 'proj-1',
        chapters: [ch],
        embedder,
      })
      expect(result.added).toBe(0)
      expect(result.skipped).toBeGreaterThanOrEqual(1)
    })

    it('removes stale chunks when chapter content shrinks', async () => {
      const longContent = {
        type: 'doc',
        content: Array(30).fill(null).map(() => ({
          type: 'paragraph',
          content: [{ type: 'text', text: 'A'.repeat(CHAPTER_CHUNK_TARGET) }],
        })),
      }
      const ch = makeChapter({ id: 'ch-1', content: longContent })
      const firstPass = await indexChapters(db, {
        projectId: 'proj-1',
        chapters: [ch],
        embedder,
      })
      expect(firstPass.added).toBeGreaterThan(3)

      const shortContent = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '短一段。' }] },
        ],
      }
      const result = await indexChapters(db, {
        projectId: 'proj-1',
        chapters: [{ ...ch, content: shortContent }],
        embedder,
      })
      expect(result.removed).toBeGreaterThan(0)
      expect(result.added).toBeGreaterThanOrEqual(1)
    })

    it('removes all chunks for a deleted chapter', async () => {
      const ch = makeChapter({ id: 'ch-1', content: sample })
      await indexChapters(db, { projectId: 'proj-1', chapters: [ch], embedder })
      const before = await db.table('embeddings').count()
      expect(before).toBeGreaterThanOrEqual(1)

      const result = await indexChapters(db, {
        projectId: 'proj-1',
        chapters: [{ ...ch, deletedAt: new Date() }],
        embedder,
      })
      expect(result.added).toBe(0)
      expect(result.removed).toBe(before)
      expect(await db.table('embeddings').count()).toBe(0)
    })
  })
})
