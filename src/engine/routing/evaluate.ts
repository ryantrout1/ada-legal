/**
 * Routing engine — rule evaluator.
 *
 * Step 22. Given a session and the set of active routing rules, return
 * the rules that match. The return value is a list of RoutingMatch
 * objects that the prompt assembler surfaces to Ada as "available
 * routing destinations" — Ada then decides whether to offer them, and
 * the user decides whether to accept.
 *
 * The evaluator is a pure function with no DB access of its own. The
 * caller (processAdaTurn) fetches the active rules via
 * DbClient.listActiveRoutingRules and passes them in. This keeps
 * evaluation trivially testable and lets us swap in a different
 * rule source later (e.g. cache) without rewiring.
 *
 * Matching logic:
 *
 *   1. Don't route to our own org. A session in 'adall' never routes
 *      to 'adall' even if a rule says so.
 *
 *   2. Complaint type match:
 *      - Rule with empty complaintTypes matches any classification.
 *      - Otherwise, rule.complaintTypes must include the session's
 *        classification.title (I, II, III, class_action, out_of_scope).
 *      - If the session has no classification yet, the rule is skipped
 *        (we don't pre-emptively route).
 *
 *   3. Jurisdiction match:
 *      - Rule with empty jurisdictions matches any location.
 *      - Otherwise, at least one rule jurisdiction must match the
 *        session's extracted location. State match is required; city
 *        match is only required when the rule specifies a city.
 *      - If the session has no location_state extracted, rules WITH
 *        jurisdictions are skipped. Rules WITHOUT jurisdictions still
 *        match (intentionally permissive for jurisdiction-agnostic
 *        routing like federal agencies).
 *
 * Output order matches input: DbClient returns rules already sorted
 * by priority ASC then ruleId. We preserve that order.
 *
 * Ref: Step 22.
 */

import type { AdaSessionState } from '../types.js';
import type {
  RoutingRuleWithTarget,
} from '../clients/types.js';
import type { RoutingJurisdiction } from '../../types/db.js';

export interface RoutingMatch {
  ruleId: string;
  targetOrgId: string;
  targetOrgCode: string;
  targetOrgDisplayName: string;
  priority: number;
}

export interface EvaluateOptions {
  /** The current session. */
  session: AdaSessionState;
  /** Active rules, already fetched from DB. Ordered by priority. */
  rules: ReadonlyArray<RoutingRuleWithTarget>;
}

export function evaluateRoutingRules({
  session,
  rules,
}: EvaluateOptions): RoutingMatch[] {
  const matches: RoutingMatch[] = [];

  const classificationTitle = session.classification?.title ?? null;
  const locationState = extractLocationValue(session, 'location_state');
  const locationCity = extractLocationValue(session, 'location_city');

  for (const rule of rules) {
    // Gate 1: don't route to the session's own org.
    if (rule.targetOrgId === session.orgId) continue;

    // Gate 2: complaint type match.
    if (rule.complaintTypes.length > 0) {
      if (!classificationTitle) continue;
      if (!rule.complaintTypes.includes(classificationTitle)) continue;
    }

    // Gate 3: jurisdiction match.
    if (rule.jurisdictions.length > 0) {
      if (!locationState) continue;
      if (!anyJurisdictionMatches(rule.jurisdictions, locationState, locationCity)) {
        continue;
      }
    }

    matches.push({
      ruleId: rule.ruleId,
      targetOrgId: rule.targetOrgId,
      targetOrgCode: rule.targetOrgCode,
      targetOrgDisplayName: rule.targetOrgDisplayName,
      priority: rule.priority,
    });
  }

  return matches;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractLocationValue(
  session: AdaSessionState,
  field: 'location_state' | 'location_city',
): string | null {
  const entry = session.extractedFields[field];
  if (!entry) return null;
  const v = entry.value;
  if (typeof v !== 'string' || v.trim() === '') return null;
  return v.trim();
}

/**
 * True when at least one of the rule's jurisdictions matches the
 * session's location. State comparison is case-insensitive (rules
 * usually store uppercase 'AZ', but Ada might extract 'Arizona' —
 * TODO: normalize to uppercase state codes at extract_field time).
 * City comparison is also case-insensitive; if the rule specifies
 * a city, the session must have that city too.
 */
function anyJurisdictionMatches(
  ruleJurisdictions: RoutingJurisdiction[],
  sessionState: string,
  sessionCity: string | null,
): boolean {
  const sessStateNorm = sessionState.toUpperCase();
  const sessCityNorm = sessionCity?.toLowerCase() ?? null;

  for (const j of ruleJurisdictions) {
    const ruleStateNorm = j.state.toUpperCase();
    if (ruleStateNorm !== sessStateNorm) continue;

    if (j.city) {
      if (!sessCityNorm) continue; // rule wants a city, session has none
      if (j.city.toLowerCase() !== sessCityNorm) continue;
    }

    // state matched (and city matched if required)
    return true;
  }
  return false;
}
