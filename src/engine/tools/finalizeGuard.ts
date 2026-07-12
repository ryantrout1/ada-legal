/**
 * Confirm-before-finalize gate (R5a).
 *
 * Finalizing an Ada session is a one-way door: it locks the readout, routes the
 * case, and (for class-action) fires the attorney handoff. Ada must not slam
 * that door in the same turn she decides the outcome — the user needs a chance
 * to see a plain-language summary and correct it first.
 *
 * The gate is structural, not a prompt nudge. propose_summary records how many
 * user turns the transcript had when Ada proposed the summary. end_session and
 * finalize_intake then refuse to complete a LIVE session unless the user has
 * taken another turn since — which can only happen across a turn boundary, so
 * Ada cannot propose-and-finalize in one breath.
 *
 * Test/preview sessions bypass this (same philosophy as the other finalize
 * gates): preview exists to exercise Ada freely, with no real user to protect.
 */

import type { AdaSessionState } from '../types.js';
import type { Message } from '../../types/db.js';

/** Count the user's turns in the transcript. */
export function countUserTurns(history: Message[]): number {
  return history.filter((m) => m.role === 'user').length;
}

/**
 * True when the user has had a turn to review the proposed summary — i.e. a
 * summary was proposed and at least one user turn has landed since. False when
 * no summary was ever proposed, or the only "proposal" happened this same turn.
 */
export function confirmationSatisfied(state: AdaSessionState): boolean {
  const proposedAt = state.metadata.summary_proposed_at_user_turns;
  if (proposedAt == null) return false;
  return countUserTurns(state.conversationHistory) > proposedAt;
}

export const NEEDS_CONFIRMATION_MESSAGE =
  'Before finalizing, call propose_summary to show the user a short, plain-language ' +
  'summary of what you found and what happens next, then WAIT for their reply so they ' +
  'can confirm or correct it. Do not finalize in the same turn you propose the summary.';
