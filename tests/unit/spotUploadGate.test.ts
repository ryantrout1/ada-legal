import { describe, it, expect } from 'vitest';
import { canAcceptSpotUpload, MAX_PAID_PHOTOS } from '@/lib/spot/uploadGate';

describe('canAcceptSpotUpload', () => {
  it('caps the paid tier at 10 photos', () => {
    expect(MAX_PAID_PHOTOS).toBe(10);
  });

  it('refuses upload unless the session is paid (server-side gate)', () => {
    expect(canAcceptSpotUpload('pending_payment', 0)).toEqual({ ok: false, reason: 'not_paid' });
    expect(canAcceptSpotUpload(undefined, 0)).toEqual({ ok: false, reason: 'not_paid' });
    expect(canAcceptSpotUpload('refunded', 0)).toEqual({ ok: false, reason: 'not_paid' });
  });

  it('allows uploads on a paid session under the cap', () => {
    expect(canAcceptSpotUpload('paid', 0)).toEqual({ ok: true });
    expect(canAcceptSpotUpload('paid', 9)).toEqual({ ok: true });
  });

  it('refuses once the cap is reached', () => {
    expect(canAcceptSpotUpload('paid', 10)).toEqual({ ok: false, reason: 'limit_reached' });
    expect(canAcceptSpotUpload('paid', 11)).toEqual({ ok: false, reason: 'limit_reached' });
  });
});
