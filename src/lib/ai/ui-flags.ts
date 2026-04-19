/**
 * UI experimental flags — post-v0.3 surface state.
 *
 * These gate UI entry points for:
 * - style profile tab in /projects/[id]/analysis (to be repositioned under
 *   WorldEntry in T4; flag kept until migration lands)
 * - timeline view tab in /projects/[id]/analysis
 *
 * Defaults are all-on; legacy stored `false` values are ignored so every
 * install surfaces the completed feature set. The flag shape is retained
 * for future selective hiding without a schema change.
 *
 * Distinct from ExperimentFlags (Anthropic 2026 primitives).
 *
 * Removed in v0.3 T9:
 * - showGenerationPipeline — GenerationDrawer + GenerationButton + the
 *   entire chapter-generation pipeline were deleted. AI-assisted drafts
 *   now live inside the AI chat panel only.
 */

export interface UiExperimentFlags {
  /** Show the "文风" (style) tab in /projects/[id]/analysis. */
  showStyleProfile: boolean
  /** Show the "时间线" (timeline) tab in /projects/[id]/analysis. */
  showTimelineView: boolean
}

export const DEFAULT_UI_FLAGS: UiExperimentFlags = {
  showStyleProfile: true,
  showTimelineView: true,
}

export function resolveUiFlags(_flags?: Partial<UiExperimentFlags>): UiExperimentFlags {
  return { ...DEFAULT_UI_FLAGS }
}
