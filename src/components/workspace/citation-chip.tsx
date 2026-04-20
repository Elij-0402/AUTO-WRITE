'use client'

import { useCallback, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Citation } from '@/lib/ai/citations'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useSidebarNav } from '@/lib/hooks/use-sidebar-nav'
import { createProjectDB } from '@/lib/db/project-db'
import { recordUsage } from '@/lib/db/ai-usage-queries'
import { Button } from '@/components/ui/button'

export interface CitationChipProps {
  citation: Citation
  index: number
  /** Required so T2 can persist the click event + look up the entry. */
  projectId: string
  /** Conversation the citation belongs to (null if none). */
  conversationId?: string | null
  /** Legacy callback — still fires for back-compat, but the popover UX is primary. */
  onClick?: (entryId: string | undefined) => void
}

/**
 * Interactive citation chip (T2).
 *
 * Clicking the chip opens a Radix Popover with the entry name + first two
 * lines of description, plus a "跳到条目" button that wires into the
 * sidebar-nav context to switch the left sidebar to the world tab and
 * select the referenced WorldEntry.
 *
 * Deleted-entry fallback per CEO-2B: if the entry was deleted after the
 * citation was recorded, the popover still opens but shows "(已删除)" and
 * the jump button is disabled.
 *
 * Every open fires an aiUsage row with kind='citation_click' for T8
 * dev-stats. Best-effort — a logging failure never interrupts the UX.
 */
export function CitationChip({
  citation,
  index,
  projectId,
  conversationId = null,
  onClick,
}: CitationChipProps) {
  const [open, setOpen] = useState(false)
  const { entries } = useWorldEntries(projectId)
  const nav = useSidebarNav()

  // Primary lookup by id (post-v0.2 citations). Fall back to name match for
  // older messages whose entryId didn't get persisted.
  const entry = useMemo(() => {
    if (!entries) return undefined
    if (citation.entryId) {
      return entries.find(e => e.id === citation.entryId)
    }
    if (citation.entryName) {
      return entries.find(e => e.name === citation.entryName && !e.deletedAt)
    }
    return undefined
  }, [entries, citation.entryId, citation.entryName])

  const deleted = !!entry?.deletedAt
  const displayName = entry?.name ?? citation.entryName ?? `#${citation.startBlockIndex}`
  const preview = useMemo(() => {
    if (!entry || deleted) return ''
    // Prefer description / background / features — whichever has content.
    const raw =
      entry.description || entry.background || entry.personality || entry.features || entry.content || ''
    return raw.split(/\n/).slice(0, 2).join('\n').slice(0, 120)
  }, [entry, deleted])

  const handleJump = useCallback(() => {
    if (!entry || deleted) return
    // Close the popover first so the sidebar reflow doesn't compete with the
    // popover portal unmount (DSN-4D).
    setOpen(false)
    setTimeout(() => nav.focusWorldEntry(entry.id), 0)
    onClick?.(entry.id)
  }, [entry, deleted, nav, onClick])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) return
      // Fire-and-forget telemetry on each open.
      const db = createProjectDB(projectId)
      void recordUsage(db, {
        id: crypto.randomUUID(),
        projectId,
        conversationId,
        kind: 'citation_click',
        provider: 'anthropic',
        model: '',
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        latencyMs: 0,
        createdAt: Date.now(),
      }).catch(() => {
        /* telemetry best-effort */
      })
    },
    [projectId, conversationId]
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border border-[hsl(var(--accent))]/45 text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 hover:bg-[hsl(var(--accent))]/20 transition-colors cursor-pointer"
          title={citation.citedText}
          aria-label={`查看引用 ${index + 1}: ${displayName}`}
        >
          <span className="tabular-nums text-muted-foreground">[{index + 1}]</span>
          <span className="truncate max-w-[120px]">{displayName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-64 animate-fade-in">
        <div className="text-[13px] font-medium text-foreground flex items-center gap-2">
          <span>{displayName}</span>
          {deleted && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
              (已删除)
            </span>
          )}
        </div>
        {preview && (
          <p className="mt-1 text-[12px] leading-[1.7] text-muted-foreground whitespace-pre-wrap">
            {preview}
          </p>
        )}
        {citation.citedText && !preview && (
          <p className="mt-1 text-[12px] leading-[1.7] text-muted-foreground/80 whitespace-pre-wrap italic">
            “{citation.citedText.slice(0, 120)}{citation.citedText.length > 120 ? '…' : ''}”
          </p>
        )}
        <div className="mt-2.5 flex items-center justify-end">
          <Button
            size="sm"
            variant="ghost"
            disabled={!entry || deleted}
            onClick={handleJump}
            className="h-7 gap-1.5 text-[12px]"
          >
            <ExternalLink className="h-3 w-3" />
            跳到条目
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
