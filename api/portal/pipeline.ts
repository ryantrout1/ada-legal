/**
 * GET /api/portal/pipeline — pipeline analytics for the firm (Phase 4c).
 * Funnel (cases reaching each stage) + median time-in-stage. Attorney-only,
 * firm-scoped + consent-gated (matches what the board shows).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../_attorney.js';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clients = makeClientsFromEnv();
    const stats = await clients.db.getFirmPipelineStats(auth.lawFirmId);
    return res.status(200).json({
      stage_counts: stats.stageCounts,
      time_in_stage: stats.timeInStage.map((t) => ({
        stage: t.stage,
        median_hours: t.medianHours,
        n: t.n,
      })),
    });
  } catch (err) {
    console.error('/api/portal/pipeline failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
