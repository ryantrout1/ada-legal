/**
 * /api/admin/photo-analyses/reanalyze-preview
 *
 *   POST { id } — re-run the CURRENT analyzer on an already-stored photo
 *   and return the stored result (before) alongside the fresh result
 *   (after), for an admin before/after comparison.
 *
 * Read + analyze ONLY. This never writes a photo_analyses row and never
 * touches photo_reviews — so we can confirm analyzer changes on photos
 * that were already reviewed without creating duplicate records that
 * would muddy the review queue for the reviewers. It reuses the server's
 * ANTHROPIC_API_KEY (the same key the live analyzer uses), so there is no
 * key handling on the client.
 *
 * One blocking Opus vision call per request, same as the capture path —
 * the admin UI loops over the reviewed photos one request at a time.
 *
 * Admin-only.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv, readJsonBody } from '../../_shared.js';
import type { PhotoFinding, PhotoOverallRisk } from '../../../src/types/db.js';
import { parseReanalyzePreviewBody } from '../../../src/lib/reanalyzePreviewBody.js';

export const config = { maxDuration: 60 };

interface PreviewFinding {
  title: string;
  severity: PhotoFinding['severity'];
  standard: string;
  confirmable: boolean;
  /**
   * The analyzer's bounding box. Carried so repeated runs can be measured for
   * grounding (see boxVariance) — without it the box could not be compared
   * across runs at all. Null when the finding had none.
   */
  box: PhotoFinding['bounding_box'] | null;
}

function toPreviewFindings(findings: PhotoFinding[]): PreviewFinding[] {
  return findings.map((f) => ({
    title: f.title_standard,
    severity: f.severity,
    standard: f.standard,
    confirmable: f.confirmable,
    box: f.bounding_box ?? null,
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseReanalyzePreviewBody(readJsonBody<{ id?: unknown; runs?: unknown }>(req) ?? {});
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });
  const { id, runs } = parsed;

  try {
    const clients = makeClientsFromEnv();

    const stored = await clients.db.getPhotoAnalysisForReview(id);
    if (!stored) return res.status(404).json({ error: 'Analysis not found' });

    // Re-run the CURRENT analyzer on the same stored photo. No save: this
    // is a preview only, so the review queue is never disturbed.
    //
    // runs > 1 samples the SAME photo repeatedly. The analyzer is
    // non-deterministic — ten runs of one bathroom photo moved the curb box
    // by 0.13 with no code change — so a single run cannot tell a real change
    // from a dice roll. Runs go in PARALLEL: sequential 15-45s vision calls
    // would blow the 60s function ceiling. A failed run is dropped rather than
    // failing the request, so four good samples still produce a number.
    const settled = await Promise.allSettled(
      Array.from({ length: runs }, () => clients.photo.analyze({ blobKeys: [stored.photoUrl] })),
    );
    const outputs = settled
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof clients.photo.analyze>>> =>
        r.status === 'fulfilled',
      )
      .map((r) => r.value.output);

    if (outputs.length === 0) {
      const reason = settled.find((r) => r.status === 'rejected');
      console.error('reanalyze-preview: every run failed', reason);
      return res.status(500).json({ error: 'Failed to re-analyze photo' });
    }

    const after = outputs[0];

    return res.status(200).json({
      id: stored.photoAnalysisId,
      analyzedAt: stored.analyzedAt,
      before: {
        overallRisk: (stored.overallRisk ?? null) as PhotoOverallRisk | null,
        findings: toPreviewFindings(stored.findings),
      },
      // Unchanged shape: the first run. The existing single-run admin caller
      // reads this and is unaffected by sampling.
      after: {
        overallRisk: after.overall_risk as PhotoOverallRisk,
        findings: toPreviewFindings(after.findings),
      },
      // Only when sampling was asked for. Additive and optional.
      samples:
        runs > 1
          ? {
              requested: runs,
              completed: outputs.length,
              runs: outputs.map((o) => ({ findings: toPreviewFindings(o.findings) })),
            }
          : undefined,
    });
  } catch (err) {
    console.error('POST /api/admin/photo-analyses/reanalyze-preview failed', err);
    return res.status(500).json({ error: 'Failed to re-analyze photo' });
  }
}
