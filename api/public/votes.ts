/**
 * /api/public/votes — CommunityVoices poll.
 *
 * GET  → current tallies, so the widget can render results.
 * POST → record one vote.
 *
 * Base44 never created the CommunityVote entity; its votes went into the
 * AnalyticsEvent stream as `community_voice_vote` with an option_id.
 * Those five real votes are backfilled here by the M5 import, which is
 * why this table is not empty on day one.
 *
 * `voter_key` is a coarse client fingerprint, not an identity — enough
 * to make double-voting inconvenient, not enough to identify anyone. No
 * raw IP is stored, consistent with the rate limiter.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import {
  makeEntityStore,
  COMMUNITY_POLL_ID as POLL_ID,
} from '../../src/lib/entities/entityStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    try {
      const tallies = await makeEntityStore().tallyVotes();
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
      return res.status(200).json({ poll_id: POLL_ID, tallies });
    } catch (err) {
      console.error('[public/votes GET] tally failed:', err);
      // Empty tallies rather than a 500 — the widget renders its options
      // with no counts, which is a worse experience than real numbers but
      // a much better one than a broken section.
      return res.status(200).json({ poll_id: POLL_ID, tallies: {} });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as { option_id?: unknown; voter_key?: unknown };
  const optionId = typeof body.option_id === 'string' ? body.option_id.trim() : '';
  if (!optionId) {
    return res.status(400).json({ error: 'option_id is required' });
  }

  try {
    await makeEntityStore().recordVote({
      optionId: optionId.slice(0, 80),
      voterKey: typeof body.voter_key === 'string' ? body.voter_key.slice(0, 64) : null,
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[public/votes POST] insert failed:', err);
    return res.status(500).json({ error: 'Could not record vote' });
  }
}
