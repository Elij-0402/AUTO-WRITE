/** Project metadata - stored in the shared inkforge-meta IndexedDB */
export interface ProjectMeta {
  id: string
  title: string
  genre: string
  synopsis: string
  coverImageId: string | null
  wordCount: number
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
