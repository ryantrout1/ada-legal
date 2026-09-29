/**
 * Claude model IDs: the one place they are set.
 *
 * Every in-scope Anthropic call reads its model from here, so moving a
 * surface to a new model is a one-line change in this file.
 * tests/unit/claudeModels.test.ts fails if a Claude model ID string appears
 * anywhere else in src/ or api/, and pins the values below.
 *
 * Not here on purpose: the shared photo reader's own default
 * (src/engine/clients/anthropicPhotoAnalysisClient.ts, claude-opus-4-8),
 * used by Ada's analyze_photo tool and case evidence. The /photo analyzer
 * tool and review queue were retired Sep 28, 2026. Spot builds its own
 * instance of that reader from spotPhotoReading.
 *
 * The 5.5 models reject forced tool use; see forcedToolChoiceSupported().
 *
 * Keep this file free of imports. The admin UI bundles it.
 *
 * One override still exists: SPOT_REPORT_MODEL in the environment wins over
 * spotReport (composeAndPlaceReport.ts). It is unset in production.
 */

export const CLAUDE_MODELS = Object.freeze({
  /** Ada intake chat. The AnthropicAiClient default. Phase 2 moved it from claude-sonnet-4-5 (retired Sep 29, 2026). */
  adaChat: 'claude-sonnet-5-5',
  /**
   * Spot photo reading: the free read and the paid report's photo pass.
   * Spot's own analyzer instance (clients.spotPhoto). The shared analyzer
   * (Ada's photo tool, case evidence, /photo) is not upgraded and keeps
   * its own default.
   */
  spotPhotoReading: 'claude-opus-5-5',
  /** Spot report synthesis: the paid report. */
  spotReport: 'claude-opus-5-5',
  /** Spot pin placement. Also used by api/ada/analyze-photo.ts. */
  spotPlacement: 'claude-opus-5-5',
  /** Second model offered for comparison in the admin annotation preview. */
  spotPlacementCompare: 'claude-sonnet-5-5',
  /** Guide assistant API. */
  guideAssistant: 'claude-sonnet-5-5',
} as const);

/**
 * Models that reject forced tool use: tool_choice "tool" and "any" return a
 * 400 on the 5.5 generation. Callers that force a tool must use auto tool
 * choice plus an explicit instruction for these instead.
 */
const NO_FORCED_TOOL_CHOICE = ['claude-opus-5-5', 'claude-sonnet-5-5'];

/** True when this model accepts tool_choice { type: 'tool' | 'any' }. */
export function forcedToolChoiceSupported(model: string): boolean {
  return !NO_FORCED_TOOL_CHOICE.some((m) => model === m || model.startsWith(`${m}-`));
}

/** The instruction sent in place of forcing a tool on models that reject it. */
export function callToolInstruction(toolName: string): string {
  return (
    `Respond by calling the ${toolName} tool exactly once with your complete answer. ` +
    'Do not answer in plain text.'
  );
}

/**
 * Models an admin can pick in the Spot annotation preview. One list, read by
 * both the API allowlist and the admin screen, so they cannot drift apart.
 */
export const SPOT_PLACEMENT_PREVIEW_MODELS: readonly string[] = Object.freeze([
  CLAUDE_MODELS.spotPlacement,
  CLAUDE_MODELS.spotPlacementCompare,
]);
