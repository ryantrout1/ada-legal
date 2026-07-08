/**
 * Tests the per-session turn cap resolver (§2 a3, /plan Phase 3).
 *
 * Every Ada endpoint is anonymous with no per-session turn cap. A stale
 * or abusive session could accept turns forever with unbounded history
 * (each turn re-sends the whole transcript to the model). This pure
 * resolver decides, from the prior conversation history, whether the
 * incoming turn crosses the cap and what wrap-up copy to show.
 *
 * Boundary: MAX_USER_TURNS is 60 and real completed sessions top out
 * around 56, so a legitimate user never hits it — the cap only fires on
 * runaway/abuse. "Prior history" is the transcript BEFORE the incoming
 * user message is appended: once it already holds 60 user turns, the
 * 61st is capped.
 *
 * Ref: /plan Phase 3 AC1.
 */

import { describe, it, expect } from 'vitest';
import type { Message } from '@/types/db';
import {
  evaluateTurnCap,
  countUserTurns,
  MAX_USER_TURNS,
} from '@/lib/turnCap';

function msg(role: 'user' | 'assistant', text: string): Message {
  return { role, content: text, timestamp: '2026-01-01T00:00:00.000Z' };
}

/** n user turns, each followed by an assistant reply. */
function transcript(userTurns: number): Message[] {
  const out: Message[] = [];
  for (let i = 0; i < userTurns; i++) {
    out.push(msg('user', `u${i}`));
    out.push(msg('assistant', `a${i}`));
  }
  return out;
}

describe('countUserTurns', () => {
  it('counts only user-role messages', () => {
    expect(countUserTurns([])).toBe(0);
    expect(countUserTurns(transcript(3))).toBe(3);
    expect(countUserTurns([msg('assistant', 'greeting')])).toBe(0);
  });
});

describe('evaluateTurnCap', () => {
  it('does not cap below the limit', () => {
    const d = evaluateTurnCap(transcript(MAX_USER_TURNS - 1));
    expect(d.capReached).toBe(false);
    expect(d.wrapUpMessage).toBe('');
  });

  it('caps once prior history already holds MAX_USER_TURNS user turns', () => {
    const d = evaluateTurnCap(transcript(MAX_USER_TURNS));
    expect(d.capReached).toBe(true);
    expect(d.wrapUpMessage.length).toBeGreaterThan(0);
  });

  it('stays capped beyond the limit', () => {
    expect(evaluateTurnCap(transcript(MAX_USER_TURNS + 5)).capReached).toBe(true);
  });

  it('an empty transcript is never capped', () => {
    expect(evaluateTurnCap([]).capReached).toBe(false);
  });

  it('MAX_USER_TURNS sits above the real-world completed-session ceiling (56)', () => {
    expect(MAX_USER_TURNS).toBeGreaterThan(56);
  });
});
