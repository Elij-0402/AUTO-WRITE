/** Project metadata - stored in the shared inkforge-meta IndexedDB */
export interface ProjectMeta {
  id: string
  title: string
  genre: string
  synopsis: string
  coverImageId: string | null
  wordCount: number
  /** Today's writing word count - reset each natural day */
  todayWordCount: number
  /** Date string in YYYY-MM-DD format for tracking daily reset */
  todayDate: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

/** Input type for creating a new project */
export interface CreateProjectInput {
  title: string
  genre?: string
  synopsis?: string
}
