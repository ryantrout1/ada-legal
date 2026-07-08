/**
 * Abandonment sweep — mark idle `active` sessions as `abandoned`.
 *
 * The problem this fixes: nothing ever transitioned sessions to
 * `abandoned` (the transition existed in the state machine but had no
 * caller and no scheduler), so `active` rows piled up indefinitely. A
 * stale session keeps accepting turns forever with unbounded history.
 *
 * How it stays correct: this does NOT bulk-UPDATE status (DO_NOT_TOUCH
 * rule 2 — status is only mutated through the state machine). It finds
 * candidate ids via a read-only query, then for each one loads the
 * session and runs the existing `transitionSession(…, 'abandon')`
 * helper, which routes the status change through applyTransition. One
 * bad session can't abort the run — each is wrapped, errors counted.
 *
 * Idempotent: a session already transitioned out of `active` between the
 * candidate query and the per-row read is skipped.
 *
 * Ref: /plan Phase 4 (§4 h1). Invoked by api/cron/sweep-abandoned.ts.
 */

import type { AdaClients } from '../clients/types.js';
import { transitionSession } from './sessionRepo.js';

export interface SweepAbandonedOptions {
  /** "Now" as ISO — injected so tests are deterministic. */
  nowIso: string;
  /** How long a session may sit idle (no writes) before it's swept. */
  idleThresholdMs: number;
  /** Max sessions to abandon in one run (bounds a single invocation). */
  limit: number;
}

export interface SweepAbandonedResult {
  /** Cutoff used (sessions with updated_at before this were candidates). */
  cutoffIso: string;
  /** Candidate ids the query returned. */
  candidateCount: number;
  /** Sessions actually transitioned to abandoned this run. */
  abandonedCount: number;
  /** Candidates skipped because they were no longer active. */
  skippedCount: number;
  /** Per-session failures (logged; run continues). */
  errorCount: number;
}

export async function sweepAbandonedSessions(
  clients: AdaClients,
  opts: SweepAbandonedOptions,
): Promise<SweepAbandonedResult> {
  const cutoffIso = new Date(
    new Date(opts.nowIso).getTime() - opts.idleThresholdMs,
  ).toISOString();

  const ids = await clients.db.listStaleActiveSessionIds({
    olderThanIso: cutoffIso,
    limit: opts.limit,
  });

  let abandonedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const sessionId of ids) {
    try {
      const state = await clients.db.readSession({ sessionId });
      // Skip if gone or already transitioned since the candidate query.
      if (!state || state.status !== 'active') {
        skippedCount++;
        continue;
      }
      await transitionSession(clients, state, 'abandon');
      abandonedCount++;
    } catch (err) {
      errorCount++;
      console.error(`sweep: failed to abandon session ${sessionId}`, err);
    }
  }

  return {
    cutoffIso,
    candidateCount: ids.length,
    abandonedCount,
    skippedCount,
    errorCount,
  };
}
