import { beforeEach, describe, expect, it, vi } from 'vitest'

const createProjectDBMock = vi.fn()
const getChaptersMock = vi.fn()
const toBufferMock = vi.fn()

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

vi.mock('docx', () => {
  class Paragraph {
    config: Record<string, unknown>
    constructor(config: Record<string, unknown>) {
      this.config = config
    }
  }
  class TextRun {
    config: Record<string, unknown>
    constructor(config: Record<string, unknown>) {
      this.config = config
    }
  }
  class Document {
    config: Record<string, unknown>
    constructor(config: Record<string, unknown>) {
      this.config = config
    }
  }

  return {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel: { TITLE: 'TITLE', HEADING_1: 'HEADING_1' },
    AlignmentType: { CENTER: 'CENTER' },
    convertInchesToTwip: (value: number) => value * 1440,
    Packer: {
      toBuffer: (...args: unknown[]) => toBufferMock(...args),
    },
  }
})

describe('exportToDocx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createProjectDBMock.mockReturnValue({ name: 'db' })
    toBufferMock.mockResolvedValue(Uint8Array.from([1, 2, 3, 4]))
  })

  it('builds chapter headings and body paragraphs in order', async () => {
    getChaptersMock.mockResolvedValue([
      {
        id: 'c1',
        order: 0,
        title: '夜路',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '第一段\n\n第二段' }] }] },
      },
      {
        id: 'c2',
        order: 1,
        title: '空章',
        content: null,
      },
    ])

    const { exportToDocx } = await import('./docx-export')
    const blob = await exportToDocx('project-1', '雾港雨夜')

    expect(createProjectDBMock).toHaveBeenCalledWith('project-1')
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    const docArg = toBufferMock.mock.calls[0]?.[0] as { config: { sections: Array<{ children: Array<{ config: Record<string, unknown> }> }> } }
    const children = docArg.config.sections[0]?.children ?? []
    const textValues = children
      .map((child) => child.config.text ?? (child.config.children as Array<{ config: { text: string } }> | undefined)?.[0]?.config.text)
      .filter(Boolean)

    expect(textValues).toEqual([
      '雾港雨夜',
      '目录',
      '第1章 夜路',
      '第2章 空章',
      '第1章 夜路',
      '第一段',
      '第二段',
      '第2章 空章',
    ])
  })
})
