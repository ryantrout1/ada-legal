/**
 * Ada Spot — paid-session status machine.
 *
 * The lifecycle of a spot_session (the paid-report record):
 *
 *   pending_payment ──▶ paid ──▶ uploaded ──▶ in_review ──▶ delivered
 *                        │          │            │             │
 *                        └──────────┴────────────┴─────────────┴──▶ refunded
 *
 * Refund is reachable only once money has been captured (paid onward),
 * including after delivery (chargeback). A session in `pending_payment`
 * has no payment to refund — it simply expires/abandons, it never
 * transitions to refunded.
 *
 * Pure + deterministic. No DB, no I/O. The DB CHECK constraint on
 * spot_session.status is the storage-layer twin of SPOT_SESSION_STATUSES;
 * this module is the transition twin.
 */

export const SPOT_SESSION_STATUSES = [
  'pending_payment',
  'paid',
  'uploaded',
  'in_review',
  'delivered',
  'refunded',
] as const;

export type SpotSessionStatus = (typeof SPOT_SESSION_STATUSES)[number];

const TRANSITIONS: Record<SpotSessionStatus, readonly SpotSessionStatus[]> = {
  pending_payment: ['paid'],
  paid: ['uploaded', 'refunded'],
  uploaded: ['in_review', 'refunded'],
  in_review: ['delivered', 'refunded'],
  delivered: ['refunded'],
  refunded: [],
};

/** True iff `to` is a legal next status from `from`. Self-transitions are illegal. */
export function canTransition(from: SpotSessionStatus, to: SpotSessionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** True iff no further transition is possible. Only `refunded` is terminal. */
export function isTerminal(status: SpotSessionStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
