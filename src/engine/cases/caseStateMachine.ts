/**
 * Case state machine.
 *
 * Defines the legal transitions for `cases.status` — the worked-case
 * lifecycle that sits downstream of routing:
 *
 *   new       → accepted   (firm takes a matched case)
 *   new       → declined   (firm passes — conflict / capacity / not viable)
 *   new       → closed     (terminal-lane cases: self_help / no_action; or admin close)
 *   accepted  → working    (first contact logged)
 *   accepted  → declined   (firm backs out after accepting)
 *   accepted  → reclaimed  (first-contact SLA breached → admin pulls it back)
 *   working   → resolved   (lawyer closes with an outcome)
 *   working   → reclaimed  (stalled → admin pulls it back)
 *   declined  → new        (re-routed to the next firm / sourcing queue)
 *   reclaimed → new        (re-routed)
 *   resolved / closed      (terminal — no transitions out)
 *
 * A declined or reclaimed case never dead-ends: `reroute` returns it to
 * `new` so the router can place it again. `firm_id` / `assigned_lawyer_id`
 * reassignment is the caller's job; this module only governs `status`.
 *
 * This module is pure: given a current status and a proposed transition it
 * returns the new status or throws. No DB calls, no I/O. Case persistence
 * wraps this — reads current status, calls applyCaseTransition(), writes the
 * new status atomically, and appends a case_activity row.
 *
 * Ref: docs/DO_NOT_TOUCH.md rule 2 (status only mutated via the state
 * machine — `cases` has its own status, never driven through
 * ada_sessions.status). /plan Phase 0.
 */

/**
 * The routing destination, set once by the router (Phase 1) and immutable
 * thereafter. Distinct from CaseStatus (the work lifecycle within a lane).
 */
export type CaseLane =
  | 'routed_firm'
  | 'sourcing'
  | 'general_queue'
  | 'self_help'
  | 'no_action';

export type CaseStatus =
  | 'new'
  | 'accepted'
  | 'declined'
  | 'working'
  | 'resolved'
  | 'reclaimed'
  | 'closed';

export type CaseTransition =
  | 'accept'
  | 'decline'
  | 'begin_work'
  | 'reclaim'
  | 'resolve'
  | 'close'
  | 'reroute';

/**
 * The transition table. TRANSITIONS[transition][from] = the resulting status.
 * A (transition, from) pair absent from the table is illegal.
 */
const TRANSITIONS: Record<CaseTransition, Partial<Record<CaseStatus, CaseStatus>>> = {
  accept: { new: 'accepted' },
  decline: { new: 'declined', accepted: 'declined' },
  begin_work: { accepted: 'working' },
  reclaim: { accepted: 'reclaimed', working: 'reclaimed' },
  resolve: { working: 'resolved' },
  close: { new: 'closed' },
  reroute: { declined: 'new', reclaimed: 'new' },
};

const TERMINAL: ReadonlySet<CaseStatus> = new Set<CaseStatus>(['resolved', 'closed']);

/**
 * Describes a rejected transition. Thrown so callers can distinguish "bad
 * state for this transition" from a generic error.
 */
export class IllegalCaseTransitionError extends Error {
  constructor(
    public readonly from: CaseStatus,
    public readonly transition: CaseTransition,
  ) {
    super(`Illegal case transition: cannot ${transition} a case in status '${from}'.`);
    this.name = 'IllegalCaseTransitionError';
  }
}

/** Apply a transition. Returns the new status, or throws if illegal. */
export function applyCaseTransition(from: CaseStatus, transition: CaseTransition): CaseStatus {
  const next = TRANSITIONS[transition][from];
  if (next === undefined) {
    throw new IllegalCaseTransitionError(from, transition);
  }
  return next;
}

/** True when the transition is legal from the given status. */
export function canTransitionCase(from: CaseStatus, transition: CaseTransition): boolean {
  return TRANSITIONS[transition][from] !== undefined;
}

/** True for statuses with no transitions out. */
export function isCaseTerminal(status: CaseStatus): boolean {
  return TERMINAL.has(status);
}
