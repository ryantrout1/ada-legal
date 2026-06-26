/**
 * Layer 1 tests for the case state machine (5-stage lifecycle, Phase 5 §7.5).
 *
 * The case state machine is the only place `cases.status` may be mutated.
 * Contract: new → investigating → demand_sent → negotiating → resolved, plus
 * decline/reclaim/re-route paths that keep a passed/abandoned case from
 * dead-ending. Encodes acceptance criterion 2 from /plan Phase 0.
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
    ['new', 'accept', 'investigating'],
    ['new', 'decline', 'declined'],
    ['new', 'close', 'closed'],
    ['investigating', 'send_demand', 'demand_sent'],
    ['investigating', 'decline', 'declined'],
    ['investigating', 'reclaim', 'reclaimed'],
    ['investigating', 'resolve', 'resolved'],
    ['demand_sent', 'begin_negotiation', 'negotiating'],
    ['demand_sent', 'reclaim', 'reclaimed'],
    ['demand_sent', 'resolve', 'resolved'],
    ['negotiating', 'resolve', 'resolved'],
    ['negotiating', 'reclaim', 'reclaimed'],
    ['declined', 'reroute', 'new'],
    ['reclaimed', 'reroute', 'new'],
  ])('%s → %s via %s', (from, transition, expected) => {
    expect(applyCaseTransition(from, transition)).toBe(expected);
  });

  it.each<[CaseStatus, CaseTransition]>([
    ['negotiating', 'accept'],
    ['new', 'send_demand'],
    ['new', 'begin_negotiation'],
    ['investigating', 'begin_negotiation'],
    ['demand_sent', 'accept'],
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
    ['investigating', false],
    ['demand_sent', false],
    ['negotiating', false],
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
    ['new', 'send_demand', false],
    ['negotiating', 'resolve', true],
    ['resolved', 'reclaim', false],
  ])('canTransitionCase(%s, %s) = %s', (from, transition, expected) => {
    expect(canTransitionCase(from, transition)).toBe(expected);
  });
});
