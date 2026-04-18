import { describe, it, expect } from 'vitest'
import {
  DEFAULT_EXPERIMENT_FLAGS,
  providerCapabilities,
  resolveExperimentFlags,
} from './experiment-flags'

describe('experiment-flags', () => {
  describe('DEFAULT_EXPERIMENT_FLAGS', () => {
    it('all three flags default to false', () => {
      expect(DEFAULT_EXPERIMENT_FLAGS).toEqual({
        citations: false,
        extendedCacheTtl: false,
        thinking: false,
      })
    })
  })

  describe('providerCapabilities', () => {
    it('anthropic supports all three', () => {
      expect(providerCapabilities('anthropic')).toEqual({
        citations: true,
        extendedCacheTtl: true,
        thinking: true,
      })
    })

    it('openai-compatible supports none', () => {
      expect(providerCapabilities('openai-compatible')).toEqual({
        citations: false,
        extendedCacheTtl: false,
        thinking: false,
      })
    })

    it('undefined provider supports none', () => {
      expect(providerCapabilities(undefined)).toEqual({
        citations: false,
        extendedCacheTtl: false,
        thinking: false,
      })
    })
  })

  describe('resolveExperimentFlags', () => {
    it('returns all-false when no flags requested', () => {
      expect(resolveExperimentFlags({ provider: 'anthropic' })).toEqual(DEFAULT_EXPERIMENT_FLAGS)
    })

    it('respects user flags on Anthropic', () => {
      expect(
        resolveExperimentFlags({
          provider: 'anthropic',
          experimentFlags: { citations: true, extendedCacheTtl: true },
        })
      ).toEqual({ citations: true, extendedCacheTtl: true, thinking: false })
    })

    it('coerces all flags to false on openai-compatible even if requested', () => {
      expect(
        resolveExperimentFlags({
          provider: 'openai-compatible',
          experimentFlags: { citations: true, extendedCacheTtl: true, thinking: true },
        })
      ).toEqual({ citations: false, extendedCacheTtl: false, thinking: false })
    })

    it('merges partial flag objects with defaults', () => {
      expect(
        resolveExperimentFlags({
          provider: 'anthropic',
          experimentFlags: { thinking: true },
        })
      ).toEqual({ citations: false, extendedCacheTtl: false, thinking: true })
    })

    it('defaults provider to undefined → capabilities all false', () => {
      expect(
        resolveExperimentFlags({ experimentFlags: { citations: true } })
      ).toEqual({ citations: false, extendedCacheTtl: false, thinking: false })
    })
  })
})
