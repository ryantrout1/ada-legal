/**
 * Layer 1 tests — pipeline board move logic (5-stage rework, Phase 5 §7.4).
 *
 * Pure mapping the board uses for both drag and the keyboard move-menu:
 * column-for-status, the transition a forward drag implies, and the firm
 * transitions offered from each status. The board never invents a move the
 * state machine wouldn't allow.
 */

import { describe, it, expect } from 'vitest';
import {
  BOARD_COLUMNS,
  columnForStatus,
  dragTransition,
  moveOptions,
} from '@/engine/cases/boardMoves';

describe('columnForStatus', () => {
  it('maps each status to its board column; closed folds into Resolved', () => {
    expect(columnForStatus('new')).toBe('new');
    expect(columnForStatus('investigating')).toBe('investigating');
    expect(columnForStatus('demand_sent')).toBe('demand_sent');
    expect(columnForStatus('negotiating')).toBe('negotiating');
    expect(columnForStatus('resolved')).toBe('resolved');
    expect(columnForStatus('closed')).toBe('resolved');
  });
  it('returns null for off-board statuses', () => {
    expect(columnForStatus('declined')).toBeNull();
    expect(columnForStatus('reclaimed')).toBeNull();
  });
});

describe('dragTransition', () => {
  it('maps the forward single-step drags', () => {
    expect(dragTransition('new', 'investigating')).toBe('accept');
    expect(dragTransition('investigating', 'demand_sent')).toBe('send_demand');
    expect(dragTransition('demand_sent', 'negotiating')).toBe('begin_negotiation');
    expect(dragTransition('negotiating', 'resolved')).toBe('resolve');
  });
  it('allows dragging any active stage straight to Resolved', () => {
    expect(dragTransition('investigating', 'resolved')).toBe('resolve');
    expect(dragTransition('demand_sent', 'resolved')).toBe('resolve');
  });
  it('rejects skip-ahead and backward drags', () => {
    expect(dragTransition('new', 'demand_sent')).toBeNull();
    expect(dragTransition('new', 'resolved')).toBeNull();
    expect(dragTransition('investigating', 'negotiating')).toBeNull();
    expect(dragTransition('investigating', 'new')).toBeNull();
    expect(dragTransition('resolved', 'negotiating')).toBeNull();
  });
});

describe('moveOptions', () => {
  it('offers accept + decline from new', () => {
    expect(moveOptions('new').map((o) => o.transition)).toEqual(['accept', 'decline']);
  });
  it('offers send-demand, resolve, decline from investigating', () => {
    expect(moveOptions('investigating').map((o) => o.transition)).toEqual([
      'send_demand',
      'resolve',
      'decline',
    ]);
  });
  it('offers begin-negotiation + resolve from demand_sent', () => {
    expect(moveOptions('demand_sent').map((o) => o.transition)).toEqual(['begin_negotiation', 'resolve']);
  });
  it('offers resolve (flagged) from negotiating, and nothing terminal', () => {
    const n = moveOptions('negotiating');
    expect(n.map((o) => o.transition)).toEqual(['resolve']);
    expect(n[0]!.isResolve).toBe(true);
    expect(moveOptions('resolved')).toEqual([]);
    expect(moveOptions('closed')).toEqual([]);
  });
  it('flags decline so the UI can require a reason', () => {
    expect(moveOptions('new').find((o) => o.transition === 'decline')!.isDecline).toBe(true);
  });
});

describe('BOARD_COLUMNS', () => {
  it('is the five pipeline stages left to right', () => {
    expect(BOARD_COLUMNS).toEqual(['new', 'investigating', 'demand_sent', 'negotiating', 'resolved']);
  });
});
