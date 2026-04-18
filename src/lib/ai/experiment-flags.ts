/**
 * Experiment flags for Phase B A/B harness — per deep-interview spec AC-4.
 *
 * Three Anthropic 2026 primitives are gated:
 *   citations        — AC-1, Citations API grounding (Anthropic-only)
 *   extendedCacheTtl — AC-2, 1-hour TTL beta header (Anthropic-only)
 *   thinking         — AC-3, Extended thinking for consistency (deferred to v1.1 stub)
 *
 * Resolver enforces provider-awareness: if the configured provider does not
 * support a primitive, the flag is coerced to false regardless of user intent.
 * This keeps the OpenAI-compatible path structurally unchanged.
 */

import type { AIProvider } from '../db/project-db'

export interface ExperimentFlags {
  citations: boolean
  extendedCacheTtl: boolean
  thinking: boolean
}

export const DEFAULT_EXPERIMENT_FLAGS: ExperimentFlags = {
  citations: false,
  extendedCacheTtl: false,
  thinking: false,
}

export interface ExperimentFlagCapabilities {
  citations: boolean
  extendedCacheTtl: boolean
  thinking: boolean
}

/**
 * Returns which experiment flags each provider is allowed to enable.
 * Citations/ExtendedCacheTtl/Thinking are Anthropic-native; others are off.
 */
export function providerCapabilities(provider: AIProvider | undefined): ExperimentFlagCapabilities {
  if (provider === 'anthropic') {
    return { citations: true, extendedCacheTtl: true, thinking: true }
  }
  return { citations: false, extendedCacheTtl: false, thinking: false }
}

/**
 * Resolve the effective experiment flags for a given config.
 * User-requested flags are intersected with provider capabilities.
 */
export function resolveExperimentFlags(config: {
  provider?: AIProvider
  experimentFlags?: Partial<ExperimentFlags>
}): ExperimentFlags {
  const caps = providerCapabilities(config.provider)
  const req = { ...DEFAULT_EXPERIMENT_FLAGS, ...(config.experimentFlags ?? {}) }
  return {
    citations: caps.citations && req.citations,
    extendedCacheTtl: caps.extendedCacheTtl && req.extendedCacheTtl,
    thinking: caps.thinking && req.thinking,
  }
}
