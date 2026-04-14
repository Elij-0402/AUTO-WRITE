/** Relation category per D-23 */
export type RelationCategory = 'character_relation' | 'general'

/** Bidirectional relationship between world entries per D-22 through D-29 */
export interface Relation {
  id: string
  projectId: string
  sourceEntryId: string
  targetEntryId: string
  /** D-23: 'character_relation' or 'general' */
  category: RelationCategory
  /** D-23: free-text description (e.g., 师徒, 朋友) */
  description: string
  /** D-22, D-29: directional label from source to target (e.g., "是师父") */
  sourceToTargetLabel: string
  createdAt: Date
  /** Soft delete — null means active */
  deletedAt: Date | null
}