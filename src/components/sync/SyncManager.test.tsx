import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const flushSyncQueueMock = vi.fn()
const enqueueChangeMock = vi.fn()
const useSyncMock = vi.fn()

vi.mock('@/lib/sync/sync-engine', () => ({
  flushSyncQueue: (...args: unknown[]) => flushSyncQueueMock(...args),
}))

vi.mock('@/lib/sync/sync-queue', () => ({
  enqueueChange: (...args: unknown[]) => enqueueChangeMock(...args),
}))

vi.mock('@/lib/hooks/useSync', () => ({
  useSync: () => useSyncMock(),
}))

describe('SyncManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { onLine: true })
    flushSyncQueueMock.mockResolvedValue({ synced: 1, failed: 0 })
    useSyncMock.mockReturnValue({
      setStatus: vi.fn(),
      setLastSynced: vi.fn(),
    })
  })

  it('marks sync as synced and records time after a successful interval flush', async () => {
    const { SyncManager } = await import('./SyncManager')
    const syncState = useSyncMock()

    render(<SyncManager />)

    await vi.advanceTimersByTimeAsync(30_000)

    expect(syncState.setStatus).toHaveBeenNthCalledWith(1, 'syncing')
    expect(syncState.setStatus).toHaveBeenNthCalledWith(2, 'synced')
    expect(syncState.setLastSynced).toHaveBeenCalledTimes(1)
  })

  it('marks sync as error when the interval flush throws', async () => {
    flushSyncQueueMock.mockRejectedValueOnce(new Error('network down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { SyncManager } = await import('./SyncManager')
    const syncState = useSyncMock()

    render(<SyncManager />)

    await vi.advanceTimersByTimeAsync(30_000)

    expect(syncState.setStatus).toHaveBeenCalledWith('error')
    errorSpy.mockRestore()
  })

  it('queues and flushes an immediate sync payload', async () => {
    const { triggerImmediateSync } = await import('./SyncManager')

    await triggerImmediateSync('chapters', 'update', { id: 'chapter-1' }, 'user-1')

    expect(enqueueChangeMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'chapters',
      operation: 'update',
      data: { id: 'chapter-1' },
      userId: 'user-1',
    }))
    expect(flushSyncQueueMock).toHaveBeenCalled()
  })
})
