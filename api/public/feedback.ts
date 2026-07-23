/**
 * POST /api/public/feedback — site feedback from the FeedbackModal.
 *
 * Replaces Base44's Feedback entity write. Anonymous and unauthenticated:
 * the whole point is that someone who hit a wall can say so without
 * making an account first.
 *
 * NOT INTAKE. This captures "the site did something wrong", not "a
 * barrier shut me out" — Ada remains the only front door for the
 * latter. The message field is deliberately not prompted with anything
 * resembling a situation description.
 *
 * Throttled through the shared api_rate_limit bucket (migration 0041),
 * because it is a public unauthenticated write.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeEntityStore } from '../../src/lib/entities/entityStore.js';

const MAX_MESSAGE = 5000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as {
    message?: unknown;
    rating?: unknown;
    email?: unknown;
    page?: unknown;
  };

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    await makeEntityStore().recordFeedback({
      message: message.slice(0, MAX_MESSAGE),
      rating: typeof body.rating === 'string' ? body.rating.slice(0, 40) : null,
      email:
        typeof body.email === 'string' && body.email.trim()
          ? body.email.trim().slice(0, 320)
          : null,
      page: typeof body.page === 'string' ? body.page.slice(0, 200) : null,
      userAgent:
        typeof req.headers['user-agent'] === 'string'
          ? req.headers['user-agent'].slice(0, 300)
          : null,
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[public/feedback POST] insert failed:', err);
    // Deliberately vague to the caller: the widget shows a thank-you
    // either way rather than making someone re-type their complaint.
    return res.status(500).json({ error: 'Could not save feedback' });
  }
}
