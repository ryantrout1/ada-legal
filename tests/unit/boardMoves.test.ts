/**
 * Layer 1 tests — pipeline board move logic (Phase 4a).
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
    expect(columnForStatus('accepted')).toBe('accepted');
    expect(columnForStatus('working')).toBe('working');
    expect(columnForStatus('resolved')).toBe('resolved');
    expect(columnForStatus('closed')).toBe('resolved');
  });
  it('returns null for off-board statuses', () => {
    expect(columnForStatus('declined')).toBeNull();
    expect(columnForStatus('reclaimed')).toBeNull();
  });
});

describe('dragTransition', () => {
  it('maps the three valid forward drags', () => {
    expect(dragTransition('new', 'accepted')).toBe('accept');
    expect(dragTransition('accepted', 'working')).toBe('begin_work');
    expect(dragTransition('working', 'resolved')).toBe('resolve');
  });
  it('rejects skip-ahead and backward drags', () => {
    expect(dragTransition('new', 'working')).toBeNull();
    expect(dragTransition('new', 'resolved')).toBeNull();
    expect(dragTransition('accepted', 'resolved')).toBeNull();
    expect(dragTransition('accepted', 'new')).toBeNull();
    expect(dragTransition('working', 'accepted')).toBeNull();
    expect(dragTransition('resolved', 'working')).toBeNull();
  });
});

describe('moveOptions', () => {
  it('offers accept + decline from new', () => {
    expect(moveOptions('new').map((o) => o.transition)).toEqual(['accept', 'decline']);
  });
  it('offers start-work + decline from accepted', () => {
    expect(moveOptions('accepted').map((o) => o.transition)).toEqual(['begin_work', 'decline']);
  });
  it('offers resolve (flagged) from working, and nothing terminal', () => {
    const w = moveOptions('working');
    expect(w.map((o) => o.transition)).toEqual(['resolve']);
    expect(w[0]!.isResolve).toBe(true);
    expect(moveOptions('resolved')).toEqual([]);
    expect(moveOptions('closed')).toEqual([]);
  });
  it('flags decline so the UI can require a reason', () => {
    expect(moveOptions('new').find((o) => o.transition === 'decline')!.isDecline).toBe(true);
  });
});

describe('BOARD_COLUMNS', () => {
  it('is the four active stages left to right', () => {
    expect(BOARD_COLUMNS).toEqual(['new', 'accepted', 'working', 'resolved']);
  });
});
