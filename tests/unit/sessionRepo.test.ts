/**
 * Tests for session repo (create, save, load, transition).
 *
 * Layer 1-style: assertions on pure return values (createSession).
 * Layer 2-style: round-trip through InMemoryDbClient for save + load.
 */

import { describe, it, expect } from 'vitest';
import {
  createSession,
  loadSession,
  saveSession,
  transitionSession,
} from '@/engine/session/sessionRepo';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';

const ADALL_ORG_ID = '00000000-0000-4000-8000-000000000001';
const ANON_ID = '00000000-0000-4000-8000-000000000abc';
const USER_ID = '00000000-0000-4000-8000-000000000def';

describe('createSession', () => {
  it('produces a session with status=active, standard reading level, empty history', () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    expect(state.status).toBe('active');
    expect(state.readingLevel).toBe('standard');
    expect(state.conversationHistory).toEqual([]);
    expect(state.extractedFields).toEqual({});
    expect(state.classification).toBeNull();
    expect(state.isTest).toBe(false);
  });

  it('returns a valid UUID for sessionId', () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    expect(state.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('accepts userId-only identity', () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: null,
      userId: USER_ID,
    });
    expect(state.userId).toBe(USER_ID);
    expect(state.anonSessionId).toBeNull();
  });

  it('rejects both anon and user set', () => {
    const clients = makeInMemoryClients();
    expect(() =>
      createSession(clients, {
        orgId: ADALL_ORG_ID,
        sessionType: 'public_ada',
        anonSessionId: ANON_ID,
        userId: USER_ID,
      }),
    ).toThrow(/exactly one/i);
  });

  it('rejects neither anon nor user set', () => {
    const clients = makeInMemoryClients();
    expect(() =>
      createSession(clients, {
        orgId: ADALL_ORG_ID,
        sessionType: 'public_ada',
        anonSessionId: null,
        userId: null,
      }),
    ).toThrow(/exactly one/i);
  });

  it('honours overrides for reading level and isTest', () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'class_action_intake',
      anonSessionId: ANON_ID,
      userId: null,
      readingLevel: 'simple',
      isTest: true,
      listingId: '00000000-0000-4000-8000-0000000000aa',
    });
    expect(state.readingLevel).toBe('simple');
    expect(state.isTest).toBe(true);
    expect(state.sessionType).toBe('class_action_intake');
    expect(state.listingId).toBe('00000000-0000-4000-8000-0000000000aa');
  });
});

describe('save + load round-trip', () => {
  it('saves a session and reads it back with identical fields', async () => {
    const clients = makeInMemoryClients();
    const created = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });

    await saveSession(clients, created);
    const loaded = await loadSession(clients, created.sessionId);

    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(created);
  });

  it('loadSession returns null for unknown id', async () => {
    const clients = makeInMemoryClients();
    const loaded = await loadSession(clients, '00000000-0000-4000-8000-ffffffffffff');
    expect(loaded).toBeNull();
  });

  it('save overwrites prior state', async () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    await saveSession(clients, state);

    const edited = {
      ...state,
      conversationHistory: [
        {
          role: 'user' as const,
          content: 'hi',
          timestamp: '2026-04-20T12:00:00Z',
        },
      ],
    };
    await saveSession(clients, edited);

    const loaded = await loadSession(clients, state.sessionId);
    expect(loaded?.conversationHistory).toHaveLength(1);
    expect(loaded?.conversationHistory[0].content).toBe('hi');
  });
});

describe('transitionSession', () => {
  it('active → completed persists new status', async () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    await saveSession(clients, state);

    const transitioned = await transitionSession(clients, state, 'complete');
    expect(transitioned.status).toBe('completed');

    const loaded = await loadSession(clients, state.sessionId);
    expect(loaded?.status).toBe('completed');
  });

  it('active → abandoned persists new status', async () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    await saveSession(clients, state);

    const transitioned = await transitionSession(clients, state, 'abandon');
    expect(transitioned.status).toBe('abandoned');
  });

  it('rejects transition on terminal state', async () => {
    const clients = makeInMemoryClients();
    const state = createSession(clients, {
      orgId: ADALL_ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    const completed = { ...state, status: 'completed' as const };

    await expect(transitionSession(clients, completed, 'abandon')).rejects.toThrow(
      /Illegal/,
    );
  });
});
