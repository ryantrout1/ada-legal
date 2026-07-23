/**
 * POST /api/public/waitlist — early-access signups.
 *
 * Replaces Base44's WaitlistSignup entity write. Anonymous.
 *
 * Re-submitting the same address is a SUCCESS, not a conflict: someone
 * clicking the banner twice is one person, and showing them an error
 * would read as "we lost your signup". The unique index on lower(email)
 * makes that idempotent at the database rather than in a race-prone
 * read-then-write.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeEntityStore } from '../../src/lib/entities/entityStore.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as { email?: unknown; source?: unknown; interest?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  try {
    await makeEntityStore().recordWaitlistSignup({
      email: email.slice(0, 320),
      source: typeof body.source === 'string' ? body.source.slice(0, 80) : null,
      interest: typeof body.interest === 'string' ? body.interest.slice(0, 200) : null,
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[public/waitlist POST] insert failed:', err);
    return res.status(500).json({ error: 'Could not save signup' });
  }
}
