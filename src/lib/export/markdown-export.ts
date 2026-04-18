/**
 * Markdown export utility for InkForge novels.
 * Per D-13: export format with chapter heading separators.
 */

import { createProjectDB } from '../db/project-db'
import { getChapters, getChapterNumber } from '../db/chapter-queries'
import { proseMirrorToMarkdown } from './prosemirror-markdown'

/**
 * Export steps labels per UI-SPEC.
 */
export const EXPORT_STEPS = {
  PREPARING: '准备导出...',
  GATHERING_CONTENT: '汇总章节内容...',
  GENERATING_FILE: '生成Markdown文件...',
  TRIGGERING_DOWNLOAD: '触发下载...',
} as const

/**
 * Export all chapters of a project as a single Markdown blob.
 *
 * @param projectId - The project ID to export
 * @returns Promise<Blob> - UTF-8 encoded Markdown file
 *
 * Format per D-13:
 * - Chapter separator: `# 第X章 标题`
 * - Chapter content follows as body, rendered from the Tiptap document so
 *   bold/italic/headings/lists/blockquotes round-trip as Markdown.
 */
export async function exportToMarkdown(projectId: string): Promise<Blob> {
  const db = createProjectDB(projectId)
  const chapters = await getChapters(db)

  const lines: string[] = []

  for (const chapter of chapters) {
    const chapterNum = getChapterNumber(chapter.order)
    lines.push(`# ${chapterNum} ${chapter.title}`)
    lines.push('')

    if (chapter.content) {
      const body = proseMirrorToMarkdown(chapter.content)
      if (body) lines.push(body)
    }

    lines.push('')
    lines.push('---')
    lines.push('')
  }

  const content = lines.join('\n')
  return new Blob([content], { type: 'text/markdown;charset=utf-8' })
}

/**
 * Trigger browser download for a Blob.
 * 
 * @param blob - The file blob to download
 * @param filename - Desired filename with extension
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}