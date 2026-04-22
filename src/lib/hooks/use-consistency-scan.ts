'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { scanConsistency, type ConsistencyViolation } from '../ai/scan-consistency'
import type { AIClientConfig } from '../ai/providers/types'
import type { WorldEntry } from '../types/world-entry'
import type { Chapter } from '../types/chapter'
import { createProjectDB } from '../db/project-db'
import { useLiveQuery } from 'dexie-react-hooks'

export type ConsistencyScanState = 'idle' | 'scanning' | 'results_ready' | 'error'

export interface UseConsistencyScanOptions {
  projectId: string
  config: AIClientConfig
  worldEntries: WorldEntry[]
}

export interface ScanProgress {
  current: number
  total: number
  /** Currently scanning chapter title, or null if between chapters */
  currentChapterTitle: string | null
}

export interface UseConsistencyScanReturn {
  state: ConsistencyScanState
  results: ConsistencyViolation[]
  progress: ScanProgress | null
  error: string | null
  startScan: (chapterIds: string[]) => Promise<void>
  exemptResult: (violation: ConsistencyViolation) => Promise<void>
  cancelScan: () => void
  clearResults: () => void
}

/** 7-day dedup window in milliseconds */
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

/** Concurrent scan limit to avoid rate limiting */
const CONCURRENCY = 2

