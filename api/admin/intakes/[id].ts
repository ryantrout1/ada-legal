/**
 * GET /api/admin/intakes/[id]
 *
 * Returns full detail for a single class_action_intake session, including
 * the joined firm + listing in one round-trip so the B44 admin detail
 * page doesn't have to fan out across /sessions, /listings, /firms.
 *
 * Gates (DbClient.readIntakeForAdmin enforces; we just surface 404 here):
 *   - session must exist
 *   - session_type must be 'class_action_intake'
 *   - session must belong to the admin's org
 * Any miss → 404. Cross-org access is "not found" not 403 to avoid
 * leaking existence.
 *
 * Response shape mirrors GET /api/admin/sessions/[id] for the session
 * block (so the B44 detail page can reuse the Phase 3 components
 * verbatim), with three additions:
 *   - quality_check: same shape as /sessions/[id]
 *   - firm: { id, name, email }
 *   - listing: { id, title, slug }
 *
 * Ref: /plan Phase 4a.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return; // preflight handled

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
    return res.status(400).json({ error: 'Intake id is required' });
  }

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) {
      return res.status(500).json({ error: 'Default organization not found' });
    }

    const intake = await clients.db.readIntakeForAdmin({
      sessionId,
      orgId: org.id,
    });
    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }

    // Fetch the quality check separately — same as /sessions/[id]. Missing
    // row is fine; sessions that haven't completed yet don't have one.
    const qualityCheck = await clients.db.readSessionQualityCheck(sessionId);

    const { session, firm, listing } = intake;

    return res.status(200).json({
      session: {
        session_id: session.sessionId,
        org_id: session.orgId,
        session_type: session.sessionType,
        status: session.status,
        reading_level: session.readingLevel,
        classification: session.classification,
        conversation_history: session.conversationHistory,
        extracted_fields: session.extractedFields,
        metadata: session.metadata,
        accessibility_settings: session.accessibilitySettings,
        is_test: session.isTest,
        anon_session_id: session.anonSessionId,
        user_id: session.userId,
        listing_id: session.listingId,
      },
      quality_check: qualityCheck
        ? {
            passed: qualityCheck.passed,
            failures: qualityCheck.failures,
            warnings: qualityCheck.warnings,
            checked_at: qualityCheck.checkedAt,
          }
        : null,
      firm,
      listing,
    });
  } catch (err) {
    console.error('GET /api/admin/intakes/[id] failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
