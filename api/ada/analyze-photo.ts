/**
 * /api/ada/analyze-photo
 *
 *   POST { session_id, photo_url, context_hint? }
 *     Runs the structured photo analyzer on an uploaded photo and
 *     persists a durable photo_analyses row, so the analysis shows up in
 *     the admin expert-review queue (/admin/photo-review).
 *
 * This is the field-test path. Ada's live chat (/api/ada/turn) reads
 * photos via native vision and does NOT run this analyzer — the
 * structured analyzer is exercised only here, on purpose, so the
 * field-test tool tests the analyzer the review queue is built around.
 *
 * Public (the /photo page is unauthenticated). Safety comes from the
 * is_test gate: this endpoint refuses any session that is not a
 * field-test session, so it can never analyze or persist a real
 * claimant's photo. Mirrors the gate in /api/ada/photo-feedback.
 *
 * Unlike the (now-detached) analyze_photo tool, failures here are NOT
 * swallowed: a failed analyze or save returns a non-200 so the field
 * test surfaces problems instead of silently reporting success.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv, readJsonBody } from '../_shared.js';
import { readAdaAvailability } from '../../src/lib/adaAvailability.js';
import {
  parseAnalyzePhotoBody,
  gateAnalyzePhotoSession,
  type AnalyzePhotoBody,
} from '../../src/lib/analyzePhotoRequest.js';
import { buildPhotoAnnotations } from '../../src/lib/spot/buildPhotoAnnotations.js';
import {
  makeAnthropicPlaceFn,
  PLACEMENT_MODEL_DEFAULT,
} from '../../src/lib/spot/placeFindingAnthropic.js';
import type { PhotoAnnotation } from '../../src/lib/spot/annotationTypes.js';

// Same floor as the admin annotation preview: below this placement confidence,
// a finding draws no pin and stays in prose only.
const PLACEMENT_MIN_CONFIDENCE = 0.5;

// The structured analyzer makes a blocking ~10-18s vision call. With the
// opt-in placement pass (/photo only), each confirmable finding adds a short
// vision call on top. 120s covers analysis plus a handful of placements; the
// admin preview that runs the same pass uses 300s, but the harness places one
// photo's findings, not a whole session's. The /turn chat route streams, so it
// never hit this.
export const config = { maxDuration: 120 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseAnalyzePhotoBody(readJsonBody<AnalyzePhotoBody>(req));
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
  const { sessionId, photoUrl, contextHint, place } = parsed;

  try {
    const clients = makeClientsFromEnv();

    // Kill switch (a7). The structured analyzer is a public, budgeted
    // Opus vision call — dark by default for launch. When an admin has
    // not explicitly enabled ada_photo_enabled, refuse before reading
    // the session or touching the model. 503 so callers know it's
    // deliberate + temporary, not a client error.
    const availability = await readAdaAvailability(clients.db);
    if (!availability.photoEnabled) {
      res.setHeader('Retry-After', '3600');
      return res.status(503).json({ error: 'Photo analysis is currently unavailable.' });
    }

    // Gate: field-test sessions only.
    const state = await clients.db.readSession({ sessionId });
    const gate = gateAnalyzePhotoSession(state);
    if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
    const session = state!; // gate guarantees a non-null field-test session

    // Run the structured analyzer (same client Ada's analyze_photo tool
    // uses) and persist a durable row. Errors propagate to the catch —
    // no best-effort swallow, so the field test sees real failures.
    const result = await clients.photo.analyze({
      blobKeys: [photoUrl],
      contextHint,
    });
    const out = result.output;

    const photoAnalysisId = await clients.db.savePhotoAnalysis({
      sessionId: session.sessionId,
      orgId: session.orgId,
      photoUrl,
      photoBlobKey: photoUrl,
      findings: out.findings,
      scene: out.scene ?? null,
      summary: out.summary ?? null,
      overallRisk: out.overall_risk ?? null,
      positiveFindings: out.positive_findings ?? null,
      modelVersion: result.modelVersion,
    });

    const assistantMessage =
      out.summary?.standard ?? out.scene?.standard ?? 'Analysis complete.';

    // Opt-in placement pass (/photo harness only). Same per-finding placement
    // the admin preview and the Spot report use, run over this one photo's
    // findings so the harness can draw the same pin overlay Spot reports show.
    // A missing key, or any placement failure, degrades to no annotations —
    // the analysis and its prose already succeeded, and a preview overlay is
    // never worth failing the whole request over. Both gates (confirmable,
    // confidence) live inside buildPhotoAnnotations.
    let annotations: PhotoAnnotation[] | undefined;
    if (place) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        try {
          const placeFn = makeAnthropicPlaceFn(apiKey, PLACEMENT_MODEL_DEFAULT);
          annotations = await buildPhotoAnnotations(
            [{ photoUrl, findings: out.findings }],
            placeFn,
            { minConfidence: PLACEMENT_MIN_CONFIDENCE },
          );
        } catch (placeErr) {
          console.error('analyze-photo placement pass failed (non-fatal)', placeErr);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      photo_analysis_id: photoAnalysisId,
      assistant_message: assistantMessage,
      analysis: out,
      annotations,
    });
  } catch (err) {
    console.error('POST /api/ada/analyze-photo failed', err);
    return res.status(500).json({ error: 'Failed to analyze photo' });
  }
}
