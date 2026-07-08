/**
 * Per-session turn cap — a budget guard for the anonymous Ada chat.
 *
 * Every /api/ada/turn is anonymous and, until now, unbounded: a stale or
 * abusive session could keep submitting turns forever, and because each
 * turn re-sends the whole transcript to the model, cost and latency grow
 * with history. This resolver caps the number of user turns a single
 * session will process.
 *
 * MAX_USER_TURNS is set at 60. Real completed sessions top out around 56,
 * so a legitimate conversation never reaches it — the cap only bites on
 * runaway/abuse. When it does, the engine records the user's final
 * message, appends the wrap-up below, and completes the session so the
 * normal finalize path still produces the readout (see processAdaTurn).
 *
 * "Prior history" means the transcript BEFORE the incoming user message
 * is appended: once it already holds MAX_USER_TURNS user turns, the next
 * one is capped.
 *
 * NOTE (copy): the wrap-up message is claimant-facing — pending Gina's
 * §3 copy review before user-facing enable.
 *
 * Ref: /plan Phase 3 (§2 a3).
 */

import type { Message } from '../types/db.js';

export const MAX_USER_TURNS = 60;

const WRAP_UP_MESSAGE =
  "We've covered a lot of ground here, so I'm going to wrap up this " +
  "conversation to make sure nothing we talked about gets lost — " +
  "you'll get a summary of what we discussed. If there's more you want " +
  'to go through, you can start a fresh conversation any time.';

export interface TurnCapDecision {
  /** True when the incoming turn crosses the cap and should be refused. */
  capReached: boolean;
  /** The graceful wrap-up copy to show, or '' when the cap isn't reached. */
  wrapUpMessage: string;
}

/** Count user-role messages in a transcript. */
export function countUserTurns(history: readonly Message[]): number {
  let n = 0;
  for (const m of history) {
    if (m.role === 'user') n++;
  }
  return n;
}

/**
 * Decide whether the incoming turn crosses the cap, given the transcript
 * as it stands BEFORE the new user message is appended.
 */
export function evaluateTurnCap(priorHistory: readonly Message[]): TurnCapDecision {
  const capReached = countUserTurns(priorHistory) >= MAX_USER_TURNS;
  return {
    capReached,
    wrapUpMessage: capReached ? WRAP_UP_MESSAGE : '',
  };
}
