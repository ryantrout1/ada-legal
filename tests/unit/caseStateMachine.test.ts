/**
 * Layer 1 tests for the case state machine.
 *
 * The case state machine is the only place `cases.status` may be mutated —
 * the same discipline docs/DO_NOT_TOUCH.md rule 2 imposes on
 * ada_sessions.status. This file is the contract test for the worked-case
 * lifecycle: new → accepted/declined/closed → working → resolved, plus the
 * reclaim + re-route paths that keep a passed/abandoned case from dead-ending.
 *
 * Encodes acceptance criterion 2 from /plan Phase 0 (CHECK/transition
 * enforcement: invalid transitions are rejected).
 */

import { describe, it, expect } from 'vitest';
import {
  applyCaseTransition,
  canTransitionCase,
  isCaseTerminal,
  IllegalCaseTransitionError,
} from '@/engine/cases/caseStateMachine';
import type { CaseStatus, CaseTransition } from '@/engine/cases/caseStateMachine';

describe('applyCaseTransition', () => {
  it.each<[CaseStatus, CaseTransition, CaseStatus]>([
    ['new', 'accept', 'accepted'],
    ['new', 'decline', 'declined'],
    ['new', 'close', 'closed'],
    ['accepted', 'begin_work', 'working'],
    ['accepted', 'decline', 'declined'],
    ['accepted', 'reclaim', 'reclaimed'],
    ['working', 'resolve', 'resolved'],
    ['working', 'reclaim', 'reclaimed'],
    ['declined', 'reroute', 'new'],
    ['reclaimed', 'reroute', 'new'],
  ])('%s → %s via %s', (from, transition, expected) => {
    expect(applyCaseTransition(from, transition)).toBe(expected);
  });

  it.each<[CaseStatus, CaseTransition]>([
    ['working', 'accept'],
    ['new', 'begin_work'],
    ['accepted', 'resolve'],
    ['working', 'close'],
    ['new', 'reclaim'],
    ['resolved', 'reclaim'],
    ['closed', 'reroute'],
    ['resolved', 'resolve'],
  ])('rejects %s via %s', (from, transition) => {
    expect(() => applyCaseTransition(from, transition)).toThrow(IllegalCaseTransitionError);
  });

  it('IllegalCaseTransitionError exposes from + transition', () => {
    try {
      applyCaseTransition('resolved', 'reclaim');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(IllegalCaseTransitionError);
      const err = e as IllegalCaseTransitionError;
      expect(err.from).toBe('resolved');
      expect(err.transition).toBe('reclaim');
    }
  });
});

describe('isCaseTerminal', () => {
  it.each<[CaseStatus, boolean]>([
    ['new', false],
    ['accepted', false],
    ['working', false],
    ['declined', false],
    ['reclaimed', false],
    ['resolved', true],
    ['closed', true],
  ])('isCaseTerminal(%s) = %s', (status, expected) => {
    expect(isCaseTerminal(status)).toBe(expected);
  });
});

describe('canTransitionCase', () => {
  it.each<[CaseStatus, CaseTransition, boolean]>([
    ['new', 'accept', true],
    ['new', 'begin_work', false],
    ['working', 'resolve', true],
    ['resolved', 'reclaim', false],
  ])('canTransitionCase(%s, %s) = %s', (from, transition, expected) => {
    expect(canTransitionCase(from, transition)).toBe(expected);
  });
});
