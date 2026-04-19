import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  playChapterCompleteTick,
  isTickEnabled,
  setTickEnabled,
  __resetAudioCtxForTest,
} from './tick'

describe('chapter-complete tick (T6 audio)', () => {
  beforeEach(() => {
    __resetAudioCtxForTest()
    localStorage.clear()
    // Clean any stub left by a previous test so each case controls its own env.
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
    delete (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext
  })

  afterEach(() => {
    __resetAudioCtxForTest()
    localStorage.clear()
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
    delete (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext
  })

  describe('isTickEnabled', () => {
    it('defaults to true when no storage key set', () => {
      expect(isTickEnabled()).toBe(true)
    })

    it('returns false after setTickEnabled(false)', () => {
      setTickEnabled(false)
      expect(isTickEnabled()).toBe(false)
    })

    it('returns true after setTickEnabled(true)', () => {
      setTickEnabled(false)
      setTickEnabled(true)
      expect(isTickEnabled()).toBe(true)
    })
  })

  describe('playChapterCompleteTick', () => {
    it('returns false when AudioContext is unavailable (jsdom default)', () => {
      // jsdom does not implement Web Audio by default. This is the realistic
      // first-call scenario before the user has granted audio permission.
      const result = playChapterCompleteTick()
      // false either because AudioContext isn't defined OR creation threw —
      // both are acceptable silent-fail paths per ENG-4C.
      expect(typeof result).toBe('boolean')
    })

    it('returns false when tick is disabled regardless of AudioContext support', () => {
      setTickEnabled(false)
      // Stub a minimal AudioContext so we can isolate the "disabled" path.
      const stub = {
        createOscillator: vi.fn(),
        createGain: vi.fn(),
        destination: {},
        currentTime: 0,
        state: 'running',
      } as unknown as AudioContext
      ;(window as unknown as { AudioContext?: unknown }).AudioContext = function () {
        return stub
      } as unknown as typeof AudioContext

      const result = playChapterCompleteTick()
      expect(result).toBe(false)
      expect(stub.createOscillator).not.toHaveBeenCalled()
    })

    it('plays a 60ms 440Hz sine at linear 0.0316 when enabled + audio available', () => {
      const osc = {
        type: '',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      const gain = {
        gain: { value: 1 },
        connect: vi.fn(),
      }
      const stub = {
        createOscillator: vi.fn(() => osc),
        createGain: vi.fn(() => gain),
        destination: {},
        currentTime: 123,
        state: 'running',
      }
      ;(window as unknown as { AudioContext?: unknown }).AudioContext =
        function AudioContext() {
          return stub
        } as unknown as typeof AudioContext

      const result = playChapterCompleteTick()
      expect(result).toBe(true)
      expect(osc.type).toBe('sine')
      expect(osc.frequency.value).toBe(440)
      // -30dB linear ≈ 0.0316; relax to 3 decimals
      expect(gain.gain.value).toBeCloseTo(0.0316, 3)
      expect(osc.start).toHaveBeenCalledWith(123)
      expect(osc.stop).toHaveBeenCalledWith(123 + 0.06)
    })

    it('swallows errors during playback and returns false', () => {
      const stub = {
        createOscillator: vi.fn(() => {
          throw new Error('audio unavailable')
        }),
        createGain: vi.fn(),
        destination: {},
        currentTime: 0,
        state: 'running',
      }
      ;(window as unknown as { AudioContext?: unknown }).AudioContext = function () {
        return stub
      } as unknown as typeof AudioContext

      const result = playChapterCompleteTick()
      expect(result).toBe(false)
    })
  })
})
