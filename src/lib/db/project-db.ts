import Dexie, { type Table } from 'dexie'
import type {
  Chapter,
  ProjectMeta,
  WorldEntry,
  Relation,
  WorldEntryType,
  StoryTracker,
  IdeaNote,
  StoryArc,
  ChapterPlan,
  SceneCard,
  PlanningSelection,
} from '../types'
import type { PreferenceMemory, ProjectCharter } from '../types'

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
  availableModels?: string[]
}

/**
 * Chat message stored per-project in IndexedDB.
 * Used for AI chat history and draft management.
 *
 * `conversationId` added in v10 to support multi-thread conversations.
 * Legacy records are backfilled to a per-project default conversation.
 */
export interface ChatMessage {
  id: string
  projectId: string
  conversationId: string
  role: 'user' | 'assistant'
  kind?: 'default' | 'direction-adjustment'
  content: string
  timestamp: number
  hasDraft?: boolean
  draftId?: string
}

/**
 * A conversation thread inside a project.
 * Each project can have many conversations; messages reference them via
 * `conversationId`. Rolling summary lets us bound context while keeping
 * older turns semantically available.
 */
export interface Conversation {
  id: string
  projectId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  rollingSummary?: string
  /** Number of messages included in the current rollingSummary (index boundary). */
  summarizedUpTo?: number
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
 * Historical contradiction entry stored per-project in v13 for the T3
 * Contradiction Dashboard. One row per AI-detected contradiction against a
 * WorldEntry, persisted so the analysis page can show per-entry history
 * instead of only in-the-moment cards.
 *
 * Dedup rule (CEO-4C): a new contradiction with the same
 * (entryName + description + exempted=false) as a row within the last 7
 * days is skipped. Re-flag only if the old row is older than 7d.
 *
 * Sync: contradictions ARE synced to Supabase (unlike aiConfig which is
 * local-only). Row-level-security on Supabase must scope by user_id.
 */
export interface Contradiction {
  id: string
  projectId: string
  /** Conversation where this contradiction was surfaced. null = non-chat flow. */
  conversationId: string | null
  /** Message id that produced the contradiction for traceability. */
  messageId: string | null
  /** Target WorldEntry name (denormalized so the dashboard renders w/o a join). */
  entryName: string
  entryType: WorldEntryType
  /** AI-written description of the contradiction. */
  description: string
  /** True when the user marked it intentional via ConsistencyWarningCard or the dashboard. */
  exempted: boolean
  createdAt: number
  /** Optional chapter reference so "去第 X 章" button has a target. */
  chapterId?: string
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
 * Cached AI-generated analysis artifact. Keyed by `kind` + a content hash
 * the caller computes (e.g. SHA of concatenated chapter texts). If the hash
 * matches the current state, we reuse; otherwise we regenerate.
 */
export interface AnalysisArtifact {
  id: string
  projectId: string
  kind: 'style-profile' | 'arc-map'
  /** Opaque content hash from the caller — mismatch triggers regeneration. */
  invalidationKey: string
  /** Structured result, kind-specific. */
  result: unknown
  createdAt: Date
}

/**
 * Per-call AI usage record. Append-only; one row per underlying model call
 * (chat, rolling-summary compaction, analysis, generation). Kept granular so
 * long-running projects can later be re-aggregated in any dimension without
 * having to replay lost detail — BYOK users own their full usage trail.
 *
 * No pricing is stored; prices change per provider/plan and are user-supplied
 * if ever displayed. Tokens + latency + cache-split are the durable facts.
 */
export interface AIUsageEvent {
  id: string
  projectId: string
  /** null for calls not tied to a conversation (e.g. style-profile analyses). */
  conversationId: string | null
  kind: 'chat' | 'summarize' | 'analyze' | 'generate'
  provider: AIProvider
  model: string
  inputTokens: number
  outputTokens: number
  /** 0 when the provider doesn't expose cache metrics. */
  cacheReadTokens: number
  cacheWriteTokens: number
  latencyMs: number
  createdAt: number
  /**
   * v13 (T1: draft adoption telemetry). Only populated on 'chat' rows whose
   * assistant response included a draft. draftOffered=true and one of
   * draftAccepted / draftRejectedReason will follow.
   */
  draftOffered?: boolean
  /** True when user clicked "插入到正文" on the DraftCard. */
  draftAccepted?: boolean
  /**
   * Percentage (0–1) of the inserted draft that was subsequently edited.
   * Computed ~30 minutes after insert via revisions diff. null means the
   * window expired without a revision (tab closed, chapter not touched).
   */
  draftEditedPct?: number | null
  /**
   * Reason enum when user clicked "不采纳". One of two T1-spec values
   * plus an optional free-form note capped at 500 chars and plain-text only.
   */
  draftRejectedReason?: 'conflict' | 'other'
  /** Optional free-form supplement to draftRejectedReason. Max 500 chars. */
  draftRejectedNote?: string
  /**
   * v13 (T1): scheduled deadline for the retroactive editedPct scan. Stored
   * in ms-since-epoch. A background pass on page load scans rows where
   * draftAccepted=true AND draftEditedPct==null AND editedPctDeadline<now()
   * and fills in the value from revisions diff.
   */
  editedPctDeadline?: number
}

/**
 * Node layout position snapshot per D-24.
 * Stores x/y coordinates for each node in a named layout (Phase 1 = 'default').
 * Fixed nodes (dragged by user) have their fx/fy set, which takes precedence
 * over force-layout computed positions on next render.
 */
export interface LayoutSnapshot {
  id: string           // nanoid
  projectId: string
  layoutId: string     // Phase 1 = 'default'
  nodeId: string       // WorldEntry.id
  x: number
  y: number
  isDefault: boolean
  updatedAt: number
}

/**
 * Layout settings stored per-project in IndexedDB per D-24.
 * sidebarWidth: persisted sidebar width in pixels per D-25
 * activeTab: which sidebar tab is shown ('chapters' | 'outline' | 'world' | 'planning') per D-08, D-14
 * chatPanelWidth: persisted right chat panel width in pixels per D-12 (320 default)
 */
export interface LayoutSettings {
  id: string // 'default' for per-project default layout
  sidebarWidth: number
  activeTab: 'chapters' | 'outline' | 'world' | 'planning'
  chatPanelWidth?: number // default 320, made optional for existing projects
  activeChapterId?: string | null
  activeOutlineId?: string | null
  activeWorldEntryId?: string | null
  activePlanningSelection?: PlanningSelection | null
  lastWorkspaceContext?: 'chapter' | 'outline' | 'world' | 'planning'
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
  analyses!: Table<AnalysisArtifact, string>
  conversations!: Table<Conversation, string>
  aiUsage!: Table<AIUsageEvent, string>
  contradictions!: Table<Contradiction, string>
  layoutSnapshots!: Table<LayoutSnapshot, string>
  projectCharter!: Table<ProjectCharter, string>
  preferenceMemories!: Table<PreferenceMemory, string>
  storyTrackers!: Table<StoryTracker, string>
  ideaNotes!: Table<IdeaNote, string>
  storyArcs!: Table<StoryArc, string>
  chapterPlans!: Table<ChapterPlan, string>
  sceneCards!: Table<SceneCard, string>

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
    // v8: embeddings table for hybrid-search RAG.
    this.version(8).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      embeddings: 'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
    })
    // v9: analyses table for cached AI-generated artifacts (style, arc).
    this.version(9).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      embeddings: 'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
      analyses: 'id, kind, invalidationKey, createdAt',
    })
    // v10: conversations table + messages.conversationId. Backfills a default
    // "历史对话" conversation per project that has existing messages.
    this.version(10)
      .stores({
        projects: 'id, updatedAt, deletedAt',
        chapters: 'id, projectId, order, deletedAt',
        layoutSettings: 'id',
        worldEntries: 'id, projectId, type, name, deletedAt',
        relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
        aiConfig: 'id',
        messages: 'id, projectId, conversationId, role, timestamp',
        consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
        revisions: 'id, projectId, chapterId, createdAt',
        embeddings: 'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
        analyses: 'id, kind, invalidationKey, createdAt',
        conversations: 'id, projectId, updatedAt',
      })
      .upgrade(async tx => {
        const existingMessages = await tx.table('messages').toArray() as ChatMessage[]
        if (existingMessages.length === 0) return
        // Group by projectId and create one default conversation per project.
        const byProject = new Map<string, ChatMessage[]>()
        for (const m of existingMessages) {
          if (!byProject.has(m.projectId)) byProject.set(m.projectId, [])
          byProject.get(m.projectId)!.push(m)
        }
        const conversationsTable = tx.table('conversations')
        const messagesTable = tx.table('messages')
        for (const [projectId, msgs] of byProject) {
          const sorted = msgs.sort((a, b) => a.timestamp - b.timestamp)
          const conv: Conversation = {
            id: crypto.randomUUID(),
            projectId,
            title: '历史对话',
            createdAt: sorted[0].timestamp,
            updatedAt: sorted[sorted.length - 1].timestamp,
            messageCount: sorted.length,
          }
          await conversationsTable.add(conv)
          for (const m of sorted) {
            await messagesTable.update(m.id, { conversationId: conv.id })
          }
        }
      })
    // v11: aiUsage table for per-call BYOK usage logging.
    this.version(11).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      embeddings: 'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
    })
    // v12: abTestMetrics table for Phase B A/B experiment harness.
    // Additive-only — no column drops/renames. v11 code reading a v12 DB
    // will simply ignore the new table.
    this.version(12).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      embeddings: 'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      abTestMetrics: 'id, projectId, conversationId, createdAt, [projectId+createdAt]',
    })
    // v13: v0.3 Sharpen-the-Spine schema.
    // - T3: new `contradictions` table (historical contradiction records for
    //   the Contradiction Dashboard). Compound index [projectId+entryName]
    //   powers the per-entry aggregate query required by the dashboard.
    // - T1: additive fields on aiUsage (draftOffered / draftAccepted /
    //   draftEditedPct / draftRejectedReason / draftRejectedNote /
    //   editedPctDeadline) and a new 'citation_click' kind. No index change.
    // - T4: additive inferredVoice field on WorldEntry — no index change.
    // - T7: additive lastIndexedAt observability field on Embedding — no
    //   index change.
    //
    // Additive-only per Dexie best practice. Older code reading a v13 DB
    // will simply ignore the new table + columns.
    this.version(13).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      embeddings: 'id, sourceType, sourceId, embedderId, updatedAt, [sourceType+sourceId]',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      abTestMetrics: 'id, projectId, conversationId, createdAt, [projectId+createdAt]',
      contradictions:
        'id, projectId, messageId, entryName, exempted, createdAt, ' +
        '[projectId+entryName], [projectId+createdAt]',
    })
    // v14: drop embeddings table (RAG vector system removed in feature audit).
    // null in stores() deletes the table. The upgrade clears any existing
    // vector data before Dexie removes the object store.
    this.version(14)
      .stores({
        projects: 'id, updatedAt, deletedAt',
        chapters: 'id, projectId, order, deletedAt',
        layoutSettings: 'id',
        worldEntries: 'id, projectId, type, name, deletedAt',
        relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
        aiConfig: 'id',
        messages: 'id, projectId, conversationId, role, timestamp',
        consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
        revisions: 'id, projectId, chapterId, createdAt',
        analyses: 'id, kind, invalidationKey, createdAt',
        conversations: 'id, projectId, updatedAt',
        aiUsage: 'id, projectId, conversationId, createdAt, model',
        abTestMetrics: 'id, projectId, conversationId, createdAt, [projectId+createdAt]',
        contradictions:
          'id, projectId, messageId, entryName, exempted, createdAt, ' +
          '[projectId+entryName], [projectId+createdAt]',
        embeddings: null,
      })
      .upgrade(async tx => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (tx as any).embeddings?.clear()
        } catch {
          // Table may already be absent on some browser versions — safe to ignore.
        }
      })
    // v15: drop abTestMetrics table (A/B experiment harness removed with the
    // citations / experimentFlags cleanup). Upgrade clears existing rows
    // before Dexie removes the object store.
    this.version(15)
      .stores({
        projects: 'id, updatedAt, deletedAt',
        chapters: 'id, projectId, order, deletedAt',
        layoutSettings: 'id',
        worldEntries: 'id, projectId, type, name, deletedAt',
        relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
        aiConfig: 'id',
        messages: 'id, projectId, conversationId, role, timestamp',
        consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
        revisions: 'id, projectId, chapterId, createdAt',
        analyses: 'id, kind, invalidationKey, createdAt',
        conversations: 'id, projectId, updatedAt',
        aiUsage: 'id, projectId, conversationId, createdAt, model',
        contradictions:
          'id, projectId, messageId, entryName, exempted, createdAt, ' +
          '[projectId+entryName], [projectId+createdAt]',
        abTestMetrics: null,
      })
      .upgrade(async tx => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (tx as any).abTestMetrics?.clear()
        } catch {
          // Table may already be absent — safe to ignore.
        }
      })
    // v16: LayoutSnapshot table for node position persistence
    this.version(16).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      contradictions:
        'id, projectId, messageId, entryName, exempted, createdAt, ' +
        '[projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
    })
    // v17: Phase 1 charter storage and preference-memory capture.
    this.version(17).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      contradictions:
        'id, projectId, messageId, entryName, exempted, createdAt, ' +
        '[projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
      projectCharter: 'id, projectId, updatedAt',
      preferenceMemories: 'id, projectId, messageId, createdAt, [projectId+createdAt]',
    })
    // v18: Phase 2 story-bible tracker storage.
    this.version(18).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      contradictions:
        'id, projectId, messageId, entryName, exempted, createdAt, ' +
        '[projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
      projectCharter: 'id, projectId, updatedAt',
      preferenceMemories: 'id, projectId, messageId, createdAt, [projectId+createdAt]',
      storyTrackers:
        'id, projectId, kind, status, createdAt, updatedAt, ' +
        '[projectId+kind], [projectId+status]',
    })
    // v19: Phase 3 planning-chain storage.
    this.version(19).stores({
      projects: 'id, updatedAt, deletedAt',
      chapters: 'id, projectId, order, deletedAt',
      layoutSettings: 'id',
      worldEntries: 'id, projectId, type, name, deletedAt',
      relations: 'id, projectId, sourceEntryId, targetEntryId, deletedAt',
      aiConfig: 'id',
      messages: 'id, projectId, conversationId, role, timestamp',
      consistencyExemptions: 'id, projectId, exemptionKey, createdAt',
      revisions: 'id, projectId, chapterId, createdAt',
      analyses: 'id, kind, invalidationKey, createdAt',
      conversations: 'id, projectId, updatedAt',
      aiUsage: 'id, projectId, conversationId, createdAt, model',
      contradictions:
        'id, projectId, messageId, entryName, exempted, createdAt, ' +
        '[projectId+entryName], [projectId+createdAt]',
      layoutSnapshots: 'id, projectId, [projectId+layoutId], [projectId+nodeId], nodeId',
      projectCharter: 'id, projectId, updatedAt',
      preferenceMemories: 'id, projectId, messageId, createdAt, [projectId+createdAt]',
      storyTrackers:
        'id, projectId, kind, status, createdAt, updatedAt, ' +
        '[projectId+kind], [projectId+status]',
      ideaNotes: 'id, projectId, status, updatedAt, deletedAt',
      storyArcs: 'id, projectId, order, status, updatedAt, deletedAt',
      chapterPlans:
        'id, projectId, arcId, linkedChapterId, order, status, updatedAt, deletedAt',
      sceneCards:
        'id, projectId, chapterPlanId, order, status, updatedAt, deletedAt, ' +
        '[projectId+chapterPlanId]',
    })
  }
}

/**
 * Factory function to get or create a per-project database instance.
 * Per D-19: each project gets its own DB for isolation.
 *
 * Instances are cached by projectId so hot-path callers (per-render hooks,
 * sync loops) don't spin up redundant Dexie wrappers. Production code never
 * closes a DB, so the cache lives for the tab lifetime. Tests that call
 * `db.close()` must call `__resetProjectDBCache()` to evict stale entries.
 */
const instances = new Map<string, InkForgeProjectDB>()

export function createProjectDB(projectId: string): InkForgeProjectDB {
  let db = instances.get(projectId)
  if (!db) {
    db = new InkForgeProjectDB(projectId)
    instances.set(projectId, db)
  }
  return db
}

export function __resetProjectDBCache(): void {
  for (const db of instances.values()) {
    try { db.close() } catch { /* already closed */ }
  }
  instances.clear()
}
