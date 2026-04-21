/**
 * GET /api/admin/analytics
 *
 * Returns all five admin dashboard views in a single response:
 *   - Session volume (last N days, zero-filled, oldest-first)
 *   - Status counts (active / completed / abandoned / total)
 *   - Completion rate (completed / finished, null if nothing finished yet)
 *   - Reading-level distribution
 *   - Classification breakdown (by title)
 *   - Tool-use frequency
 *
 * Query params:
 *   days          — 1..90, default 14. Session-volume window.
 *   include_test  — "true" to include is_test rows. Default false.
 *
 * All computed server-side via SQL on Neon. Cache for 60s — analytics
 * are not real-time-critical and the LATERAL unnest for tool-use is
 * non-trivial on larger tables.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { makeClientsFromEnv } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const daysRaw = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : NaN;
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 14;

    const includeTest =
      typeof req.query.include_test === 'string' &&
      req.query.include_test.toLowerCase() === 'true';

    const clients = makeClientsFromEnv();
    const result = await clients.db.getAdminAnalytics({ days, includeTest });

    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({
      session_volume: result.sessionVolume,
      status_counts: result.statusCounts,
      completion_rate: result.completionRate,
      reading_level_distribution: result.readingLevelDistribution,
      classification_breakdown: result.classificationBreakdown,
      tool_use_frequency: result.toolUseFrequency,
    });
  } catch (err) {
    console.error('GET /api/admin/analytics failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
