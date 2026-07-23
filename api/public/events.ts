/**
 * POST /api/public/events — analytics ingest for trackEvent.
 *
 * Replaces Base44's dual-write (base44.analytics.track + an
 * AnalyticsEvent entity row). There is no second analytics system here;
 * Neon is it.
 *
 * FIRE AND FORGET. The caller never waits on this and never surfaces a
 * failure — a page must not degrade because telemetry is down. The
 * handler therefore returns 202 unconditionally once the payload parses,
 * and swallows write errors after logging them.
 *
 * `is_internal` is NOT settable by the client. It is derived server-side
 * and defaults false; the only rows marked internal are the historical
 * ones tagged during the M0 import, where the author was known. A
 * client-settable flag would be trivially spoofable and would corrupt
 * the exact number it exists to protect.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeEntityStore } from '../../src/lib/entities/entityStore.js';

const MAX_PROPERTIES_BYTES = 4000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as {
    event_name?: unknown;
    page?: unknown;
    properties?: unknown;
    session_id?: unknown;
  };

  const eventName = typeof body.event_name === 'string' ? body.event_name.trim() : '';
  if (!eventName) {
    return res.status(400).json({ error: 'event_name is required' });
  }

  let properties: Record<string, unknown> = {};
  if (body.properties && typeof body.properties === 'object' && !Array.isArray(body.properties)) {
    const serialized = JSON.stringify(body.properties);
    if (serialized.length <= MAX_PROPERTIES_BYTES) {
      properties = body.properties as Record<string, unknown>;
    }
  }

  try {
    await makeEntityStore().recordEvent({
      eventName: eventName.slice(0, 120),
      page: typeof body.page === 'string' ? body.page.slice(0, 200) : null,
      properties,
      sessionId:
        typeof body.session_id === 'string' ? body.session_id.slice(0, 100) : null,
    });
  } catch (err) {
    console.error('[public/events POST] insert failed:', err);
  }

  // 202 regardless: the client is not waiting and must not retry.
  return res.status(202).json({ ok: true });
}
