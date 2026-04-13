/** Chapter status type - draft or completed */
export type ChapterStatus = 'draft' | 'completed'

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
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
