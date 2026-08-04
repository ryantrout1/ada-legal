/**
 * Body parsing for POST /api/admin/photo-analyses/reanalyze-preview.
 *
 * `runs` multiplies blocking Opus vision calls, so it is clamped hard rather
 * than trusted: anything that is not a positive integer falls back to a single
 * run, and the cap is absolute. An unbounded value here would be an unbounded
 * bill. Ref: /plan repeat-run phase 1.
 */

/** Absolute ceiling on analyzer runs per request. */
export const MAX_PREVIEW_RUNS = 5;

export type ParsedReanalyzePreviewBody =
  | { ok: true; id: string; runs: number }
  | { ok: false; status: number; error: string };

export function parseReanalyzePreviewBody(body: {
  id?: unknown;
  runs?: unknown;
}): ParsedReanalyzePreviewBody {
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id) return { ok: false, status: 400, error: 'Missing analysis id' };

  // Only a real integer counts. '5', 2.7 and NaN all fall back to one run
  // rather than being coerced into a spend.
  const raw = body?.runs;
  const runs =
    typeof raw === 'number' && Number.isInteger(raw)
      ? Math.min(MAX_PREVIEW_RUNS, Math.max(1, raw))
      : 1;

  return { ok: true, id, runs };
}
