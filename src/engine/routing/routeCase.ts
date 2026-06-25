/**
 * Lane router (pure).
 *
 * The heart of Phase 1 routing: given a completed session's classification,
 * its (user-confirmed) litigation binding, and the firm resolved for that
 * litigation, pick exactly one lane. No I/O — the impure resolution (looking
 * up the litigation's firm) happens in createCaseForSession; this function is
 * the decision table, kept pure so it's exhaustively unit-testable.
 *
 * Default predicate (Phase 1a — the actionable/self-help/no-action boundary
 * is an open product decision; see /plan Phase 1):
 *   - bound litigation + firm        → routed_firm
 *   - bound litigation, no firm      → sourcing
 *   - no litigation, actionable      → general_queue   (I / II / III / class_action)
 *   - no litigation, not actionable  → no_action       (out_of_scope / none / unclassified)
 *
 * `self_help` is not produced as a routing destination here: every classified
 * public_ada session already gets a self-help readout downstream, so self-help
 * is the universal baseline, not a lane the router selects. Promoting it to a
 * distinct destination is deferred (open decision).
 *
 * Ref: /plan Phase 1a.
 */

import type { AdaTitle } from '../../types/db.js';
import type { CaseLane } from '../cases/caseStateMachine.js';

export interface RouteInput {
  classificationTitle: AdaTitle | null;
  litigationListingId: string | null;
  /** The firm resolved for the bound litigation (lead counsel or sole assignment), or null. */
  litigationFirmId: string | null;
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
    if (input.litigationFirmId) {
      return {
        lane: 'routed_firm',
        firmId: input.litigationFirmId,
        reason: 'matched litigation with an assigned firm',
      };
    }
    return {
      lane: 'sourcing',
      firmId: null,
      reason: 'matched litigation, no firm assigned yet',
    };
  }

  if (input.classificationTitle && ACTIONABLE_TITLES.has(input.classificationTitle)) {
    return {
      lane: 'general_queue',
      firmId: null,
      reason: `actionable classification (${input.classificationTitle}), no litigation match`,
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
