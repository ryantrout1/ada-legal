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
