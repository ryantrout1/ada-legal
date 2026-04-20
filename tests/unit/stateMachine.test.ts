/**
 * Layer 1 tests for the session state machine.
 *
 * Covers every transition + every illegal transition. The state machine is
 * the only place ada_sessions.status may be mutated (docs/DO_NOT_TOUCH.md
 * rule 2), so this file is the contract test for that invariant.
 */

import { describe, it, expect } from 'vitest';
import {
  applyTransition,
  canTransition,
  IllegalTransitionError,
  isTerminal,
} from '@/engine/session/stateMachine';
import type { SessionStatus } from '@/engine/types';

describe('applyTransition', () => {
  it('active → completed via complete', () => {
    expect(applyTransition('active', 'complete')).toBe('completed');
  });

  it('active → abandoned via abandon', () => {
    expect(applyTransition('active', 'abandon')).toBe('abandoned');
  });

  it('rejects complete on completed (terminal)', () => {
    expect(() => applyTransition('completed', 'complete')).toThrow(IllegalTransitionError);
  });

  it('rejects abandon on completed (terminal)', () => {
    expect(() => applyTransition('completed', 'abandon')).toThrow(IllegalTransitionError);
  });

  it('rejects complete on abandoned (terminal)', () => {
    expect(() => applyTransition('abandoned', 'complete')).toThrow(IllegalTransitionError);
  });

  it('rejects abandon on abandoned (terminal)', () => {
    expect(() => applyTransition('abandoned', 'abandon')).toThrow(IllegalTransitionError);
  });

  it('IllegalTransitionError exposes from + transition', () => {
    try {
      applyTransition('completed', 'abandon');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(IllegalTransitionError);
      const err = e as IllegalTransitionError;
      expect(err.from).toBe('completed');
      expect(err.transition).toBe('abandon');
    }
  });
});

describe('isTerminal', () => {
  it.each<[SessionStatus, boolean]>([
    ['active', false],
    ['completed', true],
    ['abandoned', true],
  ])('isTerminal(%s) = %s', (status, expected) => {
    expect(isTerminal(status)).toBe(expected);
  });
});

describe('canTransition', () => {
  it.each<[SessionStatus, 'complete' | 'abandon', boolean]>([
    ['active', 'complete', true],
    ['active', 'abandon', true],
    ['completed', 'complete', false],
    ['completed', 'abandon', false],
    ['abandoned', 'complete', false],
    ['abandoned', 'abandon', false],
  ])('canTransition(%s, %s) = %s', (from, transition, expected) => {
    expect(canTransition(from, transition)).toBe(expected);
  });
});
