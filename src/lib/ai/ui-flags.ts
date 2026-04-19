/**
 * UI experimental flags — per deep-interview spec AC-6 (surface pruning).
 *
 * These gate UI entry points to features that exist in the codebase:
 * generation pipeline, style profile, timeline view. After v1 validation
 * these are **enabled by default** — users expect to see all completed
 * features; hiding them behind a "实验性" toggle hurt discovery.
 *
 * Flags stay for advanced users who want to hide surfaces, but defaults
 * now favor exposure. Distinct from ExperimentFlags (Anthropic 2026 primitives).
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
  showGenerationPipeline: true,
  showStyleProfile: true,
  showTimelineView: true,
}

export function resolveUiFlags(_flags?: Partial<UiExperimentFlags>): UiExperimentFlags {
  // Post-v1 decision: these features (generation / style profile / timeline)
  // are fully implemented — they're no longer "experimental". Defaults are
  // all-on and we intentionally ignore any stored false from beta users so
  // every install surfaces the completed feature set. The flag shape is
  // retained for future selective hiding without a schema change.
  return { ...DEFAULT_UI_FLAGS }
}
