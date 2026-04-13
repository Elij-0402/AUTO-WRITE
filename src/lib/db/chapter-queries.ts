import type { Chapter, ChapterStatus } from '../types'
import type { InkForgeProjectDB } from './project-db'

/**
 * Get all non-deleted chapters ordered by `order` ascending.
 * Per D-24: chapters are a flat array, no volumes.
 */
export async function getChapters(db: InkForgeProjectDB): Promise<Chapter[]> {
  return db.chapters
    .filter(ch => ch.deletedAt === null)
    .sortBy('order')
}

/**
 * Add a new chapter with auto-incremented order.
 * Per D-16: title is user-provided only; "第N章" prefix is computed at display time.
 * Per D-26: NanoID for entity IDs.
 */
export async function addChapter(
  db: InkForgeProjectDB,
  projectId: string,
  title: string
): Promise<string> {
  const { nanoid } = await import('nanoid')
  const id = nanoid()

  // Find the max order among existing chapters (including deleted)
  const allChapters = await db.chapters.toArray()
  const maxOrder = allChapters.length > 0
    ? Math.max(...allChapters.map(c => c.order))
    : -1

  const now = new Date()
  const chapter: Chapter = {
    id,
    projectId,
    order: maxOrder + 1,
    title,
    content: null,
    wordCount: 0,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await db.chapters.add(chapter)
  return id
}

/**
 * Reorder chapters atomically using a Dexie transaction.
 * Per T-01-07: reorder must be atomic to prevent data corruption.
 */
export async function reorderChapters(
  db: InkForgeProjectDB,
  chapterIds: string[]
): Promise<void> {
  await db.transaction('rw', db.chapters, async () => {
    for (let i = 0; i < chapterIds.length; i++) {
      await db.chapters.update(chapterIds[i], { order: i, updatedAt: new Date() })
    }
  })
}

/**
 * Rename a chapter — update title and updatedAt.
 */
export async function renameChapter(
  db: InkForgeProjectDB,
  id: string,
  title: string
): Promise<void> {
  await db.chapters.update(id, { title, updatedAt: new Date() })
}

/**
 * Soft-delete a chapter by setting deletedAt, per D-15 and D-27.
 * After deletion, reorder remaining chapters to close the gap.
 */
export async function softDeleteChapter(
  db: InkForgeProjectDB,
  id: string
): Promise<void> {
  const now = new Date()
  await db.chapters.update(id, { deletedAt: now, updatedAt: now })

  // Reorder remaining non-deleted chapters to close the gap
  const remaining = await db.chapters
    .filter(ch => ch.deletedAt === null)
    .sortBy('order')

  await db.transaction('rw', db.chapters, async () => {
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i) {
        await db.chapters.update(remaining[i].id, { order: i })
      }
    }
  })
}

/**
 * Duplicate a chapter — creates a copy with （副本）suffix in title,
 * placed after the original in order, status 'draft'.
 */
export async function duplicateChapter(
  db: InkForgeProjectDB,
  id: string
): Promise<string> {
  const { nanoid } = await import('nanoid')
  const newId = nanoid()

  const original = await db.chapters.get(id)
  if (!original) {
    throw new Error(`Chapter with id ${id} not found`)
  }

  // Get all chapters (including deleted) to find position after original
  const allChapters = await db.chapters.toArray()

  // Insert after the original: shift chapters with order > original.order up by 1
  const afterOriginal = allChapters.filter(c => c.order > original.order && c.deletedAt === null)

  const duplicate: Chapter = {
    id: newId,
    projectId: original.projectId,
    order: original.order + 1,
    title: `${original.title}（副本）`,
    content: original.content,
    wordCount: original.wordCount,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  await db.transaction('rw', db.chapters, async () => {
    // Shift remaining chapters up
    for (const ch of afterOriginal) {
      await db.chapters.update(ch.id, { order: ch.order + 1 })
    }
    await db.chapters.add(duplicate)
  })

  return newId
}

/**
 * Update chapter content and word count.
 * Per D-25: word count is precomputed (count all characters minus whitespace for Chinese text).
 */
export async function updateChapterContent(
  db: InkForgeProjectDB,
  id: string,
  content: object
): Promise<void> {
  const wordCount = computeWordCount(content)
  await db.chapters.update(id, { content, wordCount, updatedAt: new Date() })
}

/**
 * Update chapter status (draft or completed).
 */
export async function updateChapterStatus(
  db: InkForgeProjectDB,
  id: string,
  status: ChapterStatus
): Promise<void> {
  await db.chapters.update(id, { status, updatedAt: new Date() })
}

/**
 * Compute chapter number from 0-indexed order position.
 * Per D-16: order 0 → "第1章", order 4 → "第5章".
 */
export function getChapterNumber(order: number): string {
  return `第${order + 1}章`
}

/**
 * Compute word count from content.
 * Per D-25: count all characters minus whitespace for Chinese text.
 */
export function computeWordCount(content: object): number {
  const text = extractTextFromContent(content)
  // Count all non-whitespace characters
  return text.replace(/\s/g, '').length
}

/**
 * Extract plain text from structured content (ProseMirror/Tiptap format).
 * Falls back to JSON.stringify for unknown formats.
 */
export function extractTextFromContent(content: object): string {
  if (!content) return ''

  // If it's a Tiptap document structure, extract text from nodes
  if (typeof content === 'object' && 'type' in content) {
    const doc = content as { type: string; content?: unknown[] }
    if (doc.type === 'doc' && Array.isArray(doc.content)) {
      return doc.content.map(extractTextFromNode).join('')
    }
  }

  return JSON.stringify(content)
}

function extractTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>

  let text = ''
  if (n.text && typeof n.text === 'string') {
    text = n.text as string
  }
  if (Array.isArray(n.content)) {
    text += (n.content as unknown[]).map(extractTextFromNode).join('')
  }
  return text
}