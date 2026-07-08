/**
 * Integration test for the abandonment sweep (§4 h1, /plan Phase 4).
 *
 * Verifies the sweep transitions only idle ACTIVE sessions to abandoned:
 * fresh active sessions and already-terminal (completed) sessions are
 * left alone, and the status change goes through the state machine.
 *
 * Staleness is simulated with the in-memory client's __setSessionUpdatedAt
 * backdate hook (the real DB uses updated_at).
 */

import { describe, it, expect } from 'vitest';
import { sweepAbandonedSessions } from '@/engine/session/sweepAbandoned';
import { transitionSession } from '@/engine/session/sessionRepo';
import { createSession } from '@/engine/session/sessionRepo';
import {
  makeInMemoryClients,
  type InMemoryAdaClients,
} from '@/engine/clients/inMemoryClients';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ANON_ID = '00000000-0000-4000-8000-000000000abc';
const HOUR = 60 * 60 * 1000;
const NOW_ISO = '2026-05-01T12:00:00.000Z';

async function makeSession(clients: InMemoryAdaClients, updatedAtIso: string) {
  const state = createSession(clients, {
    orgId: ORG_ID,
    sessionType: 'public_ada',
    anonSessionId: ANON_ID,
    userId: null,
  });
  await clients.db.writeSession({ state });
  clients.db.__setSessionUpdatedAt(state.sessionId, updatedAtIso);
  return state;
}

describe('sweepAbandonedSessions', () => {
  it('abandons idle active sessions, leaves fresh + terminal ones', async () => {
    const clients = makeInMemoryClients();

    // Two stale active sessions (idle 48h and 30h).
    const stale1 = await makeSession(clients, '2026-04-29T12:00:00.000Z'); // 48h old
    const stale2 = await makeSession(clients, '2026-04-30T06:00:00.000Z'); // 30h old
    // One fresh active session (idle 1h).
    const fresh = await makeSession(clients, '2026-05-01T11:00:00.000Z');
    // One completed session, also idle 48h — must NOT be touched (not active).
    const done = await makeSession(clients, '2026-04-29T12:00:00.000Z');
    await transitionSession(clients, done, 'complete');
    clients.db.__setSessionUpdatedAt(done.sessionId, '2026-04-29T12:00:00.000Z');

    const result = await sweepAbandonedSessions(clients, {
      nowIso: NOW_ISO,
      idleThresholdMs: 24 * HOUR,
      limit: 100,
    });

    expect(result.candidateCount).toBe(2);
    expect(result.abandonedCount).toBe(2);
    expect(result.errorCount).toBe(0);

    expect((await clients.db.readSession({ sessionId: stale1.sessionId }))!.status).toBe('abandoned');
    expect((await clients.db.readSession({ sessionId: stale2.sessionId }))!.status).toBe('abandoned');
    expect((await clients.db.readSession({ sessionId: fresh.sessionId }))!.status).toBe('active');
    expect((await clients.db.readSession({ sessionId: done.sessionId }))!.status).toBe('completed');
  });

  it('respects the limit and drains oldest-first', async () => {
    const clients = makeInMemoryClients();
    await makeSession(clients, '2026-04-25T12:00:00.000Z'); // oldest
    await makeSession(clients, '2026-04-27T12:00:00.000Z');
    await makeSession(clients, '2026-04-29T12:00:00.000Z'); // newest-but-stale

    const result = await sweepAbandonedSessions(clients, {
      nowIso: NOW_ISO,
      idleThresholdMs: 24 * HOUR,
      limit: 2,
    });

    // 3 stale, but capped at 2 this run; the third remains for the next run.
    expect(result.candidateCount).toBe(2);
    expect(result.abandonedCount).toBe(2);
    const remaining = await clients.db.listStaleActiveSessionIds({
      olderThanIso: NOW_ISO,
      limit: 10,
    });
    expect(remaining).toHaveLength(1);
  });

  it('does nothing when no sessions are stale', async () => {
    const clients = makeInMemoryClients();
    await makeSession(clients, '2026-05-01T11:30:00.000Z'); // 30 min old

    const result = await sweepAbandonedSessions(clients, {
      nowIso: NOW_ISO,
      idleThresholdMs: 24 * HOUR,
      limit: 100,
    });

    expect(result.candidateCount).toBe(0);
    expect(result.abandonedCount).toBe(0);
  });
});
