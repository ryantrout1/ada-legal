/**
 * Attorney email-bind policy (/plan Phase 4a).
 *
 * The whole linkage decision as a pure function so it's testable without Clerk
 * or a DB. Security rule: bind ONLY on a verified email with exactly one
 * unbound match. Never on unverified, zero, or ambiguous matches; short-circuit
 * when the clerk user already resolves to an attorney.
 */

export interface BindMatch {
  id: string;
}

export type BindDecision =
  | { action: 'already_bound' }
  | { action: 'unverified' }
  | { action: 'no_match' }
  | { action: 'ambiguous' }
  | { action: 'bind'; attorneyId: string };

export function decideBind(input: {
  alreadyBound: boolean;
  emailVerified: boolean;
  email: string | null;
  matches: BindMatch[];
}): BindDecision {
  if (input.alreadyBound) return { action: 'already_bound' };
  if (!input.emailVerified || !input.email) return { action: 'unverified' };
  if (input.matches.length === 0) return { action: 'no_match' };
  if (input.matches.length > 1) return { action: 'ambiguous' };
  return { action: 'bind', attorneyId: input.matches[0].id };
}
