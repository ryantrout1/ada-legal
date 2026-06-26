/**
 * Pipeline board move logic (Phase 4a; 5-stage rework Phase 5 §7.4/§7.5).
 *
 * The board is a view over the same cases and the same state machine — it never
 * defines its own transitions. These pure helpers map case status to a board
 * column and a board gesture (a forward drag, or a pick from the keyboard
 * move-menu) to one of the firm transitions `transitionCaseForFirm` enforces.
 * Anything the state machine wouldn't allow returns null / is absent.
 */

import type { CaseStatus, CaseTransition } from './caseStateMachine.js';

export const BOARD_COLUMNS = ['new', 'investigating', 'demand_sent', 'negotiating', 'resolved'] as const;
export type BoardColumn = (typeof BOARD_COLUMNS)[number];

export const COLUMN_LABEL: Record<BoardColumn, string> = {
  new: 'New',
  investigating: 'Investigating',
  demand_sent: 'Demand sent',
  negotiating: 'Negotiating',
  resolved: 'Resolved',
};

/** Which board column a status sits in. null = not shown (declined / reclaimed). */
export function columnForStatus(status: CaseStatus): BoardColumn | null {
  switch (status) {
    case 'new':
      return 'new';
    case 'investigating':
      return 'investigating';
    case 'demand_sent':
      return 'demand_sent';
    case 'negotiating':
      return 'negotiating';
    case 'resolved':
    case 'closed':
      return 'resolved';
    default:
      return null;
  }
}

/**
 * The transition implied by dragging a card from its current status into a
 * target column. Forward single-step moves thread the pipeline; an active case
 * may also be dragged straight to Resolved. Skip-ahead and backward drags
 * return null (the card snaps back).
 */
export function dragTransition(from: CaseStatus, to: BoardColumn): CaseTransition | null {
  if (from === 'new' && to === 'investigating') return 'accept';
  if (from === 'investigating' && to === 'demand_sent') return 'send_demand';
  if (from === 'demand_sent' && to === 'negotiating') return 'begin_negotiation';
  if (
    to === 'resolved' &&
    (from === 'investigating' || from === 'demand_sent' || from === 'negotiating')
  ) {
    return 'resolve';
  }
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
    case 'investigating':
      return [
        { transition: 'send_demand', label: 'Send demand', isResolve: false, isDecline: false },
        { transition: 'resolve', label: 'Resolve', isResolve: true, isDecline: false },
        { transition: 'decline', label: 'Decline', isResolve: false, isDecline: true },
      ];
    case 'demand_sent':
      return [
        { transition: 'begin_negotiation', label: 'Begin negotiation', isResolve: false, isDecline: false },
        { transition: 'resolve', label: 'Resolve', isResolve: true, isDecline: false },
      ];
    case 'negotiating':
      return [{ transition: 'resolve', label: 'Resolve', isResolve: true, isDecline: false }];
    default:
      return [];
  }
}
