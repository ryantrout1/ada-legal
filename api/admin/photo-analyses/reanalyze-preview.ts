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

export const config = { maxDuration: 60 };

interface PreviewFinding {
  title: string;
  severity: PhotoFinding['severity'];
  standard: string;
  confirmable: boolean;
}

function toPreviewFindings(findings: PhotoFinding[]): PreviewFinding[] {
  return findings.map((f) => ({
    title: f.title_standard,
    severity: f.severity,
    standard: f.standard,
    confirmable: f.confirmable,
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

  const body = readJsonBody<{ id?: unknown }>(req);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return res.status(400).json({ error: 'Missing analysis id' });

  try {
    const clients = makeClientsFromEnv();

    const stored = await clients.db.getPhotoAnalysisForReview(id);
    if (!stored) return res.status(404).json({ error: 'Analysis not found' });

    // Re-run the CURRENT analyzer on the same stored photo. No save: this
    // is a preview only, so the review queue is never disturbed.
    const result = await clients.photo.analyze({ blobKeys: [stored.photoUrl] });
    const after = result.output;

    return res.status(200).json({
      id: stored.photoAnalysisId,
      analyzedAt: stored.analyzedAt,
      before: {
        overallRisk: (stored.overallRisk ?? null) as PhotoOverallRisk | null,
        findings: toPreviewFindings(stored.findings),
      },
      after: {
        overallRisk: after.overall_risk as PhotoOverallRisk,
        findings: toPreviewFindings(after.findings),
      },
    });
  } catch (err) {
    console.error('POST /api/admin/photo-analyses/reanalyze-preview failed', err);
    return res.status(500).json({ error: 'Failed to re-analyze photo' });
  }
}
