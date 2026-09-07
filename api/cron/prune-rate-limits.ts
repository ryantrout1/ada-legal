/**
 * GET/POST /api/cron/prune-rate-limits
 *
 * Scheduled by Vercel Cron (see vercel.json). Deletes api_rate_limit rows
 * older than RETENTION_MS.
 *
 * Why this exists: `store.prune()` shipped with the guide assistant
 * limiter and nothing ever called it. Every allowed request writes a row
 * and none were ever removed. That was tolerable while the guide assistant
 * was the only writer; Phase 3 put the photo endpoints on the same table
 * and Phase 2 adds chat, so the table now grows with real traffic.
 *
 * Auth: same fail-closed gate as sweep-abandoned. Vercel Cron attaches
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set on the
 * project; we require it. Until it is set, every request — scheduled or
 * not — gets 401 and nothing is deleted. A public endpoint that empties a
 * rate-limit table is not something to leave open by default.
 *
 * RETENTION is deliberately double the longest window (24h → 48h). The
 * limiter counts rows inside a window; if the cutoff ever crept under that
 * window, a prune would silently hand every caller a fresh daily budget.
 * The limiter would keep answering, just against an emptier table — a
 * limiter that stops limiting without saying so. The margin is the guard,
 * and tests/integration/pruneRateLimitsCron.test.ts asserts it against
 * RATE_LIMITS rather than against a hardcoded number, so adding a longer
 * window later fails the test instead of quietly breaking the invariant.
 *
 * Ref: /plan Ada rate limits, Phase 4 (AC6).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeApiRateLimitStore } from '../../src/lib/rateLimit/apiRateLimitStore.js';

/**
 * Rows older than this are removed. Twice the longest window in
 * RATE_LIMITS (24h), so a prune can never truncate a live budget.
 */
const RETENTION_MS = 48 * 60 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth gate — fail closed. See file header.
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
    const cutoff = new Date(Date.now() - RETENTION_MS);
    const deleted = await makeApiRateLimitStore().prune(cutoff);
    return res.status(200).json({ deleted, cutoff: cutoff.toISOString() });
  } catch (err) {
    // Full detail to the log; generic message to the caller. A failed
    // prune is not urgent — the table grows a little longer and the next
    // run clears it — so this never escalates beyond a 500.
    console.error('GET /api/cron/prune-rate-limits failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
