/**
 * Ada Spot — admin re-generate request parser (pure).
 *
 * The admin preview re-runs report generation with a chosen model to run the
 * Opus-4.8-vs-Fable-5 A/B. The model is allowlisted so the admin endpoint can
 * never be coaxed into an arbitrary model string. Ref: /plan Ada Spot Phase 3b.
 */

export const SPOT_REPORT_MODELS = ['claude-opus-4-8', 'claude-fable-5'] as const;
export type SpotReportModel = (typeof SPOT_REPORT_MODELS)[number];
export const SPOT_REPORT_DEFAULT_MODEL: SpotReportModel = 'claude-opus-4-8';

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
