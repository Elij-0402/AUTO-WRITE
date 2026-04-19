/**
 * Chapter-completion audio tick — per v0.3 T6 atmosphere layer.
 *
 * Fires a single 60ms sine burst at 440Hz, -30dB, when a chapter's status
 * transitions from 'draft' to 'completed'. Respects a global off switch
 * stored in localStorage ('inkforge.tickEnabled' === 'false' → off).
 *
 * Per /autoplan DSN-1D + DSN-5B: minimal, state-transition only, no
 * environment/notification/music tones. Audio may be blocked by browser
 * autoplay policy before first user gesture — we silently fail (no console
 * spam) in that case per ENG-4C.
 *
 * AudioContext is a module-level singleton (ENG-4C) so we don't spawn a
 * new one per tick — browsers limit total AudioContext instances.
 */

const STORAGE_KEY = 'inkforge.tickEnabled'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (audioCtx && audioCtx.state !== 'closed') return audioCtx
  try {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
    return audioCtx
  } catch {
    return null
  }
}

export function isTickEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setTickEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
  } catch {
    /* storage disabled */
  }
}

/**
 * Fire the completion tick. Returns true if a tick was actually played,
 * false if silenced (user disabled OR AudioContext unavailable).
 * No-throw contract; never bubbles audio errors up to the caller.
 */
export function playChapterCompleteTick(): boolean {
  if (!isTickEnabled()) return false
  const ctx = getAudioContext()
  if (!ctx) return false
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    // -30 dB relative to full scale ≈ linear 0.0316
    gain.gain.value = 0.0316
    osc.type = 'sine'
    osc.frequency.value = 440
    osc.connect(gain)
    gain.connect(ctx.destination)
    const start = ctx.currentTime
    osc.start(start)
    osc.stop(start + 0.06)
    return true
  } catch {
    return false
  }
}

/**
 * Test hook — reset the singleton. Production code never needs this.
 */
export function __resetAudioCtxForTest(): void {
  if (audioCtx) {
    try {
      audioCtx.close()
    } catch {
      /* already closed */
    }
  }
  audioCtx = null
}
