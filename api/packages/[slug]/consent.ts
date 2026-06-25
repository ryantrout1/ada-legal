/**
 * /api/packages/[slug]/consent
 *
 * The consent surface for the readout page. The slug is the access control
 * (same trust model as GET /api/packages/[slug] — 60 bits, unguessable, and it
 * is the claimant's own private readout link).
 *
 *   GET  → { lane, consentToShare } for the case routed from this session, or
 *          { lane: null, consentToShare: null } when no case exists. Uncached,
 *          so the page always sees fresh consent state.
 *   POST → records claimant consent (idempotent). { consentToShare: true }.
 *
 * Consent scope is derived from the lane: routed_firm → matched_firm,
 * sourcing → sourcing, general_queue → general_placement. no_action carries no
 * handoff, so consent does not apply (the page never shows a CTA for it).
 *
 * Ref: /plan Phase 1b.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../../_shared.js';
import { isValidPackageSlug } from '../../../src/engine/package/slug.js';
import { sendConsentNotifications } from '../../../src/engine/notifications/routingNotifications.js';
import { APP_BASE } from '../../../src/engine/notifications/routingEmailTemplates.js';

const SCOPE_BY_LANE: Record<string, string> = {
  routed_firm: 'matched_firm',
  sourcing: 'sourcing',
  general_queue: 'general_placement',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slugRaw = req.query.slug;
  const slug = typeof slugRaw === 'string' ? slugRaw : null;
  if (!slug || !isValidPackageSlug(slug)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const clients = makeClientsFromEnv();
    const pkg = await clients.db.readSessionPackageBySlug(slug.toLowerCase());
    if (!pkg) {
      return res.status(404).json({ error: 'Not found' });
    }

    const caseRow = await clients.db.getCaseBySessionId(pkg.sessionId);

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        lane: caseRow?.lane ?? null,
        consentToShare: caseRow?.consentToShare ?? null,
      });
    }

    // POST — record consent.
    if (!caseRow) {
      // The package exists but no case was routed (e.g. routing skipped).
      // Nothing to consent to; report cleanly rather than 500.
      return res.status(404).json({ error: 'No case for this summary' });
    }
    const scope = SCOPE_BY_LANE[caseRow.lane];
    if (!scope) {
      // no_action (or anything without a handoff) — consent doesn't apply.
      return res.status(400).json({ error: 'Consent does not apply to this summary' });
    }

    const result = await clients.db.recordCaseConsent({ sessionId: pkg.sessionId, scope });
    if (!result) {
      return res.status(404).json({ error: 'No case for this summary' });
    }

    // Audit the first consent only (server-side; no conversation content).
    if (!result.alreadyConsented) {
      await clients.audit.log({
        orgId: result.caseRow.orgId,
        actorType: 'system',
        actorId: null,
        action: 'case.consent',
        resourceType: 'case',
        resourceId: result.caseRow.id,
        metadata: { scope, sessionId: pkg.sessionId },
      });

      // Phase 1c: on first consent for a matched case, notify the firm and
      // the claimant. routed_firm only — sourcing / general_queue have no firm
      // yet (admin was already notified at routing time). Isolated soft-fail.
      if (result.caseRow.lane === 'routed_firm') {
        try {
          const readoutUrl = `${APP_BASE}/s/${slug.toLowerCase()}`;
          await sendConsentNotifications(
            { email: clients.email, db: clients.db },
            result.caseRow,
            readoutUrl,
          );
        } catch (notifyErr) {
          console.error('consent notifications failed', notifyErr);
        }
      }
    }

    return res.status(200).json({ consentToShare: true });
  } catch (err) {
    console.error('/api/packages/[slug]/consent failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
