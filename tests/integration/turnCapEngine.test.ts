/**
 * Integration test for the per-session turn cap inside processAdaTurn
 * (§2 a3, /plan Phase 3 AC1).
 *
 * At the cap the engine must NOT call the model: it records the user's
 * final message, appends a graceful wrap-up, and completes the session
 * (which lets the normal finalizeTurn path produce the readout). Below
 * the cap the turn runs normally.
 *
 * "Model not called" is asserted structurally: when we expect a
 * short-circuit we enqueue NO scripted AI response, so a model call
 * would fail — a clean pass proves the model was skipped.
 */

import { describe, it, expect } from 'vitest';
import { processAdaTurn } from '@/engine/processAdaTurn';
import { createSession } from '@/engine/session/sessionRepo';
import {
  makeInMemoryClients,
  type InMemoryAdaClients,
} from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';
import type { Message } from '@/types/db';
import { MAX_USER_TURNS } from '@/lib/turnCap';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ANON_ID = '00000000-0000-4000-8000-000000000abc';

function msg(role: 'user' | 'assistant', text: string): Message {
  return { role, content: text, timestamp: '2026-01-01T00:00:00.000Z' };
}

function seededSession(clients: InMemoryAdaClients, userTurns: number): AdaSessionState {
  const base = createSession(clients, {
    orgId: ORG_ID,
    sessionType: 'public_ada',
    anonSessionId: ANON_ID,
    userId: null,
  });
  const history: Message[] = [];
  for (let i = 0; i < userTurns; i++) {
    history.push(msg('user', `u${i}`));
    history.push(msg('assistant', `a${i}`));
  }
  return { ...base, conversationHistory: history };
}

function textOnlyTurn(text: string) {
  return [
    { type: 'text_delta' as const, content: text },
    { type: 'message_stop' as const },
  ];
}

describe('processAdaTurn — per-session turn cap', () => {
  it('at the cap: completes the session with a wrap-up, without calling the model', async () => {
    const clients = makeInMemoryClients();
    const state = seededSession(clients, MAX_USER_TURNS);
    // No enqueued AI response on purpose — a model call would fail.

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'one more thing' },
    });

    expect(result.nextState.status).toBe('completed');
    expect(result.toolInvocations).toHaveLength(0);
    expect(typeof result.assistantMessage.content).toBe('string');
    expect((result.assistantMessage.content as string).length).toBeGreaterThan(0);
    // The user's final message is still recorded, then the wrap-up.
    const hist = result.nextState.conversationHistory;
    expect(hist[hist.length - 1].role).toBe('assistant');
    expect(hist.some((m) => m.role === 'user' && m.content === 'one more thing')).toBe(true);
  });

  it('below the cap: runs the turn normally and stays active', async () => {
    const clients = makeInMemoryClients();
    const state = seededSession(clients, MAX_USER_TURNS - 1);
    clients.ai.enqueueResponse(textOnlyTurn('Go on.'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'still talking' },
    });

    expect(result.nextState.status).toBe('active');
    expect(result.assistantMessage.content).toBe('Go on.');
  });
});
