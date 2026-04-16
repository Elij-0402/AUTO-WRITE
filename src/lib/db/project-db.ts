import Dexie, { type Table } from 'dexie'
import type { Chapter, ProjectMeta, WorldEntry, Relation } from '../types'

/**
 * AI configuration stored per-project in IndexedDB.
 * BYOK model: API Key and Base URL are user-provided, stored locally only.
 *
 * `provider` is new in v6. Missing (undefined) means legacy records created
 * before the Anthropic path existed — treat those as 'openai-compatible'.
 */
export type AIProvider = 'anthropic' | 'openai-compatible'

export interface AIConfig {
  id: 'config'  // singleton
  provider?: AIProvider
  apiKey: string
  baseUrl: string
  model?: string
}

/**
 * Chat message stored per-project in IndexedDB.
 * Used for AI chat history and draft management.
 */
export interface ChatMessage {
  id: string
  projectId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasDraft?: boolean
  draftId?: string
}

/**
 * Consistency exemption stored per-project in IndexedDB.
 * Used to suppress specific contradiction warnings that user has explicitly allowed.
 */
export interface ConsistencyExemption {
  id: string
  projectId: string
  /** Hash of entryId + type/description that created this exemption */
  exemptionKey: string
  createdAt: number
  /** Optional note explaining why this was exempted */
  note?: string
}

/**
 * Per-chapter content snapshot for time-travel / undo-across-sessions.
 * Captured periodically by the autosave layer (see use-autosave) and on
 * demand when the user pins an explicit checkpoint.
 *
 * Storage guideline: we keep at most 50 revisions per chapter; older ones
 * are pruned by createRevision().
 */
export interface Revision {
  id: string
  projectId: string
  chapterId: string
  /** Tiptap JSON document */
  snapshot: object
  wordCount: number
  createdAt: Date
  /** Human label if the user pinned this revision explicitly. */
  label?: string
  source: 'autosnapshot' | 'manual' | 'ai-draft'
}

/**
 * Layout settings stored per-project in IndexedDB per D-24.
 * sidebarWidth: persisted sidebar width in pixels per D-25
 * activeTab: which sidebar tab is shown ('chapters' | 'outline' | 'world') per D-08, D-14
 * chatPanelWidth: persisted right chat panel width in pixels per D-12 (320 default)
 */
export interface LayoutSettings {
  id: string // 'default' for per-project default layout
  sidebarWidth: number
  activeTab: 'chapters' | 'outline' | 'world'
  chatPanelWidth?: number // default 320, made optional for existing projects
}

/**
 * Per-project database for InkForge.
 * Per D-19: each project gets its own IndexedDB database for clean isolation.
 * Database name: inkforge-project-{projectId}
 *
 * Version 2: Added layoutSettings table and outline fields on Chapter per D-07, D-24.
 */
export class InkForgeProjectDB extends Dexie {
  projects!: Table<ProjectMeta, string>
  chapters!: Table<Chapter, string>
  layoutSettings!: Table<LayoutSettings, string>
  worldEntries!: Table<WorldEntry, string>
  relations!: Table<Relation, string>
  aiConfig!: Table<AIConfig, string>
  messages!: Table<ChatMessage, string>
  consistencyExemptions!: Table<ConsistencyExemption, string>
  revisions!: Table<Revision, string>

  constructor(projectId: string) {
    super(`inkforge-project-${projectId}`)
    this.version(1).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
    })
    this.version(2).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
    }).upgrade(tx => {
      // Backfill outline defaults for existing chapter records per T-03-02
      // Dexie migration: existing chapters get undefined for new fields
      // We set defaults for outlineStatus, outlineSummary, outlineTargetWordCount
      return tx.table('chapters').toCollection().modify(chapter => {
        if (chapter.outlineStatus === undefined) {
          chapter.outlineStatus = 'not_started'
        }
        if (chapter.outlineSummary === undefined) {
          chapter.outlineSummary = ''
        }
        if (chapter.outlineTargetWordCount === undefined) {
          chapter.outlineTargetWordCount = null
        }
      })
    })
    this.version(3).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
    })
    this.version(4).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, role, timestamp',
    })
    this.version(5).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
    })
    // v6: backfill AIConfig.provider for legacy records.
    this.version(6)
      .stores({
        projects: 'id, updatedAt, deletedAt',
        chapters: 'id, projectId, order, deletedAt',
        layoutSettings: 'id',
        worldEntries: 'id, projectId, type, name, deletedAt',
        relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
        aiConfig: 'id',
        messages: 'id, projectId, role, timestamp',
        consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      })
      .upgrade(tx =>
        tx.table('aiConfig').toCollection().modify(cfg => {
          if (cfg.provider === undefined) cfg.provider = 'openai-compatible'
        })
      )
    // v7: revisions table for per-chapter snapshots.
    this.version(7).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
    })
  }
}

/**
 * Factory function to create a per-project database instance.
 * Per D-19: each project gets its own DB for isolation.
 */
export function createProjectDB(projectId: string): InkForgeProjectDB {
  return new InkForgeProjectDB(projectId)
}