/**
 * Unit — firm record view (test-first, /plan Phase A).
 * toAccountFirm must surface the firm's own public fields (website,
 * description, coverage) so the portal Firm page can show the firm record.
 */

import { describe, it, expect } from 'vitest';
import { toAccountFirm } from '@/engine/portal/accountView';
import type { LawFirmRow } from '@/engine/clients/types';

const firm: LawFirmRow = {
  id: 'f1',
  orgId: 'o1',
  name: 'The Spinal Cord Injury Law Firm',
  primaryContact: 'Kelley Brooks Simoneaux',
  email: 'info@firm.com',
  phone: '1-877-724-3476',
  stripeCustomerId: null,
  status: 'active',
  isPilot: true,
  websiteUrl: 'https://spinalcordinjurylawyers.com',
  description: 'A boutique national disability-rights practice.',
  logoUrl: null,
  locationCity: 'Washington',
  locationState: 'DC',
  additionalStates: ['VA', 'MD'],
  servesNationwide: true,
};

describe('toAccountFirm', () => {
  it('exposes the firm public-face fields', () => {
    const v = toAccountFirm(firm);
    expect(v.website_url).toBe('https://spinalcordinjurylawyers.com');
    expect(v.description).toBe('A boutique national disability-rights practice.');
    expect(v.location_city).toBe('Washington');
    expect(v.location_state).toBe('DC');
    expect(v.additional_states).toEqual(['VA', 'MD']);
    expect(v.serves_nationwide).toBe(true);
  });

  it('defaults coverage safely when unset', () => {
    const bare = { ...firm, additionalStates: undefined, servesNationwide: undefined, websiteUrl: undefined };
    const v = toAccountFirm(bare as LawFirmRow);
    expect(v.additional_states).toEqual([]);
    expect(v.serves_nationwide).toBe(false);
    expect(v.website_url).toBeNull();
  });
});
