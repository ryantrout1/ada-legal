/**
 * /api/admin/photo-analyses
 *
 *   GET — paginated list of field-test (is_test) photo analyses for the
 *         expert-labeling queue, newest-unreviewed first.
 *
 * Admin-only. Scoped to is_test photos so real claimants' analyses never
 * appear in the labeling tool. Filters: review_state, risk, model_version.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { PhotoOverallRisk } from '../../../src/types/db.js';
import type { PhotoReviewState } from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const result = await clients.db.listPhotoAnalysesForReview({
      reviewState: parseReviewState(req.query.review_state),
      risk: parseRisk(req.query.risk),
      modelVersion:
        typeof req.query.model_version === 'string' ? req.query.model_version : undefined,
      page: parseIntOr(req.query.page, 1),
      pageSize: Math.min(parseIntOr(req.query.page_size, 25), 100),
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('GET /api/admin/photo-analyses failed', err);
    return res.status(500).json({ error: 'Failed to list photo analyses' });
  }
}

function parseIntOr(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseReviewState(v: unknown): PhotoReviewState | undefined {
  return v === 'unreviewed' || v === 'reviewed' || v === 'addressed' ? v : undefined;
}

function parseRisk(v: unknown): PhotoOverallRisk | undefined {
  return v === 'high' || v === 'medium' || v === 'low' || v === 'none' ? v : undefined;
}
