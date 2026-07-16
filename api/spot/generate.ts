/**
 * POST /api/spot/generate
 *
 *   POST { spotSessionId } -> { status: 'generating' | 'done' | ... }
 *
 * The fast path for Ada Spot report generation. The client fires this right
 * after /api/spot/finish-upload succeeds, so generation starts immediately
 * instead of waiting up to 10 minutes for the cron sweeper. The cron remains
 * the retry/backstop for sessions whose trigger never arrived or whose run
 * failed.
 *
 * Auth model: no secret — deliberately. The call is UUID-gated (the caller
 * must hold the session id, same bar as finish-upload), acts only on
 * sessions in `uploaded` status, and the shared runner is idempotent: an
 * existing report short-circuits to recovery, and the unique index on
 * spot_report(session_id) (migration 0039) closes the concurrent
 * double-insert race. Worst case for a replayed request is a no-op.
 *
 * The runner makes blocking Opus vision calls (parallel batches + one
 * synthesis) — same time budget as the cron.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { generateReportForSession } from '../../src/lib/spot/generateReportForSession.js';

export const config = { maxDuration: 300 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const spotSessionId =
    typeof req.body?.spotSessionId === 'string' ? req.body.spotSessionId : '';
  if (!spotSessionId) return res.status(400).json({ error: 'spotSessionId is required' });

  try {
    const store = makeSpotStore();
    const session = await store.getSession(spotSessionId);
    if (!session) return res.status(404).json({ error: 'Not found' });

    // Only an `uploaded` session has anything to generate. `in_review` /
    // released sessions already ran; `paid` hasn't finished uploading.
    // 200 (not 4xx) for the already-ran shapes so a replayed trigger is a
    // clean no-op for the client.
    if (session.status !== 'uploaded') {
      return res.status(200).json({ status: session.status, noop: true });
    }

    const clients = makeClientsFromEnv();
    const result = await generateReportForSession(store, clients, spotSessionId);
    return res.status(200).json({ status: 'in_review', result: result.kind });
  } catch (err) {
    // Runner threw → session stays `uploaded`; the cron sweeper retries.
    console.error('POST /api/spot/generate failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
