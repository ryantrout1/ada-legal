/**
 * GET/POST /api/cron/sweep-abandoned
 *
 * Scheduled by Vercel Cron (see vercel.json). Marks `active` Ada
 * sessions that have been idle past IDLE_THRESHOLD_MS as `abandoned`,
 * so stale sessions stop accepting turns with unbounded history.
 *
 * Auth: Vercel Cron attaches `Authorization: Bearer $CRON_SECRET` to
 * scheduled invocations WHEN the CRON_SECRET env var is set on the
 * project. We require it. This fails CLOSED — until CRON_SECRET is set
 * in Vercel, every request (including the scheduled one and any public
 * probe) gets 401 and no sweep runs. Set CRON_SECRET in Vercel →
 * Production to activate.
 *
 * The sweep never bulk-writes status; it transitions each session via
 * the state machine (see sweepAbandonedSessions). Safe to run repeatedly
 * — it's idempotent and bounded per invocation.
 *
 * Ref: /plan Phase 4 (§4 h1).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { sweepAbandonedSessions } from '../../src/engine/session/sweepAbandoned.js';

// The sweep does a read + write per candidate; give it headroom over the
// platform default so a large first run (clearing the backlog) completes.
export const config = { maxDuration: 60 };

/** A session idle (no writes) longer than this is considered abandoned. */
const IDLE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
/** Max sessions abandoned per invocation. The cron re-runs, so a larger
 *  backlog drains over successive runs; oldest are always handled first. */
const SWEEP_LIMIT = 500;

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
    const clients = makeClientsFromEnv();
    const result = await sweepAbandonedSessions(clients, {
      nowIso: new Date().toISOString(),
      idleThresholdMs: IDLE_THRESHOLD_MS,
      limit: SWEEP_LIMIT,
    });
    return res.status(200).json(result);
  } catch (err) {
    // Full detail to the log; generic message to the caller.
    console.error('GET /api/cron/sweep-abandoned failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
