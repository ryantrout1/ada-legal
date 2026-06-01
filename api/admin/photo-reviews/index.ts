/**
 * /api/admin/photo-reviews
 *
 *   POST — create or update the single authoritative expert review for a
 *          photo analysis. reviewer_email is taken from the authenticated
 *          admin (Gina/Ryan), not the body.
 *
 * Admin-only.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type {
  PhotoFindingLabel,
  MissedFinding,
  FindingVerdict,
  ReviewOverallVerdict,
  ReviewStatus,
} from '../../../src/types/db.js';

const VERDICTS: FindingVerdict[] = ['correct', 'over_flagged', 'partial', 'wrong_cite'];
const OVERALL: ReviewOverallVerdict[] = ['accurate', 'missed', 'over_flagged', 'wrong', 'mixed'];
const STATUSES: ReviewStatus[] = ['reviewed', 'addressed'];

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

  const findingLabels = parseFindingLabels(body.findingLabels);
  const missedFindings = parseMissedFindings(body.missedFindings);
  const status = STATUSES.includes(body.status as ReviewStatus)
    ? (body.status as ReviewStatus)
    : 'reviewed';
  const overallVerdict = OVERALL.includes(body.overallVerdict as ReviewOverallVerdict)
    ? (body.overallVerdict as ReviewOverallVerdict)
    : null;

  try {
    const clients = makeClientsFromEnv();
    await clients.db.upsertPhotoReview({
      photoAnalysisId,
      reviewerEmail: auth.email ?? 'unknown',
      status,
      overallVerdict,
      findingLabels,
      missedFindings,
      reviewerNotes: typeof body.reviewerNotes === 'string' ? body.reviewerNotes : null,
      modelVersion: typeof body.modelVersion === 'string' ? body.modelVersion : null,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('POST /api/admin/photo-reviews failed', err);
    return res.status(500).json({ error: 'Failed to save review' });
  }
}

function parseFindingLabels(raw: unknown): PhotoFindingLabel[] {
  if (!Array.isArray(raw)) return [];
  const out: PhotoFindingLabel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.finding_index !== 'number') continue;
    if (!VERDICTS.includes(r.verdict as FindingVerdict)) continue;
    out.push({
      finding_index: r.finding_index,
      verdict: r.verdict as FindingVerdict,
      reason: typeof r.reason === 'string' ? r.reason : '',
    });
  }
  return out;
}

function parseMissedFindings(raw: unknown): MissedFinding[] {
  if (!Array.isArray(raw)) return [];
  const out: MissedFinding[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.description !== 'string' || r.description.trim() === '') continue;
    out.push({
      description: r.description,
      standard: typeof r.standard === 'string' ? r.standard : undefined,
      severity:
        r.severity === 'critical' ||
        r.severity === 'major' ||
        r.severity === 'minor' ||
        r.severity === 'advisory'
          ? r.severity
          : undefined,
    });
  }
  return out;
}
