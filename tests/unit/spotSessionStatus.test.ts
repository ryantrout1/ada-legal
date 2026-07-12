import { describe, it, expect } from 'vitest';
import {
  SPOT_SESSION_STATUSES,
  canTransition,
  isTerminal,
  type SpotSessionStatus,
} from '@/lib/spot/spotSessionStatus';

describe('spot_session status machine', () => {
  it('enumerates exactly the six statuses', () => {
    expect([...SPOT_SESSION_STATUSES].sort()).toEqual(
      ['delivered', 'in_review', 'paid', 'pending_payment', 'refunded', 'uploaded'].sort(),
    );
  });

  it('permits the forward lifecycle path', () => {
    expect(canTransition('pending_payment', 'paid')).toBe(true);
    expect(canTransition('paid', 'uploaded')).toBe(true);
    expect(canTransition('uploaded', 'in_review')).toBe(true);
    expect(canTransition('in_review', 'delivered')).toBe(true);
  });

  it('permits refund only after money is captured (paid onward), never from pending_payment', () => {
    expect(canTransition('paid', 'refunded')).toBe(true);
    expect(canTransition('uploaded', 'refunded')).toBe(true);
    expect(canTransition('in_review', 'refunded')).toBe(true);
    expect(canTransition('delivered', 'refunded')).toBe(true); // chargeback after delivery
    expect(canTransition('pending_payment', 'refunded')).toBe(false);
  });

  it('rejects illegal jumps and backward moves', () => {
    expect(canTransition('delivered', 'paid')).toBe(false);
    expect(canTransition('pending_payment', 'delivered')).toBe(false);
    expect(canTransition('paid', 'in_review')).toBe(false); // must pass through uploaded
    expect(canTransition('refunded', 'paid')).toBe(false);
  });

  it('rejects self-transitions (no idempotent self-loop at the machine layer)', () => {
    for (const s of SPOT_SESSION_STATUSES) {
      expect(canTransition(s as SpotSessionStatus, s as SpotSessionStatus)).toBe(false);
    }
  });

  it('marks only refunded as terminal (delivered can still be charged back)', () => {
    expect(isTerminal('refunded')).toBe(true);
    expect(isTerminal('delivered')).toBe(false);
    expect(isTerminal('pending_payment')).toBe(false);
  });
});
