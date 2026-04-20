import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { createProjectDB, __resetProjectDBCache } from '@/lib/db/project-db'
import type { AIUsageEvent } from '@/lib/db/project-db'
import { DevStatsDrawer } from './dev-stats-drawer'
import {
  __resetIndexerLatency,
  recordIndexerLatency,
} from '@/lib/rag/indexer-latency'

const PROJECT_ID = 'dev-stats-drawer-test'

async function seedUsage(overrides: Partial<AIUsageEvent> = {}): Promise<void> {
  const db = createProjectDB(PROJECT_ID)
  await db.aiUsage.add({
    id: crypto.randomUUID(),
    projectId: PROJECT_ID,
    conversationId: 'c-1',
    kind: 'chat',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 30,
    cacheWriteTokens: 0,
    latencyMs: 800,
    createdAt: Date.now(),
    draftOffered: true,
    draftAccepted: true,
    draftEditedPct: 0.25,
    ...overrides,
  })
}

describe('DevStatsDrawer', () => {
  beforeEach(() => {
    __resetProjectDBCache()
    __resetIndexerLatency()
    indexedDB.deleteDatabase(`inkforge-project-${PROJECT_ID}`)
  })

  afterEach(() => {
    cleanup()
    __resetProjectDBCache()
    __resetIndexerLatency()
  })

  it('renders nothing to the DOM when closed', () => {
    render(<DevStatsDrawer projectId={PROJECT_ID} open={false} onOpenChange={() => {}} />)
    expect(screen.queryByText('开发者统计')).not.toBeInTheDocument()
  })

  it('shows the empty-state copy when there is no data', async () => {
    render(<DevStatsDrawer projectId={PROJECT_ID} open={true} onOpenChange={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText(/暂无足够数据/)).toBeInTheDocument()
    })
  })

  it('renders usage rows when aiUsage has draft adoption data', async () => {
    await seedUsage({ draftOffered: true, draftAccepted: true, draftEditedPct: 0.4 })
    await seedUsage({ draftOffered: true, draftAccepted: false, draftRejectedReason: 'style' })
    render(<DevStatsDrawer projectId={PROJECT_ID} open={true} onOpenChange={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText('草稿 采纳/提供')).toBeInTheDocument()
    })
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('renders the indexer latency section when the ring buffer has entries for this project', async () => {
    recordIndexerLatency({
      projectId: PROJECT_ID,
      kind: 'worldEntry',
      ms: 120,
      added: 2,
      skipped: 1,
      removed: 0,
      at: Date.now(),
    })
    await seedUsage()
    render(<DevStatsDrawer projectId={PROJECT_ID} open={true} onOpenChange={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText('索引延迟')).toBeInTheDocument()
    })
    expect(screen.getByText('最近一次')).toBeInTheDocument()
  })
})
