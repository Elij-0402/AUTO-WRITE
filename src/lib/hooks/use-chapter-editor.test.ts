import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseLiveQuery = vi.fn()
const mockCreateProjectDB = vi.fn()

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

vi.mock('../db/project-db', () => ({
  createProjectDB: (...args: unknown[]) => mockCreateProjectDB(...args),
}))

vi.mock('../db/chapter-queries', () => ({
  updateChapterContent: vi.fn(),
  computeWordCount: vi.fn(() => 0),
}))

vi.mock('../db/revisions', () => ({
  createRevision: vi.fn(),
  AUTOSNAPSHOT_INTERVAL_MS: 60_000,
}))

vi.mock('./use-autosave', () => ({
  useAutoSave: () => ({
    isSaving: false,
    lastSaved: null,
  }),
}))

vi.mock('./use-word-count', () => ({
  updateTodayWordCount: vi.fn(),
}))

import { useChapterEditor } from './use-chapter-editor'

describe('useChapterEditor', () => {
  beforeEach(() => {
    mockUseLiveQuery.mockReset()
    mockCreateProjectDB.mockReset()
    mockCreateProjectDB.mockReturnValue({
      chapters: {},
    })
  })

  it('hydrates stored chapter content even if the editor emits an early empty change', () => {
    const storedContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '这是已保存的章节正文。' }],
        },
      ],
    }
    const emptyContent = {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    }

    const chapterState: { current: { content: object; wordCount: number } | undefined } = { current: undefined }
    mockUseLiveQuery.mockImplementation(() => chapterState.current ?? null)

    const { result, rerender } = renderHook(() => useChapterEditor('project-1', 'chapter-1'))

    act(() => {
      result.current.updateContent(emptyContent)
    })

    chapterState.current = {
      content: storedContent,
      wordCount: 10,
    }

    rerender()

    expect(result.current.content).toEqual(storedContent)
  })

  it('does not carry previous chapter content into a newly selected empty chapter', () => {
    const firstChapterContent = {
      id: 'chapter-1',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '第一章正文。' }],
          },
        ],
      },
      wordCount: 5,
    }

    const chapterState: { current: { id: string; content: object | null; wordCount: number } | null } = {
      current: firstChapterContent,
    }
    mockUseLiveQuery.mockImplementation(() => chapterState.current)

    const { result, rerender } = renderHook(
      ({ chapterId }) => useChapterEditor('project-1', chapterId),
      { initialProps: { chapterId: 'chapter-1' } }
    )

    expect(result.current.content).toEqual(firstChapterContent.content)

    chapterState.current = firstChapterContent
    rerender({ chapterId: 'chapter-2' })
    expect(result.current.content).toBeNull()

    chapterState.current = {
      id: 'chapter-2',
      content: null,
      wordCount: 0,
    }
    rerender({ chapterId: 'chapter-2' })

    expect(result.current.content).toBeNull()
  })
})
