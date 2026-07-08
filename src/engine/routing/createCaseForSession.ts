/**
 * createCaseForSession — the impure half of Phase 1a routing.
 *
 * Runs at session completion (from finalizeTurn). Resolves the firm for any
 * bound litigation, calls the pure decideLane, creates the worked-case row
 * (idempotently), and records an audit entry. The self-help readout is
 * produced independently upstream and is unaffected by this.
 *
 * Safe by construction: this function never throws. Any failure is caught,
 * logged, and returns null — routing must never block a session from
 * completing or a user from getting their readout (/plan Phase 1a AC6). The
 * finalizeTurn caller still wraps it, belt-and-suspenders.
 *
 * Ref: /plan Phase 1a.
 */

import type { AdaClients, CaseRow } from '../clients/types.js';
import type { AdaSessionState } from '../types.js';
import { decideLane } from './routeCase.js';
import { sendAdminRoutingNotification } from '../notifications/routingNotifications.js';

/** First-contact SLA window for a routed_firm case (24h). */
const FIRST_CONTACT_SLA_MS = 24 * 60 * 60 * 1000;

type RoutingClients = Pick<AdaClients, 'db' | 'clock' | 'audit'> &
  Partial<Pick<AdaClients, 'email' | 'adminNotificationEmail'>>;

/**
 * Resolve the firm a matched litigation routes to: lead counsel if set,
 * otherwise the sole assigned firm. Returns null when there is no firm or the
 * assignment is ambiguous (multiple firms, no lead) — those fall to sourcing.
 */
export async function resolveRoutingFirm(
  clients: Pick<AdaClients, 'db'>,
  litigationListingId: string,
): Promise<string | null> {
  const lit = await clients.db.getLitigationById(litigationListingId);
  if (lit?.leadFirmId) return lit.leadFirmId;

  const assignments = await clients.db.listFirmAssignmentsForLitigation(litigationListingId);
  if (assignments.length === 1) return assignments[0]!.lawFirmId;
  return null;
}

/** Best-effort claimant jurisdiction from extracted fields (snapshot only; gating is deferred). */
function extractJurisdictionState(state: AdaSessionState): string | null {
  const ef = state.extractedFields as Record<string, { value?: unknown } | undefined>;
  for (const key of ['business_state', 'location_state', 'state']) {
    const v = ef[key]?.value;
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return null;
}

export async function createCaseForSession(
  clients: RoutingClients,
  state: AdaSessionState,
): Promise<CaseRow | null> {
  try {
    const litigationListingId = state.litigationListingId;
    const litigationFirmId = litigationListingId
      ? await resolveRoutingFirm(clients, litigationListingId)
      : null;

    const decision = decideLane({
      classificationTitle: state.classification?.title ?? null,
      litigationListingId,
      litigationFirmId,
    });

    const now = clients.clock.now();
    const isRoutedFirm = decision.lane === 'routed_firm';

    const result = await clients.db.createCase({
      orgId: state.orgId,
      adaSessionId: state.sessionId,
      litigationListingId,
      lane: decision.lane,
      firmId: decision.firmId,
      classificationTitle: state.classification?.title ?? null,
      classificationStandard: state.classification?.standard ?? null,
      matchConfidence: state.classification?.tier ?? null,
      jurisdictionState: extractJurisdictionState(state),
      routedAt: isRoutedFirm ? now.toISOString() : null,
      firstContactDue: isRoutedFirm
        ? new Date(now.getTime() + FIRST_CONTACT_SLA_MS).toISOString()
        : null,
      routingReason: decision.reason,
    });

    // Audit only a fresh routing (created=true) — re-finalize is a no-op.
    if (result.created) {
      await clients.audit.log({
        orgId: state.orgId,
        actorType: 'system',
        actorId: null,
        action: 'case.routed',
        resourceType: 'case',
        resourceId: result.caseRow.id,
        metadata: {
          lane: decision.lane,
          firmId: decision.firmId,
          sessionId: state.sessionId,
          litigationListingId,
        },
      });

      // Phase 1c: notify the admin inbox for sourcing / general_queue cases.
      // Isolated soft-fail — a notification failure must never null a case
      // that was already written. The orchestrator lane-guards itself. Routing
      // never depends on email being configured (clients.email may be absent
      // in tests / minimal setups).
      if (clients.email) {
        try {
          await sendAdminRoutingNotification(
            { email: clients.email, db: clients.db, adminEmail: clients.adminNotificationEmail },
            result.caseRow,
          );
        } catch (notifyErr) {
          console.error('admin routing notification failed', notifyErr);
        }
      }
    }

    return result.caseRow;
  } catch (err) {
    console.error('createCaseForSession failed', err);
    return null;
  }
}