export function useConsistencyScan({
  projectId,
  config,
  worldEntries,
}: UseConsistencyScanOptions): UseConsistencyScanReturn {
  const [state, setState] = useState<ConsistencyScanState>('idle')
  const [results, setResults] = useState<ConsistencyViolation[]>([])
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isScanningRef = useRef(false)

  const db = useMemo(() => createProjectDB(projectId), [projectId])

  // Load chapters reactively
  const chapters = useLiveQuery(
    () =>
      db.chapters
        .where('projectId')
        .equals(projectId)
        .and((c) => c.deletedAt === null)
        .sortBy('order'),
    [db, projectId],
    [] as Chapter[]
  )

  const cancelScan = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    isScanningRef.current = false
    setState('idle')
    setProgress(null)
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setState('idle')
    setError(null)
    setProgress(null)
  }, [])

  /**
   * Add a consistency exemption for an entry (all violations of that entry).
   * Exemption is at entryName+entryType level — permanently skips this entry
   * in future scans for 7 days (exemption table) and indefinitely (via local filter).
   */
  const exemptResult = useCallback(
    async (violation: ConsistencyViolation) => {
      const exemptionKey = `${violation.entryName}:${violation.entryType}`

      await db.consistencyExemptions.add({
        id: crypto.randomUUID(),
        projectId,
        exemptionKey,
        createdAt: Date.now(),
      })

      // Mark all matching contradictions as exempted (entry-level, not per-description)
      const existing = await db.contradictions
        .where('[projectId+entryName]')
        .equals([projectId, violation.entryName])
        .toArray()

      for (const row of existing) {
        if (row.entryType === violation.entryType && !row.exempted) {
          await db.contradictions.update(row.id, { exempted: true })
        }
      }

      // Remove all violations of this entry from local results (entry-level)
      setResults((prev) =>
        prev.filter(
          (r) =>
            !(r.entryName === violation.entryName && r.entryType === violation.entryType)
        )
      )
    },
    [db, projectId]
  )

  /**
   * Scan a single chapter, returning violations.
   */
  const scanOneChapter = useCallback(
    async (
      chapter: Chapter,
      exemptions: Array<{ exemptionKey: string }>,
      cutoff: number,
      signal: AbortSignal
    ): Promise<{ chapter: Chapter; violations: ConsistencyViolation[] }> => {
      const content = extractTextFromTiptap(chapter.content)
      if (!content.trim()) {
        return { chapter, violations: [] }
      }

      const violations = await scanConsistency({
        config,
        chapterTitle: chapter.title,
        chapterContent: content,
        worldEntries,
        signal,
      })

      // Load existing contradictions for dedup (batch query once per chapter)
      const existingContradictions = await db.contradictions
        .where('[projectId+entryName]')
        .equals([projectId, chapter.id])
        .toArray()

      // Build dedup set for this chapter
      const recentByEntry = new Map<string, boolean>()
      for (const row of existingContradictions) {
        if (row.createdAt >= cutoff && !row.exempted) {
          recentByEntry.set(`${row.entryName}:${row.entryType}`, true)
        }
      }

      const exemptionKeys = new Set(exemptions.map((e) => e.exemptionKey))

      const filtered: ConsistencyViolation[] = []
      for (const v of violations) {
        const key = `${v.entryName}:${v.entryType}`
        if (exemptionKeys.has(key)) continue
        if (v.severity === 'low') continue
        if (recentByEntry.has(key)) continue

        // Persist to contradictions table
        await db.contradictions.add({
          id: crypto.randomUUID(),
          projectId,
          conversationId: null,
          messageId: null,
          entryName: v.entryName,
          entryType: v.entryType,
          description: v.description,
          exempted: false,
          createdAt: Date.now(),
          chapterId: chapter.id,
        })

        filtered.push(v)
      }

      return { chapter, violations: filtered }
    },
    [config, worldEntries, db, projectId]
  )

  /**
   * Start a consistency scan over selected chapters.
   * @param chapterIds - empty array means scan all chapters
   */
  const startScan = useCallback(
    async (chapterIds: string[]): Promise<void> => {
      // Double-click guard
      if (isScanningRef.current) return
      isScanningRef.current = true

      // Validate config
      if (!config.apiKey) {
        setError('还没设置 API 密钥')
        setState('error')
        isScanningRef.current = false
        return
      }

      if (!config.baseUrl && config.provider === 'openai-compatible') {
        setError('还没填写接口地址')
        setState('error')
        isScanningRef.current = false
        return
      }

      // Determine chapters to scan
      const chaptersToScan =
        chapterIds.length > 0
          ? chapters.filter((c) => chapterIds.includes(c.id))
          : chapters

      if (chaptersToScan.length === 0) {
        setError('没有可扫描的章节')
        setState('error')
        isScanningRef.current = false
        return
      }

      // Reset state
      setError(null)
      setResults([])
      setState('scanning')
      setProgress({ current: 0, total: chaptersToScan.length, currentChapterTitle: null })

      abortControllerRef.current = new AbortController()
      const now = Date.now()
      const cutoff = now - SEVEN_DAYS

      try {
        // Load exemptions once before scanning
        const exemptions = await db.consistencyExemptions
          .where('projectId')
          .equals(projectId)
          .toArray()

        // Concurrent scan with controlled parallelism
        const allViolations: ConsistencyViolation[] = []
        let completedCount = 0

        // Process in batches of CONCURRENCY
        for (let i = 0; i < chaptersToScan.length; i += CONCURRENCY) {
          if (abortControllerRef.current.signal.aborted) break

          const batch = chaptersToScan.slice(i, i + CONCURRENCY)

          const batchPromises = batch.map((chapter) =>
            scanOneChapter(chapter, exemptions, cutoff, abortControllerRef.current!.signal)
              .then((result) => ({ result, error: null }))
              .catch((err) => {
                if (err instanceof Error && err.name === 'AbortError') throw err
                console.warn(`[useConsistencyScan] Failed to scan chapter ${chapter.id}:`, err)
                return { result: null, error: err }
              })
          )

          const results = await Promise.all(batchPromises)

          for (const { result } of results) {
            if (!result) continue
            completedCount++
            allViolations.push(...result.violations)
            setProgress({
              current: completedCount,
              total: chaptersToScan.length,
              currentChapterTitle: result.chapter.title,
            })
          }
        }

        setResults(allViolations)
        setState('results_ready')
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setState('idle')
        } else {
          setError(err instanceof Error ? err.message : '扫描失败')
          setState('error')
        }
      } finally {
        abortControllerRef.current = null
        isScanningRef.current = false
        setProgress(null)
      }
    },
    [config, chapters, db, projectId, scanOneChapter]
  )

  return {
    state,
    results,
    progress,
    error,
    startScan,
    exemptResult,
    cancelScan,
    clearResults,
  }
}

/**
 * Extract plain text from a Tiptap ProseMirror document.
 * Handles paragraph, heading, codeBlock, blockquote, listItem, table, and horizontalRule nodes.
 */
function extractTextFromTiptap(doc: object | null): string {
  if (!doc || typeof doc !== 'object') return ''

  const texts: string[] = []
  traverseTiptapNode(doc as TiptapNode, texts)
  return texts.join('\n')
}

interface TiptapNode {
  type?: string
  content?: TiptapNode[]
  text?: string
  marks?: Array<{ type: string }>
}

function traverseTiptapNode(node: TiptapNode, texts: string[]): void {
  if (!node) return

  if (node.type === 'text' && typeof node.text === 'string') {
    texts.push(node.text)
    return
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      traverseTiptapNode(child, texts)
    }
  }

  // Add newlines after block-level nodes for readability
  if (
    node.type === 'paragraph' ||
    node.type === 'heading' ||
    node.type === 'blockquote' ||
    node.type === 'codeBlock' ||
    node.type === 'listItem' ||
    node.type === 'tableRow' ||
    node.type === 'horizontalRule'
  ) {
    texts.push('\n')
  }
}
