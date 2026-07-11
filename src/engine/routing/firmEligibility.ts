/**
 * Firm eligibility floor for exclusive lead routing.
 *
 * A firm may receive a routed lead only when it clears this floor AND has
 * opted in to the specific litigation (litigation_firm_assignments
 * .receives_matches). This function is the floor half — pure, so it's trivially
 * testable and reused by the router and any future pool/admin surface.
 *
 * Floor: the firm is active, and either has a Stripe customer (paying) or is a
 * pilot firm (comped — we vouch for them without a subscription). A suspended
 * or churned firm never receives leads, even if opted in.
 *
 * Ref: /plan "Gate exclusive routing behind firm eligibility", Phase 2 (D1).
 */

import type { LawFirmRow } from '../clients/types.js';

export function isFirmEligible(firm: LawFirmRow): boolean {
  return firm.status === 'active' && (firm.stripeCustomerId != null || firm.isPilot === true);
}
