/**
 * Pipeline board move logic (Phase 4a).
 *
 * The board is a view over the same cases and the same state machine — it never
 * defines its own transitions. These pure helpers map case status to a board
 * column and a board gesture (a forward drag, or a pick from the keyboard
 * move-menu) to one of the firm transitions `transitionCaseForFirm` already
 * enforces. Anything the state machine wouldn't allow returns null / is absent.
 */

import type { CaseStatus, CaseTransition } from './caseStateMachine.js';

export const BOARD_COLUMNS = ['new', 'accepted', 'working', 'resolved'] as const;
export type BoardColumn = (typeof BOARD_COLUMNS)[number];

export const COLUMN_LABEL: Record<BoardColumn, string> = {
  new: 'New',
  accepted: 'Accepted',
  working: 'Working',
  resolved: 'Resolved',
};

/** Which board column a status sits in. null = not shown (declined / reclaimed). */
export function columnForStatus(status: CaseStatus): BoardColumn | null {
  switch (status) {
    case 'new':
      return 'new';
    case 'accepted':
      return 'accepted';
    case 'working':
      return 'working';
    case 'resolved':
    case 'closed':
      return 'resolved';
    default:
      return null;
  }
}

/**
 * The transition implied by dragging a card from its current status into a
 * target column. Only the three forward, single-step moves are valid; skip-ahead
 * and backward drags return null (the card snaps back).
 */
export function dragTransition(from: CaseStatus, to: BoardColumn): CaseTransition | null {
  if (from === 'new' && to === 'accepted') return 'accept';
  if (from === 'accepted' && to === 'working') return 'begin_work';
  if (from === 'working' && to === 'resolved') return 'resolve';
  return null;
}

export interface MoveOption {
  transition: CaseTransition;
  label: string;
  /** resolve needs a resolution type — the UI opens the resolution modal. */
  isResolve: boolean;
  /** decline needs a reason — the UI prompts before committing. */
  isDecline: boolean;
}

/**
 * The firm transitions available from a status, for the keyboard move-menu —
 * the mandatory no-drag alternative (WCAG 2.1.1 / 2.5.7). Mirrors the state
 * machine's firm-facing edges; terminal statuses offer nothing.
 */
export function moveOptions(status: CaseStatus): MoveOption[] {
  switch (status) {
    case 'new':
      return [
        { transition: 'accept', label: 'Accept', isResolve: false, isDecline: false },
        { transition: 'decline', label: 'Decline', isResolve: false, isDecline: true },
      ];
    case 'accepted':
      return [
        { transition: 'begin_work', label: 'Start work', isResolve: false, isDecline: false },
        { transition: 'decline', label: 'Decline', isResolve: false, isDecline: true },
      ];
    case 'working':
      return [{ transition: 'resolve', label: 'Resolve', isResolve: true, isDecline: false }];
    default:
      return [];
  }
}
