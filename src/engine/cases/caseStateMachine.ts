/**
 * Case state machine.
 *
 * Defines the legal transitions for `cases.status` — the worked-case lifecycle
 * that sits downstream of routing. Phase 5 §7.5 expands the mid-pipeline from
 * the original accepted/working pair to the mockup's three working stages:
 *
 *   new          → investigating  (firm accepts a matched case → enters pipeline)
 *   new          → declined       (firm passes — conflict / capacity / not viable)
 *   new          → closed         (terminal-lane cases: self_help / no_action; admin close)
 *   investigating→ demand_sent    (demand letter sent)
 *   investigating→ declined       (firm backs out after accepting)
 *   demand_sent  → negotiating    (negotiation opened)
 *   investigating/demand_sent/negotiating → resolved   (lawyer closes with an outcome)
 *   investigating/demand_sent/negotiating → reclaimed  (stalled → admin pulls it back)
 *   declined     → new            (re-routed to the next firm / sourcing queue)
 *   reclaimed    → new            (re-routed)
 *   resolved / closed             (terminal — no transitions out)
 *
 * A declined or reclaimed case never dead-ends: `reroute` returns it to `new`
 * so the router can place it again. `firm_id` / `assigned_lawyer_id`
 * reassignment is the caller's job; this module only governs `status`.
 *
 * Pure: given a current status and a proposed transition it returns the new
 * status or throws. No DB calls, no I/O. Case persistence wraps this.
 *
 * Ref: docs/DO_NOT_TOUCH.md rule 2. /plan Phase 0; Phase 5 §7.5.
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
  | 'investigating'
  | 'demand_sent'
  | 'negotiating'
  | 'declined'
  | 'resolved'
  | 'reclaimed'
  | 'closed';

export type CaseTransition =
  | 'accept'
  | 'decline'
  | 'send_demand'
  | 'begin_negotiation'
  | 'reclaim'
  | 'resolve'
  | 'close'
  | 'reroute';

/**
 * The transition table. TRANSITIONS[transition][from] = the resulting status.
 * A (transition, from) pair absent from the table is illegal.
 */
const TRANSITIONS: Record<CaseTransition, Partial<Record<CaseStatus, CaseStatus>>> = {
  accept: { new: 'investigating' },
  decline: { new: 'declined', investigating: 'declined' },
  send_demand: { investigating: 'demand_sent' },
  begin_negotiation: { demand_sent: 'negotiating' },
  resolve: { investigating: 'resolved', demand_sent: 'resolved', negotiating: 'resolved' },
  reclaim: { investigating: 'reclaimed', demand_sent: 'reclaimed', negotiating: 'reclaimed' },
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

/** Human-readable summary for a transition activity row. */
export function caseTransitionSummary(opts: {
  transition: CaseTransition;
  reason?: string;
  resolutionType?: string;
}): string {
  switch (opts.transition) {
    case 'accept':
      return 'Attorney accepted the case';
    case 'decline':
      return opts.reason ? `Attorney declined: ${opts.reason}` : 'Attorney declined the case';
    case 'send_demand':
      return 'Attorney sent the demand letter';
    case 'begin_negotiation':
      return 'Attorney opened negotiation';
    case 'resolve':
      return opts.resolutionType
        ? `Attorney resolved the case (${opts.resolutionType})`
        : 'Attorney resolved the case';
    case 'reclaim':
      return 'Case reclaimed';
    case 'close':
      return 'Case closed';
    case 'reroute':
      return 'Case re-routed';
    default:
      return `Case ${opts.transition}`;
  }
}
