/** World entry entity type per D-01 */
export type WorldEntryType =
  | 'character'
  | 'faction'
  | 'location'
  | 'rule'
  | 'secret'
  | 'event'
  | 'timeline'

/**
 * AI-inferred 口吻 / style profile for a character or location entry, added
 * in v13 as part of T4 (style-fingerprint repositioning). Kept as a dual
 * column so the user can override the AI draft without losing the original.
 *
 * Only populated for type === 'character' | 'location'. Ignored on other types.
 */
export interface WorldEntryInferredVoice {
  /** AI-generated description of 口吻/风格特征. Immutable once written. */
  aiDraft: string
  /** Optional user-edited override. When present, UI shows this; aiDraft is kept for diff. */
  userEdit?: string
  /** When aiDraft was last regenerated. */
  generatedAt: Date
}

/** World bible entry — unified base + type-specific optional fields per D-01 through D-07 */
export interface WorldEntry {
  id: string
  projectId: string
  type: WorldEntryType
  name: string
  /** Faction only: 势力在世界格局中的角色定位 */
  factionRole?: string
  /** Faction only: 势力核心目标 */
  factionGoal?: string
  /** Faction only: 势力风格/行事方式 */
  factionStyle?: string
  /** Character only per D-02: 别名 */
  alias?: string
  /** Character only per D-02: 外貌 */
  appearance?: string
  /** Character only per D-02: 性格 */
  personality?: string
  /** Character only per D-02: 背景 */
  background?: string
  /** Location and rule per D-03, D-04: 描述 */
  description?: string
  /** Location only per D-03: 特征 */
  features?: string
  /** Rule only per D-04: 内容 */
  content?: string
  /** Rule only per D-04: 适用范围 */
  scope?: string
  /** Secret only: 秘密内容 */
  secretContent?: string
  /** Secret only: 影响范围 */
  secretScope?: string
  /** Secret only: 揭露条件 */
  revealCondition?: string
  /** Timeline only per D-05: 时间点 (free text, e.g. "第三年春") */
  timePoint?: string
  /** Timeline and event: 事件描述 */
  eventDescription?: string
  /** Event only: 事件影响 */
  eventImpact?: string
  /** Timeline and event: stable numeric ordering when free-text timePoint is insufficient */
  timeOrder?: number | null
  /** Timeline and event: prerequisite entries that must occur first */
  dependencyEntryIds?: string[]
  /**
   * v13: AI-inferred voice/style profile. Populated only for character +
   * location entries. Used by the consistency-check flow to compare
   * generated prose against the recorded voice signature.
   */
  inferredVoice?: WorldEntryInferredVoice
  /** Free tag system per D-06 — global across all entity types */
  tags: string[]
  createdAt: Date
  updatedAt: Date
  /** Soft delete per D-17 — null means active */
  deletedAt: Date | null
}
