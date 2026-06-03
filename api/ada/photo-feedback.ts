/**
 * /api/ada/photo-feedback
 *
 *   POST { session_id, comment } — attach the tester's post-analysis
 *   note to the latest field-test photo analysis for that session.
 *
 * Public (the /photo page is unauthenticated). Safety comes from the DB
 * layer: savePhotoTesterComment only writes onto analyses whose session
 * is is_test=true, so this can never touch a real claimant's analysis.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';

const MAX_COMMENT_CHARS = 4000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : '';
  const commentRaw = typeof body.comment === 'string' ? body.comment : '';
  const comment = commentRaw.trim().slice(0, MAX_COMMENT_CHARS);

  if (!sessionId) return res.status(400).json({ error: 'session_id is required' });
  if (!comment) return res.status(400).json({ error: 'comment is required' });

  try {
    const clients = makeClientsFromEnv();
    const updated = await clients.db.savePhotoTesterComment(sessionId, comment);
    return res.status(200).json({ ok: true, updated });
  } catch (err) {
    console.error('POST /api/ada/photo-feedback failed', err);
    return res.status(500).json({ error: 'Failed to save comment' });
  }
}
