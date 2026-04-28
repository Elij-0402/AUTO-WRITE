import { beforeEach, describe, expect, it, vi } from 'vitest'

const epubMock = vi.fn()
const createProjectDBMock = vi.fn()
const getChaptersMock = vi.fn()

vi.mock('epub-gen-memory/bundle', () => ({
  default: (...args: unknown[]) => epubMock(...args),
}))

vi.mock('../db/project-db', () => ({
  createProjectDB: (...args: unknown[]) => createProjectDBMock(...args),
}))

vi.mock('../db/chapter-queries', async () => {
  const actual = await vi.importActual<typeof import('../db/chapter-queries')>('../db/chapter-queries')
  return {
    ...actual,
    getChapters: (...args: unknown[]) => getChaptersMock(...args),
  }
})

describe('exportToEpub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createProjectDBMock.mockReturnValue({ name: 'db' })
    epubMock.mockResolvedValue(new Blob(['epub']))
  })

  it('passes ordered Chinese chapter content and fallback metadata into epub generation', async () => {
    getChaptersMock.mockResolvedValue([
      {
        id: 'c1',
        order: 0,
        title: '初见',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '第一段\n\n第二段' }] }] },
      },
      {
        id: 'c2',
        order: 1,
        title: '空章',
        content: null,
      },
    ])

    const { exportToEpub } = await import('./epub-export')
    await exportToEpub('project-1', { title: '雾港雨夜' })

    expect(createProjectDBMock).toHaveBeenCalledWith('project-1')
    expect(epubMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '雾港雨夜',
        author: '未知作者',
        lang: 'zh-CN',
      }),
      [
        {
          title: '第1章 初见',
          content: '<p>第一段</p><p>第二段</p>',
        },
        {
          title: '第2章 空章',
          content: '<p></p>',
        },
      ]
    )
  })
})
