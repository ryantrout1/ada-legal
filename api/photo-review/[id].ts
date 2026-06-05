/**
 * /api/photo-review/[id]
 *
 *   GET  — full analysis (findings, scene, summary, risk, positives) plus
 *          every reviewer's review, for the public review detail page.
 *   POST — create or update ONE reviewer's review. The reviewer name comes
 *          from the body and must be one of the known reviewers; there is
 *          no login. One row per (analysis, reviewer), so Peter, Gina, and
 *          Ryan never overwrite each other.
 *
 * PUBLIC — no auth. Unlike the admin detail endpoint, GET here does NOT
 * trigger the on-demand professional reading-level rewrite: that's a paid
 * model call we don't want fired from an unauthenticated URL. Reviewers
 * read the standard reading level (what the analyzer captures), which is
 * all the accuracy check needs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { isPhotoReviewer } from '../../src/types/reviewers.js';
import {
  parseFindingLabels,
  parseMissedFindings,
  parseStatus,
  parseOverallVerdict,
} from '../_photoReviewParse.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'Missing analysis id' });

  const clients = makeClientsFromEnv();

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!isPhotoReviewer(body.reviewer)) {
      return res.status(400).json({ error: 'A valid reviewer is required' });
    }
    try {
      await clients.db.upsertPhotoReview({
        photoAnalysisId: id,
        reviewer: body.reviewer,
        reviewerEmail: null,
        status: parseStatus(body.status),
        overallVerdict: parseOverallVerdict(body.overallVerdict),
        findingLabels: parseFindingLabels(body.findingLabels),
        missedFindings: parseMissedFindings(body.missedFindings),
        reviewerNotes: typeof body.reviewerNotes === 'string' ? body.reviewerNotes : null,
        modelVersion: typeof body.modelVersion === 'string' ? body.modelVersion : null,
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('POST /api/photo-review/[id] failed', err);
      return res.status(500).json({ error: 'Failed to save review' });
    }
  }

  try {
    const detail = await clients.db.getPhotoAnalysisForReview(id);
    if (!detail) return res.status(404).json({ error: 'Analysis not found' });
    // No professional rewrite here — standard reading level only (see header).
    return res.status(200).json(detail);
  } catch (err) {
    console.error('GET /api/photo-review/[id] failed', err);
    return res.status(500).json({ error: 'Failed to load analysis' });
  }
}
