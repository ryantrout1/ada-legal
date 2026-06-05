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
import {
  parseAnalyzePhotoBody,
  gateAnalyzePhotoSession,
  type AnalyzePhotoBody,
} from '../../src/lib/analyzePhotoRequest.js';

// The structured analyzer makes a blocking ~10-18s vision call. Without a
// raised limit, slower runs get killed mid-analysis and the request hangs
// (fast runs persisted a row; slow ones didn't). The /turn chat route
// streams, so it never hit this. 60s gives the vision call headroom.
export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseAnalyzePhotoBody(readJsonBody<AnalyzePhotoBody>(req));
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
  const { sessionId, photoUrl, contextHint } = parsed;

  try {
    const clients = makeClientsFromEnv();

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

    return res.status(200).json({
      ok: true,
      photo_analysis_id: photoAnalysisId,
      assistant_message: assistantMessage,
      analysis: out,
    });
  } catch (err) {
    console.error('POST /api/ada/analyze-photo failed', err);
    return res.status(500).json({ error: 'Failed to analyze photo' });
  }
}
