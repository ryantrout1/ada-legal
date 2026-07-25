/**
 * Routing capacity — whether a firm can currently take another exclusive lead.
 *
 * SEPARATE FROM ELIGIBILITY ON PURPOSE. `isFirmEligible` answers a commercial
 * question about the firm: active, and paying or comped. This answers an
 * operational question about its people: has anyone here said they are full or
 * paused. Both must pass, and collapsing them would make "I'm full" look like
 * a billing problem.
 *
 * WHY THIS EXISTED ONLY ON PAPER. `attorneys.accepting_referrals`,
 * `routing_paused` and `max_active_cases` shipped in migration 0023, are
 * writable from the profile screen, and are read back for display. The
 * schema comment says the router reads them "to stop pushing to a full or
 * paused attorney." It never did. An attorney could flip "I'm full" and keep
 * receiving exclusively-routed intakes — cases no other firm can see, sitting
 * unworked while the claimant waits. The switch was decorative.
 *
 * FIRM-LEVEL FROM ATTORNEY-LEVEL FACTS. Routing assigns to a firm, not a
 * person, so a firm has capacity when ANY of its attorneys does. Two paused
 * attorneys at a three-person firm do not close the firm.
 *
 * A FIRM WITH NO ATTORNEY ROWS COUNTS AS AVAILABLE. Fail-open is deliberate:
 * these flags exist so someone can opt OUT, and an empty roster is not an
 * opt-out. Failing closed would silently stop routing to every firm that
 * hasn't had its people entered yet — a data-entry gap turning into an outage.
 *
 * Pure, so the rule is testable without a database. The caller supplies the
 * rows and the counts.
 */

export interface AttorneyCapacity {
  /** Profile toggle: is this attorney taking new referrals at all. */
  acceptingReferrals: boolean;
  /** Harder stop than the above — a temporary pause. */
  routingPaused: boolean;
  /** Null means no self-imposed ceiling. */
  maxActiveCases: number | null;
  /** Cases currently assigned to them in a working status. */
  activeCaseCount: number;
}

/** One attorney's availability for a new referral. */
export function isAttorneyAvailable(a: AttorneyCapacity): boolean {
  if (!a.acceptingReferrals) return false;
  if (a.routingPaused) return false;
  // `>=` not `>`: at the ceiling means full, not room for one more.
  if (a.maxActiveCases != null && a.activeCaseCount >= a.maxActiveCases) return false;
  return true;
}

/**
 * Whether a firm can take another routed lead.
 *
 * Empty roster → true, see the fail-open note above.
 */
export function firmHasRoutingCapacity(attorneys: AttorneyCapacity[]): boolean {
  if (attorneys.length === 0) return true;
  return attorneys.some(isAttorneyAvailable);
}
