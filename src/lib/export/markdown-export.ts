/**
 * Markdown export utility for InkForge novels.
 * Per D-13: export format with chapter heading separators.
 */

import { createProjectDB } from '../db/project-db'
import { getChapters, getChapterNumber } from '../db/chapter-queries'
import { extractTextFromContent } from '../db/chapter-queries'

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
 * - Chapter content follows as body
 */
export async function exportToMarkdown(projectId: string): Promise<Blob> {
  // Step 1: Prepare - open project database
  const db = createProjectDB(projectId)
  
  // Step 2: Gather all chapters
  const chapters = await getChapters(db)
  
  // Step 3: Build Markdown content
  const lines: string[] = []
  
  for (const chapter of chapters) {
    // Chapter heading: 第X章 标题
    const chapterNum = getChapterNumber(chapter.order)
    lines.push(`# ${chapterNum} ${chapter.title}`)
    lines.push('')
    
    // Chapter content - extract plain text from Tiptap structure
    if (chapter.content) {
      const text = extractTextFromContent(chapter.content)
      lines.push(text)
    }
    
    // Add separator between chapters
    lines.push('')
    lines.push('---')
    lines.push('')
  }
  
  // Step 4: Create blob with UTF-8 encoding
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