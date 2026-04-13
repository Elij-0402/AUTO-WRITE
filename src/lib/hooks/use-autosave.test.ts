import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from './use-autosave'

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call saveFn after debounce delay on content change', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ deps }) => useAutoSave(saveFn, deps, 500),
      { initialProps: { deps: ['initial'] } }
    )

    // Change deps (simulating content change)
    rerender({ deps: ['changed'] })

    // Should NOT have called saveFn yet (debounce)
    expect(saveFn).not.toHaveBeenCalled()

    // Fast-forward 500ms
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Now saveFn should have been called
    expect(saveFn).toHaveBeenCalledTimes(1)
  })

  it('should NOT call saveFn if content changes within debounce period', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ deps }) => useAutoSave(saveFn, deps, 500),
      { initialProps: { deps: ['initial'] } }
    )

    // Change deps rapidly
    rerender({ deps: ['changed1'] })
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    rerender({ deps: ['changed2'] })
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    // Should not have called saveFn yet (still within debounce)
    expect(saveFn).not.toHaveBeenCalled()

    // Fast-forward past debounce
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Should have called saveFn only once (with latest deps)
    expect(saveFn).toHaveBeenCalledTimes(1)
  })

  it('should save immediately on window blur (visibilitychange)', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    renderHook(
      ({ deps }) => useAutoSave(saveFn, deps, 500),
      { initialProps: { deps: ['initial'] } }
    )

    // Change content
    const { rerender } = renderHook(
      ({ deps }) => useAutoSave(saveFn, deps, 500),
      { initialProps: { deps: ['changed'] } }
    )

    // Trigger visibilitychange (simulating window blur)
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // saveFn should have been called
    expect(saveFn).toHaveBeenCalled()
  })

  it('should return isSaving and lastSaved state', async () => {
    let resolveSave: () => void
    const saveFn = vi.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveSave = resolve
      })
    })

    const { result, rerender } = renderHook(
      ({ deps }) => useAutoSave(saveFn, deps, 500),
      { initialProps: { deps: ['initial'] } }
    )

    // Initially not saving, no lastSaved
    expect(result.current.isSaving).toBe(false)
    expect(result.current.lastSaved).toBeNull()

    // Change content to trigger save
    rerender({ deps: ['changed'] })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Now saving
    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(result.current.isSaving).toBe(true)

    // Resolve the save
    await act(async () => {
      resolveSave!()
    })

    // No longer saving, lastSaved is set
    expect(result.current.isSaving).toBe(false)
    expect(result.current.lastSaved).toBeInstanceOf(Date)
  })
})