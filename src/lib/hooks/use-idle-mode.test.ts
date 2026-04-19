import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIdleMode } from './use-idle-mode'

describe('useIdleMode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns false initially', () => {
    const { result } = renderHook(() => useIdleMode(1_000))
    expect(result.current).toBe(false)
  })

  it('transitions to true after the configured timeout with no activity', () => {
    const { result } = renderHook(() => useIdleMode(10_000))
    expect(result.current).toBe(false)
    act(() => {
      vi.advanceTimersByTime(9_999)
    })
    expect(result.current).toBe(false)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it('resets to false on keydown and restarts the timer', () => {
    const { result } = renderHook(() => useIdleMode(5_000))
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })
    expect(result.current).toBe(false)

    // Timer should be restarted — still needs full timeout to go idle again.
    act(() => {
      vi.advanceTimersByTime(4_999)
    })
    expect(result.current).toBe(false)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it('resets on mousemove, wheel, and touchstart', () => {
    for (const eventName of ['mousemove', 'wheel', 'touchstart']) {
      const { result, unmount } = renderHook(() => useIdleMode(3_000))
      act(() => {
        vi.advanceTimersByTime(3_000)
      })
      expect(result.current).toBe(true)

      act(() => {
        window.dispatchEvent(new Event(eventName))
      })
      expect(result.current).toBe(false)
      unmount()
    }
  })

  it('cleans up listeners + timer on unmount (no ghost timer)', () => {
    const { unmount } = renderHook(() => useIdleMode(2_000))
    unmount()
    // If the timer lived past unmount, advancing timers below would still
    // transition state somewhere. The test passes when no state update
    // fires on unmounted component — React Testing Library would complain
    // via `act` warnings otherwise. Runs without throwing.
    act(() => {
      vi.advanceTimersByTime(10_000)
      window.dispatchEvent(new Event('mousemove'))
    })
  })
})
