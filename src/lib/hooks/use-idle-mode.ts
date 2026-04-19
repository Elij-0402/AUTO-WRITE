import { useEffect, useRef, useState } from 'react'

/**
 * Tracks user idleness based on keyboard + mouse + wheel + touch activity.
 * Returns true after `timeoutMs` without input, false the instant any
 * qualifying event fires.
 *
 * Listener lives on window with { passive: true } so it never blocks the
 * scroll thread. All listeners are removed on unmount — critical when the
 * hook mounts inside a workspace route that can unmount on navigation
 * (ENG-2D: no ghost timer on route change).
 *
 * Per /autoplan DSN-1D, atmosphere discipline = only the topbar visibly
 * reacts to `idle`. This hook is pure state; rendering decisions belong
 * to the caller.
 */
export function useIdleMode(timeoutMs: number = 10 * 60 * 1000): boolean {
  const [idle, setIdle] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const scheduleIdle = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIdle(true), timeoutMs)
    }
    const onActivity = () => {
      setIdle(false)
      scheduleIdle()
    }
    scheduleIdle()
    const events: Array<keyof WindowEventMap> = ['keydown', 'mousemove', 'wheel', 'touchstart']
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, onActivity))
    }
  }, [timeoutMs])

  return idle
}
