/**
 * UI experimental flags — post-v0.3 surface state.
 *
 * These gate UI entry points for:
 * - timeline view tab in /projects/[id]/analysis
 *
 * Defaults are all-on; legacy stored `false` values are ignored so every
 * install surfaces the completed feature set. The flag shape is retained
 * for future selective hiding without a schema change.
 *
 * Distinct from ExperimentFlags (Anthropic 2026 primitives).
 *
 * Removed in v0.3:
 * - T9: showGenerationPipeline — GenerationDrawer + GenerationButton + the
 *   chapter-generation pipeline were deleted. AI-assisted drafts now live
 *   inside the AI chat panel only.
 * - T4: showStyleProfile — the project-wide style-profile analysis tab was
 *   retired. Style-fingerprint information moved to a per-WorldEntry
 *   `inferredVoice` field on the edit form (character + location only).
 */

export interface UiExperimentFlags {
  /** Show the "时间线" (timeline) tab in /projects/[id]/analysis. */
  showTimelineView: boolean
}

export const DEFAULT_UI_FLAGS: UiExperimentFlags = {
  showTimelineView: true,
}

export function resolveUiFlags(_flags?: Partial<UiExperimentFlags>): UiExperimentFlags {
  void _flags // reserved for future selective overrides
  return { ...DEFAULT_UI_FLAGS }
}
