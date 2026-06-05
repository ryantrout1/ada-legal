/**
 * /api/admin/photo-reviews
 *
 *   POST — create or update the signed-in admin's review of a photo
 *          analysis. reviewer is derived from the authenticated admin's
 *          email (Gina/Ryan), not the body. One row per (analysis,
 *          reviewer), so admins and public reviewers don't overwrite
 *          each other.
 *
 * Admin-only. The public counterpart is POST /api/photo-review/[id].
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { reviewerNameFromEmail } from '../../_reviewerName.js';
import {
  parseFindingLabels,
  parseMissedFindings,
  parseStatus,
  parseOverallVerdict,
} from '../../_photoReviewParse.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const photoAnalysisId = typeof body.photoAnalysisId === 'string' ? body.photoAnalysisId : '';
  if (!photoAnalysisId) {
    return res.status(400).json({ error: 'photoAnalysisId is required' });
  }

  try {
    const clients = makeClientsFromEnv();
    await clients.db.upsertPhotoReview({
      photoAnalysisId,
      reviewer: reviewerNameFromEmail(auth.email),
      reviewerEmail: auth.email ?? null,
      status: parseStatus(body.status),
      overallVerdict: parseOverallVerdict(body.overallVerdict),
      findingLabels: parseFindingLabels(body.findingLabels),
      missedFindings: parseMissedFindings(body.missedFindings),
      reviewerNotes: typeof body.reviewerNotes === 'string' ? body.reviewerNotes : null,
      modelVersion: typeof body.modelVersion === 'string' ? body.modelVersion : null,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('POST /api/admin/photo-reviews failed', err);
    return res.status(500).json({ error: 'Failed to save review' });
  }
}
