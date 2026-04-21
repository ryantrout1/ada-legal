/**
 * GET /api/admin/sessions/[id]
 *
 * Returns full detail for a single session. Unlike the list endpoint,
 * this includes conversation history and extracted fields — it's the
 * only endpoint that does. Used on the admin session-detail page.
 *
 * Ch0 data-handling rule: admin can view conversation content on this
 * page, but conversation content is NEVER logged (DO_NOT_TOUCH rule 8).
 *
 * Response: 200 OK
 *   {
 *     session: {
 *       session_id, status, reading_level, classification,
 *       conversation_history: [{ role, content, timestamp }, ...],
 *       extracted_fields: { field_name: { value, confidence, ... }, ... },
 *       created_at, updated_at, is_test, session_type,
 *       metadata: {...}
 *     }
 *   }
 * Errors: 404 not found, 401 unauth, 405 wrong method.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { makeClientsFromEnv } from '../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const sessionId =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session id is required' });
  }

  try {
    const clients = makeClientsFromEnv();
    const state = await clients.db.readSession({ sessionId });
    if (!state) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Flatten the state into the admin view shape.
    return res.status(200).json({
      session: {
        session_id: state.sessionId,
        org_id: state.orgId,
        session_type: state.sessionType,
        status: state.status,
        reading_level: state.readingLevel,
        classification: state.classification,
        conversation_history: state.conversationHistory,
        extracted_fields: state.extractedFields,
        metadata: state.metadata,
        accessibility_settings: state.accessibilitySettings,
        is_test: state.isTest,
        anon_session_id: state.anonSessionId,
        user_id: state.userId,
        listing_id: state.listingId,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/sessions/[id] failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
