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
import { isFirmEligible } from './firmEligibility.js';
import { sendAdminRoutingNotification } from '../notifications/routingNotifications.js';

/** First-contact SLA window for a routed_firm case (24h). */
const FIRST_CONTACT_SLA_MS = 24 * 60 * 60 * 1000;

type RoutingClients = Pick<AdaClients, 'db' | 'clock' | 'audit'> &
  Partial<Pick<AdaClients, 'email' | 'adminNotificationEmail'>>;

/**
 * Resolve the DISPLAY firm for a matched litigation: lead counsel if set,
 * otherwise the sole assigned firm. Returns null when there is no firm or the
 * assignment is ambiguous (multiple firms, no lead).
 *
 * Eligibility-INDEPENDENT: this is the firm whose public contact the readout
 * shows for any matched litigation, whether or not that firm has signed up to
 * receive routed leads. The routing decision uses a separate resolver
 * (resolveEligibleRoutingFirm) so "show a firm's contact" and "route a lead to
 * a firm" can diverge.
 *
 * Ref: routing rebuild /plan Phase 1 (decouple display from routing).
 */
export async function resolveDisplayFirm(
  clients: Pick<AdaClients, 'db'>,
  litigationListingId: string,
): Promise<string | null> {
  const lit = await clients.db.getLitigationById(litigationListingId);
  if (lit?.leadFirmId) return lit.leadFirmId;

  const assignments = await clients.db.listFirmAssignmentsForLitigation(litigationListingId);
  if (assignments.length === 1) return assignments[0]!.lawFirmId;
  return null;
}

/**
 * Resolve the firm a matched litigation ROUTES to (the exclusive lead handoff),
 * or null when none qualifies (→ matched_self_referral / sourcing).
 *
 * A firm qualifies only when it has opted in to THIS litigation
 * (litigation_firm_assignments.receives_matches) AND clears the eligibility
 * floor (isFirmEligible: active + subscribed/pilot).
 *
 * Lead precedence: if the litigation designates a lead firm, we route to it
 * only when the lead firm is itself opted in + eligible — we never route to a
 * different firm behind the lead. With no lead, we route to the sole opted-in +
 * eligible firm; zero or more than one → null (ambiguous, don't guess).
 *
 * Ref: /plan "Gate exclusive routing behind firm eligibility", Phase 2.
 */
export async function resolveEligibleRoutingFirm(
  clients: Pick<AdaClients, 'db'>,
  litigationListingId: string,
): Promise<string | null> {
  const assignments = await clients.db.listFirmAssignmentsForLitigation(litigationListingId);
  const optedIn = assignments.filter((a) => a.receivesMatches);
  if (optedIn.length === 0) return null;

  const isEligible = async (firmId: string): Promise<boolean> => {
    const firm = await clients.db.readLawFirmById(firmId);
    return firm != null && isFirmEligible(firm);
  };

  const lit = await clients.db.getLitigationById(litigationListingId);
  const leadFirmId = lit?.leadFirmId ?? null;

  if (leadFirmId) {
    const leadOptedIn = optedIn.some((a) => a.lawFirmId === leadFirmId);
    if (!leadOptedIn) return null;
    return (await isEligible(leadFirmId)) ? leadFirmId : null;
  }

  const eligible: string[] = [];
  for (const a of optedIn) {
    if (await isEligible(a.lawFirmId)) eligible.push(a.lawFirmId);
  }
  return eligible.length === 1 ? eligible[0]! : null;
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
    // Routing rebuild Phase 2: the firm we ROUTE to (opted in + eligible) is
    // resolved separately from whether ANY firm is resolvable for contact
    // DISPLAY. A matched litigation whose firm hasn't opted in still shows
    // contact info (hasDisplayFirm) but does not route (eligibleFirmId null).
    const eligibleFirmId = litigationListingId
      ? await resolveEligibleRoutingFirm(clients, litigationListingId)
      : null;
    const hasDisplayFirm = litigationListingId
      ? (await resolveDisplayFirm(clients, litigationListingId)) != null
      : false;

    const decision = decideLane({
      classificationTitle: state.classification?.title ?? null,
      litigationListingId,
      eligibleFirmId,
      hasDisplayFirm,
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
