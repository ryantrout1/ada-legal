/**
 * Claude model IDs: the one place they are set.
 *
 * Every in-scope Anthropic call reads its model from here, so moving a
 * surface to a new model is a one-line change in this file.
 * tests/unit/claudeModels.test.ts fails if a Claude model ID string appears
 * anywhere else in src/ or api/, and pins the values below.
 *
 * Not here on purpose: the photo analyzer client
 * (src/engine/clients/anthropicPhotoAnalysisClient.ts), which is out of
 * scope and being retired.
 *
 * Keep this file free of imports. The admin UI bundles it.
 *
 * One override still exists: SPOT_REPORT_MODEL in the environment wins over
 * spotReport (composeAndPlaceReport.ts). It is unset in production.
 */

export const CLAUDE_MODELS = Object.freeze({
  /** Ada intake chat. The AnthropicAiClient default. Phase 2 moved it from claude-sonnet-4-5 (retired Sep 29, 2026). */
  adaChat: 'claude-sonnet-5-5',
  /** Spot report synthesis: the paid report. */
  spotReport: 'claude-opus-5',
  /** Spot pin placement. Also used by api/ada/analyze-photo.ts. */
  spotPlacement: 'claude-opus-4-8',
  /** Second model offered for comparison in the admin annotation preview. */
  spotPlacementCompare: 'claude-sonnet-5',
  /** Guide assistant API. */
  guideAssistant: 'claude-sonnet-5',
} as const);

/**
 * Models an admin can pick in the Spot annotation preview. One list, read by
 * both the API allowlist and the admin screen, so they cannot drift apart.
 */
export const SPOT_PLACEMENT_PREVIEW_MODELS: readonly string[] = Object.freeze([
  CLAUDE_MODELS.spotPlacement,
  CLAUDE_MODELS.spotPlacementCompare,
]);
