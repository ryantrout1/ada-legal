/**
 * Ada Spot — admin re-generate request parser (pure).
 *
 * The admin preview re-runs report generation with a chosen model. The model
 * is allowlisted so the admin endpoint can never be coaxed into an arbitrary
 * model string. Ref: /plan Ada Spot Phase 3b.
 *
 * THIS IS THE ONE DEFINITION. generateReport used to declare its own
 * SPOT_REPORT_DEFAULT_MODEL as a separate literal — two constants that
 * happened to agree, the same shape of bug as the duplicated photo cap.
 *
 * The Opus-4.8-vs-Fable-5 A/B is retired. Opus 4.8 was producing tool calls
 * that serialized the whole findings array into the `overview` string and
 * never emitted `areas` — reliably, on one real session's photos, twice in a
 * row including the retry. That shipped a zero-finding report to a paying
 * customer before the composition guards existed. Adding a comparison model
 * back is one more entry in this array.
 *
 * NOTE: this is the report SYNTHESIS model only. The photo ANALYSIS model in
 * anthropicPhotoAnalysisClient is a separate choice and is deliberately
 * untouched here — Peter has been grading analyzer output on it, and moving
 * it would invalidate that feedback.
 */

export const SPOT_REPORT_MODELS = ['claude-opus-5'] as const;
export type SpotReportModel = (typeof SPOT_REPORT_MODELS)[number];
export const SPOT_REPORT_DEFAULT_MODEL: SpotReportModel = 'claude-opus-5';

export type ParsedRegenerate =
  | { ok: true; sessionId: string; model: SpotReportModel }
  | { ok: false; error: string };

export function parseRegenerateBody(body: { sessionId?: unknown; model?: unknown }): ParsedRegenerate {
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!sessionId) return { ok: false, error: 'sessionId is required' };

  if (body.model === undefined || body.model === null) {
    return { ok: true, sessionId, model: SPOT_REPORT_DEFAULT_MODEL };
  }
  if (typeof body.model !== 'string' || !SPOT_REPORT_MODELS.includes(body.model as SpotReportModel)) {
    return { ok: false, error: 'model must be one of the allowlisted report models' };
  }
  return { ok: true, sessionId, model: body.model as SpotReportModel };
}
