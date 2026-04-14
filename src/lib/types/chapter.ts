/** Chapter status type - draft or completed */
export type ChapterStatus = 'draft' | 'completed'

/** Outline status type per D-10 - independent from chapter status */
export type OutlineStatus = 'not_started' | 'in_progress' | 'completed'

/** Chapter interface - stored in per-project IndexedDB */
export interface Chapter {
  id: string
  projectId: string
  order: number
  title: string
  /** ProseMirror/Tiptap document format - null until content is created */
  content: object | null
  wordCount: number
  status: ChapterStatus
  /** Outline summary - plain text summary per D-07 */
  outlineSummary: string
  /** Outline target word count per D-07 - null means not set */
  outlineTargetWordCount: number | null
  /** Outline status per D-10 - independent from chapter status */
  outlineStatus: OutlineStatus
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
