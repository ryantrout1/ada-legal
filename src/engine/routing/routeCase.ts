/**
 * Lane router (pure).
 *
 * Given a completed session's classification, its (user-confirmed) litigation
 * binding, the ELIGIBLE routing firm resolved for that litigation (a firm that
 * is opted in AND clears the eligibility floor), and whether ANY firm is
 * resolvable for display, pick exactly one lane. No I/O — the impure resolution
 * happens in createCaseForSession; this function is the decision table, kept
 * pure so it's exhaustively unit-testable.
 *
 * Truth table (routing rebuild Phase 2):
 *   - bound litigation + eligible firm       → routed_firm           (exclusive handoff)
 *   - bound litigation, no eligible firm,
 *       a display firm exists                 → matched_self_referral (show contact, no handoff)
 *   - bound litigation, no firm at all        → sourcing              (admin recruits)
 *   - no litigation, actionable               → pool                  (I / II / III / class_action — self-select)
 *   - no litigation, not actionable           → no_action             (out_of_scope / none / unclassified)
 *
 * 'general_queue' is no longer produced by the router (R4 cutover) — actionable
 * unmatched intakes go to the shared self-select pool instead of admin
 * placement. general_queue remains a valid lane for legacy rows and the manual
 * admin placement override.
 *
 * `self_help` is not produced as a routing destination here: every classified
 * public_ada session already gets a self-help readout downstream, so self-help
 * is the universal baseline, not a lane the router selects.
 *
 * Ref: /plan "Gate exclusive routing behind firm eligibility", Phase 2.
 */

import type { AdaTitle } from '../../types/db.js';
import type { CaseLane } from '../cases/caseStateMachine.js';

export interface RouteInput {
  classificationTitle: AdaTitle | null;
  litigationListingId: string | null;
  /** The firm the case ROUTES to: opted in AND eligible. null when none qualifies. */
  eligibleFirmId: string | null;
  /** Whether any firm is resolvable for contact display (eligibility-independent). */
  hasDisplayFirm: boolean;
  /**
   * The matched litigation's kind. Null when nothing matched.
   *
   * The router ignored this until 2026-07-27, which meant a class action
   * and a pattern-of-practice record took identical paths — the system
   * could not tell the difference between a case somebody can be handed
   * and a case they are already inside.
   */
  litigationKind: string | null;
}

export interface RouteDecision {
  lane: CaseLane;
  firmId: string | null;
  /** Human-readable basis for the choice — recorded on the case_activity ROUTED row + audit. */
  reason: string;
}

const ACTIONABLE_TITLES: ReadonlySet<AdaTitle> = new Set<AdaTitle>([
  'I',
  'II',
  'III',
  'class_action',
]);

export function decideLane(input: RouteInput): RouteDecision {
  if (input.litigationListingId) {
    // A class action is not an intake to hand over. If the person fits the
    // certified class they are already in it — there is nothing to enrol
    // them in, and a firm that is not appointed class counsel cannot act
    // on the class claim however willing it is.
    //
    // They still reach a firm, because the class action covers the barrier
    // and not their wasted trip, their injury, or anything specific to
    // them — and those are real work. The firm receives them to check for
    // a separate claim, not to take on the class claim.
    //
    // Everyone routes rather than only those Ada judges to have something
    // extra: a firm spending five minutes on someone with no separate
    // claim costs very little, and Ada withholding someone who did have
    // one costs them their case.
    if (input.litigationKind === 'class') {
      return {
        lane: 'class_member',
        firmId: input.eligibleFirmId ?? null,
        reason: input.eligibleFirmId
          ? 'matched class action — already a class member; firm reviews for a separate claim'
          : 'matched class action — already a class member; no firm to review a separate claim',
      };
    }

    if (input.eligibleFirmId) {
      return {
        lane: 'routed_firm',
        firmId: input.eligibleFirmId,
        reason: 'matched litigation with an eligible, opted-in firm',
      };
    }
    if (input.hasDisplayFirm) {
      return {
        lane: 'matched_self_referral',
        firmId: null,
        reason: 'matched litigation; firm not opted in / not eligible — contact info only',
      };
    }
    return {
      lane: 'sourcing',
      firmId: null,
      reason: 'matched litigation, no firm resolvable yet',
    };
  }

  if (input.classificationTitle && ACTIONABLE_TITLES.has(input.classificationTitle)) {
    return {
      lane: 'pool',
      firmId: null,
      reason: `actionable classification (${input.classificationTitle}), no litigation match — self-select pool`,
    };
  }

  return {
    lane: 'no_action',
    firmId: null,
    reason: input.classificationTitle
      ? `non-actionable classification (${input.classificationTitle})`
      : 'no classification',
  };
}
