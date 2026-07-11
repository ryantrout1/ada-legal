/**
 * Unit — firmCoversState (routing rebuild R4 pool jurisdiction filter).
 *
 * A firm sees a pool case only when it covers the case's state: nationwide, or
 * home state, or an additional state. A null/blank case state is visible to
 * everyone (nothing to filter on). Case-insensitive.
 */

import { describe, it, expect } from 'vitest';
import { firmCoversState } from '@/engine/routing/poolVisibility';
import type { LawFirmRow } from '@/engine/clients/types';

function firm(over: Partial<LawFirmRow> = {}): LawFirmRow {
  return {
    id: 'f',
    name: 'Firm',
    status: 'active',
    isPilot: true,
    stripeCustomerId: null,
    locationState: 'AZ',
    additionalStates: [],
    servesNationwide: false,
    ...over,
  } as unknown as LawFirmRow;
}

describe('firmCoversState', () => {
  it('nationwide firm covers any state', () => {
    expect(firmCoversState(firm({ servesNationwide: true, locationState: 'AZ' }), 'TX')).toBe(true);
  });

  it('covers its home state', () => {
    expect(firmCoversState(firm({ locationState: 'AZ' }), 'AZ')).toBe(true);
  });

  it('covers an additional state', () => {
    expect(firmCoversState(firm({ locationState: 'AZ', additionalStates: ['NV', 'CA'] }), 'CA')).toBe(true);
  });

  it('does NOT cover an uncovered state', () => {
    expect(firmCoversState(firm({ locationState: 'AZ', additionalStates: ['NV'] }), 'TX')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(firmCoversState(firm({ locationState: 'az' }), 'AZ')).toBe(true);
    expect(firmCoversState(firm({ additionalStates: ['ca'] }), 'CA')).toBe(true);
  });

  it('a null case state is visible to everyone', () => {
    expect(firmCoversState(firm({ locationState: 'AZ' }), null)).toBe(true);
  });

  it('a blank case state is visible to everyone', () => {
    expect(firmCoversState(firm({ locationState: 'AZ' }), '   ')).toBe(true);
  });
});
