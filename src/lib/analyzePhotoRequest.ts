/**
 * Pure request helpers for POST /api/ada/analyze-photo.
 *
 * Extracted from the Vercel handler so the safety-critical bits — input
 * validation, the Vercel-Blob URL allowlist, and the is_test gate — are
 * unit-testable without a req/res harness (the repo tests pure helpers,
 * not handlers; cf. src/lib/fieldCaptureFlag.ts).
 *
 * Ref: /triage field-test photos never reach the review queue.
 */

import type { AdaSessionState } from '../engine/types.js';

/**
 * Allowlist: only accept Vercel Blob URLs. Mirrors the checks in
 * /api/ada/turn and anthropicPhotoAnalysisClient so a bad URL fails fast
 * at the edge rather than reaching the analyzer.
 */
export const BLOB_URL_RE =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;
export const MAX_CONTEXT_HINT_CHARS = 1000;
export const MAX_PHOTO_URL_CHARS = 1024;

export interface AnalyzePhotoBody {
  session_id?: unknown;
  photo_url?: unknown;
  context_hint?: unknown;
}

export type ParsedAnalyzePhotoBody =
  | { ok: true; sessionId: string; photoUrl: string; contextHint?: string }
  | { ok: false; status: number; error: string };

export function parseAnalyzePhotoBody(
  body: AnalyzePhotoBody,
): ParsedAnalyzePhotoBody {
  const sessionId =
    typeof body.session_id === 'string' ? body.session_id.trim() : '';
  const photoUrl =
    typeof body.photo_url === 'string' ? body.photo_url.trim() : '';
  const contextHint =
    typeof body.context_hint === 'string'
      ? body.context_hint.trim().slice(0, MAX_CONTEXT_HINT_CHARS) || undefined
      : undefined;

  if (!sessionId) return { ok: false, status: 400, error: 'session_id is required' };
  if (!photoUrl) return { ok: false, status: 400, error: 'photo_url is required' };
  if (!BLOB_URL_RE.test(photoUrl)) {
    return { ok: false, status: 400, error: 'photo_url must be a Vercel Blob URL' };
  }
  if (photoUrl.length > MAX_PHOTO_URL_CHARS) {
    return { ok: false, status: 400, error: 'photo_url is too long' };
  }
  return { ok: true, sessionId, photoUrl, contextHint };
}

export type AnalyzePhotoGate =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Field-test sessions only. The /photo page is unauthenticated, so this
 * gate is the safety boundary: a missing session is a 404, and a real
 * (non-test) session is a 403 — the analyzer never runs and nothing is
 * persisted for a real claimant's photo. Mirrors the is_test gate in
 * /api/ada/photo-feedback.
 */
export function gateAnalyzePhotoSession(
  state: Pick<AdaSessionState, 'isTest'> | null,
): AnalyzePhotoGate {
  if (!state) return { ok: false, status: 404, error: 'Session not found' };
  if (!state.isTest) {
    return {
      ok: false,
      status: 403,
      error: 'analyze-photo is restricted to field-test sessions',
    };
  }
  return { ok: true };
}
