/**
 * GET/POST /api/cron/prune-civil-rights
 *
 * Scheduled by Vercel Cron (see vercel.json), daily. Deletes state civil
 * rights complaint submissions older than RETENTION_MONTHS (24, pending
 * Gina's sign-off) together with their consent rows (ON DELETE CASCADE).
 * The cutoff is computed by Postgres.
 *
 * Auth: same fail-closed gate as the other crons. Without CRON_SECRET,
 * every request gets 401 and nothing is deleted.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeCivilRightsAdminStore } from '../../src/lib/civilRights/store.js';
import { RETENTION_MONTHS } from '../../src/lib/civilRights/adminCore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const deleted = await makeCivilRightsAdminStore().pruneExpired();
    return res.status(200).json({ deleted, retentionMonths: RETENTION_MONTHS });
  } catch (err) {
    console.error('GET /api/cron/prune-civil-rights failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
