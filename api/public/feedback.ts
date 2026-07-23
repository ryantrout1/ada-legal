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

  const body = (req.body ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number): string | null =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    await makeEntityStore().recordFeedback({
      message: message.slice(0, MAX_MESSAGE),
      feedbackType: str(body.feedback_type, 40) ?? 'general_feedback',
      rating: str(body.rating, 40),
      name: str(body.name, 200),
      email: str(body.email, 320),
      displayName: str(body.display_name, 200),
      location: str(body.location, 200),
      // Only an explicit true is consent.
      testimonialConsent: body.testimonial_consent === true,
      page: str(body.page, 200),
      pageUrl: str(body.page_url, 500),
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
