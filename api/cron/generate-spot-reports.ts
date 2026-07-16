/**
 * GET/POST /api/cron/generate-spot-reports
 *
 * The report sweeper. Picks up ONE `uploaded` Ada Spot session per tick and
 * runs the shared per-session runner (src/lib/spot/generateReportForSession),
 * parking the result in spot_report (pending_review) and flipping the session
 * uploaded → in_review.
 *
 * Since the inline trigger (POST /api/spot/generate, fired at finish-upload)
 * became the fast path, this cron is the retry/backstop: it catches sessions
 * whose trigger never fired (client closed early) or whose generation failed
 * (runner throws → session stays `uploaded` → next tick retries). One
 * session/tick keeps each invocation inside the function time budget; a
 * backlog drains over successive ticks, oldest first.
 *
 * Auth: fails closed on CRON_SECRET, like sweep-abandoned. Firewall: reuses
 * the analyzer + AI client additively; writes only spot_* rows; the bench and
 * Ada chat are untouched.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { generateReportForSession } from '../../src/lib/spot/generateReportForSession.js';

export const config = { maxDuration: 300 };

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
    const store = makeSpotStore();
    const session = await store.nextUploadedSession();
    if (!session) return res.status(200).json({ generated: null, reason: 'no uploaded sessions' });

    const clients = makeClientsFromEnv();
    const result = await generateReportForSession(store, clients, session.id);
    if (result.kind === 'recovered') {
      return res.status(200).json({ generated: session.id, recovered: true });
    }
    if (result.kind === 'empty') {
      return res.status(200).json({ generated: session.id, empty: true });
    }
    return res.status(200).json({ generated: session.id, model: result.modelVersion });
  } catch (err) {
    // Leave the session `uploaded` for the next tick to retry.
    console.error('GET /api/cron/generate-spot-reports failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
