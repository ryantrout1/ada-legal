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
import { composeAndPlaceReport } from '../../src/lib/spot/composeAndPlaceReport.js';
import type { SpotReportContent } from '../../src/lib/spot/reportSchema.js';
import {
  makeAnthropicPlaceFn,
  PLACEMENT_MODEL_DEFAULT,
} from '../../src/lib/spot/placeFindingAnthropic.js';
import {
  boxCenterOf,
  shortConcern,
  type DebugFindingPlacement,
} from '../../src/lib/spot/debugPlacement.js';
import { cropGuidedPlace } from '../../src/lib/spot/cropPlacement.js';

// The structured analyzer makes a blocking ~10-18s vision call. Normal pins are
// built from that output with no extra call, so 60s would cover them — but the
// debug branch (/photo?debug=1 only) runs a re-placement call per confirmable
// finding in parallel on top, so the ceiling is 120s. A higher ceiling adds no
// latency to normal calls; it only raises the kill limit. The /turn chat route
// streams, so it never hit this.
export const config = { maxDuration: 120 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseAnalyzePhotoBody(readJsonBody<AnalyzePhotoBody>(req));
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
  const { sessionId, photoUrl, contextHint, debug } = parsed;

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

    // The field test now renders the SAME composed report Spot ships. The raw
    // row above stays (it feeds Peter's review queue); this reuses the exact
    // shared compose+place core the buyer report uses, from the analysis we
    // already have — so the analyzer runs once, and anything the testers
    // validate here (composer, placement) is a real change to Spot. Skipped in
    // debug mode, which is the raw method-comparison lab below. Placement
    // errors never fail the request (composeAndPlaceReport swallows them).
    let content: SpotReportContent | undefined;
    if (!debug) {
      const report = await composeAndPlaceReport(clients, {
        analyses: [out],
        photos: [{ blobUrl: photoUrl }],
        annotate: true,
      });
      content = report.content;
    }

    // Debug comparison (/photo?debug=1 only). For each confirmable finding,
    // return the analyzer box + its center (what ships), a full-frame
    // re-placement point, and a crop-guided placement point, so all three can
    // be eyeballed side by side on a real photo. Up to two model calls per
    // confirmable finding, run in parallel; a missing key or a per-finding
    // failure degrades that point to null rather than failing the request.
    // Never runs in normal use.
    let debugPlacements: DebugFindingPlacement[] | undefined;
    if (debug) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const placeFn = apiKey ? makeAnthropicPlaceFn(apiKey, PLACEMENT_MODEL_DEFAULT) : null;
      const confirmable = out.findings.filter((f) => f.confirmable !== false);
      debugPlacements = await Promise.all(
        confirmable.map(async (f): Promise<DebugFindingPlacement> => {
          const box = f.bounding_box ?? null;
          let placement: DebugFindingPlacement['placement'] = null;
          let cropPlacement: DebugFindingPlacement['cropPlacement'] = null;
          if (placeFn) {
            const target = {
              title: shortConcern(f.title_standard),
              detail: f.finding_standard,
            };
            // Full-frame re-placement and crop-guided placement run in
            // parallel so the overlay can show both against the box center.
            const [full, cropped] = await Promise.all([
              (async () => {
                try {
                  return await placeFn(photoUrl, target);
                } catch (placeErr) {
                  console.error('analyze-photo debug placement failed (non-fatal)', placeErr);
                  return null;
                }
              })(),
              box && apiKey
                ? cropGuidedPlace(apiKey, photoUrl, box, target)
                : Promise.resolve(null),
            ]);
            if (full) {
              placement = { x: full.x, y: full.y, confidence: full.confidence, label: full.label ?? null };
            }
            cropPlacement = cropped;
          }
          return {
            title: f.title_standard,
            severity: f.severity,
            analyzerConfidence: f.confidence,
            box,
            boxCenter: boxCenterOf(box),
            placement,
            cropPlacement,
          };
        }),
      );
    }

    return res.status(200).json({
      ok: true,
      photo_analysis_id: photoAnalysisId,
      assistant_message: assistantMessage,
      analysis: out,
      content,
      debug: debugPlacements,
    });
  } catch (err) {
    console.error('POST /api/ada/analyze-photo failed', err);
    return res.status(500).json({ error: 'Failed to analyze photo' });
  }
}
