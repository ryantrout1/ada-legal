/**
 * Unit — confirm-before-finalize gate (R5a).
 *
 * propose_summary records the user-turn count; end_session / finalize_intake
 * refuse to complete a live session until the user has taken another turn since
 * the proposal. Test/preview bypasses. The turn-cap forced completion is a
 * direct state transition (not a tool) and is unaffected — covered elsewhere.
 */

import { describe, it, expect } from 'vitest';
import { countUserTurns, confirmationSatisfied } from '@/engine/tools/finalizeGuard';
import { proposeSummaryTool } from '@/engine/tools/impls/proposeSummary';
import { endSessionTool } from '@/engine/tools/impls/endSession';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';
import type { Message } from '@/types/db';
import type { ToolExecuteContext } from '@/engine/tools/types';

function msg(role: 'user' | 'assistant', content: string): Message {
  return { role, content, timestamp: '2026-01-01T00:00:00.000Z' } as Message;
}

function state(over: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    status: 'active',
    isTest: false,
    conversationHistory: [msg('user', 'hi'), msg('assistant', 'hello')],
    metadata: {},
    ...over,
  } as unknown as AdaSessionState;
}

function ctx(s: AdaSessionState): ToolExecuteContext {
  return { state: s, clients: makeInMemoryClients() } as unknown as ToolExecuteContext;
}

describe('countUserTurns', () => {
  it('counts only user messages', () => {
    expect(
      countUserTurns([msg('user', 'a'), msg('assistant', 'b'), msg('user', 'c')]),
    ).toBe(2);
  });
});

describe('confirmationSatisfied', () => {
  it('false when no summary was proposed', () => {
    expect(confirmationSatisfied(state())).toBe(false);
  });

  it('false when proposed this same turn (no user turn since)', () => {
    // 1 user turn in history, proposal recorded at 1 → not satisfied.
    const s = state({
      conversationHistory: [msg('user', 'a')],
      metadata: { summary_proposed_at_user_turns: 1 },
    });
    expect(confirmationSatisfied(s)).toBe(false);
  });

  it('true once the user has taken a turn after the proposal', () => {
    // proposal recorded at 1; history now has 2 user turns → satisfied.
    const s = state({
      conversationHistory: [msg('user', 'a'), msg('assistant', 'b'), msg('user', 'c')],
      metadata: { summary_proposed_at_user_turns: 1 },
    });
    expect(confirmationSatisfied(s)).toBe(true);
  });
});

describe('propose_summary tool', () => {
  it('records the current user-turn count and a timestamp, without completing', async () => {
    const s = state({ conversationHistory: [msg('user', 'a'), msg('user', 'b')] });
    const res = await proposeSummaryTool.execute(ctx(s), { summary: 'here is what I found' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.stateChanges?.metadataPatch?.summary_proposed_at_user_turns).toBe(2);
      expect(res.stateChanges?.metadataPatch?.summary_proposed_at).toBeTruthy();
      expect(res.stateChanges?.sessionTransition).toBeUndefined(); // does NOT complete
    }
  });
});

describe('end_session gate', () => {
  it('refuses on a live session that has not confirmed a summary', async () => {
    const res = await endSessionTool.execute(ctx(state()), {
      outcome: 'no_ada_issue',
      summary: 'x',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/propose_summary/);
  });

  it('completes once the user has confirmed after a proposal', async () => {
    const s = state({
      conversationHistory: [msg('user', 'a'), msg('assistant', 'summary?'), msg('user', 'yes')],
      metadata: { summary_proposed_at_user_turns: 1 },
    });
    const res = await endSessionTool.execute(ctx(s), { outcome: 'referred_to_doj', summary: 'x' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.stateChanges?.sessionTransition).toBe('complete');
  });

  it('bypasses the gate for a test/preview session', async () => {
    const res = await endSessionTool.execute(ctx(state({ isTest: true })), {
      outcome: 'no_ada_issue',
      summary: 'x',
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.stateChanges?.sessionTransition).toBe('complete');
  });
});
