/**
 * Session state machine.
 *
 * Defines the legal transitions for ada_sessions.status (per brief §3):
 *   active → completed      (user finished; Ada said goodbye)
 *   active → abandoned      (timeout; tab closed; user idled)
 *   completed / abandoned → (terminal — no transitions out)
 *
 * This module is pure: given a current status and a proposed transition,
 * it returns the new status or throws. No DB calls, no I/O. Session
 * persistence wraps this — reads current status, calls transition(),
 * writes new status atomically.
 *
 * Ref: docs/ARCHITECTURE.md §3, docs/DO_NOT_TOUCH.md rule 2
 * (status only mutated via this module).
 */

import type { SessionStatus } from '@/engine/types';

export type SessionTransition = 'complete' | 'abandon';

/**
 * Describes a rejected transition. Thrown as part of an IllegalTransitionError
 * so callers can distinguish "bad state for this transition" from generic errors.
 */
export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: SessionStatus,
    public readonly transition: SessionTransition,
  ) {
    super(
      `Illegal session transition: cannot ${transition} a session in status '${from}'.`,
    );
    this.name = 'IllegalTransitionError';
  }
}

/** Apply a transition. Returns the new status, or throws if illegal. */
export function applyTransition(
  from: SessionStatus,
  transition: SessionTransition,
): SessionStatus {
  if (from !== 'active') {
    throw new IllegalTransitionError(from, transition);
  }
  switch (transition) {
    case 'complete':
      return 'completed';
    case 'abandon':
      return 'abandoned';
  }
}

/** Whether a status is terminal (no further transitions allowed). */
export function isTerminal(status: SessionStatus): boolean {
  return status === 'completed' || status === 'abandoned';
}

/** Whether a transition is legal from the given status. */
export function canTransition(
  from: SessionStatus,
  transition: SessionTransition,
): boolean {
  try {
    applyTransition(from, transition);
    return true;
  } catch {
    return false;
  }
}
