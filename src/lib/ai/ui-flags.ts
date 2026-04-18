/**
 * UI experimental flags — per deep-interview spec AC-6 (surface pruning).
 *
 * These gate UI entry points to features that exist in the codebase but are
 * not part of v1 spine (generation pipeline, style profile, timeline view).
 * Code is preserved; only the default surface is reduced so fresh-install
 * users see a focused experience.
 *
 * Distinct from ExperimentFlags (which gates Anthropic 2026 primitives).
 */

export interface UiExperimentFlags {
  /** Show the generation button in workspace and the generation panel in outline editor. */
  showGenerationPipeline: boolean
  /** Show the "文风" (style) tab in /projects/[id]/analysis. */
  showStyleProfile: boolean
  /** Show the "时间线" (timeline) tab in /projects/[id]/analysis. */
  showTimelineView: boolean
}

export const DEFAULT_UI_FLAGS: UiExperimentFlags = {
  showGenerationPipeline: false,
  showStyleProfile: false,
  showTimelineView: false,
}

export function resolveUiFlags(flags: Partial<UiExperimentFlags> | undefined): UiExperimentFlags {
  return { ...DEFAULT_UI_FLAGS, ...(flags ?? {}) }
}
