/**
 * /api/portal/cases/[id]/communications
 *
 *   GET  → the matter's contact history, newest occurrence first.
 *   POST → log a contact { channel, direction, occurred_at?, subject?, body? }.
 *
 * Firm-scoped via the same case check every other case route uses; a case that
 * is not this firm's reads as an empty history rather than a 403, so the
 * endpoint never confirms that an out-of-scope case exists.
 *
 * `occurred_at` is optional and defaults to now. It exists because a Tuesday
 * call is often logged on Thursday, and the history has to read in the order
 * things happened.
 *
 * Channel and direction are validated against the same sets as the CHECK
 * constraints — rejecting here gives a usable error instead of a 500 from
 * Postgres.
 *
 * Ref: Phase 5 §7.3 (Communications tab).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';

const CHANNELS = new Set(['call', 'email', 'letter', 'meeting', 'text', 'other']);
const DIRECTIONS = new Set(['outbound', 'inbound']);
const MAX_BODY = 10_000;

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const clients = makeClientsFromEnv();

    if (req.method === 'GET') {
      const communications = await clients.db.listCaseCommunications(id, auth.lawFirmId);
      return res.status(200).json({ communications });
    }

    if (req.method === 'POST') {
      const b = (req.body ?? {}) as Record<string, unknown>;
      const channel = str(b.channel);
      const direction = str(b.direction);

      if (!channel || !CHANNELS.has(channel)) {
        return res.status(400).json({ error: `channel must be one of: ${[...CHANNELS].join(', ')}` });
      }
      if (!direction || !DIRECTIONS.has(direction)) {
        return res.status(400).json({ error: 'direction must be outbound or inbound' });
      }

      const occurredRaw = str(b.occurred_at);
      if (occurredRaw && Number.isNaN(Date.parse(occurredRaw))) {
        return res.status(400).json({ error: 'occurred_at must be a valid date' });
      }

      const body = str(b.body);
      if (body && body.length > MAX_BODY) {
        return res.status(400).json({ error: 'body is too long' });
      }

      const communication = await clients.db.addCaseCommunication({
        caseId: id,
        lawFirmId: auth.lawFirmId,
        channel,
        direction,
        occurredAt: occurredRaw,
        subject: str(b.subject),
        body,
        loggedBy: auth.userId ?? null,
      });
      if (!communication) return res.status(404).json({ error: 'Case not found' });
      return res.status(200).json({ communication });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('/api/portal/cases/[id]/communications failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
