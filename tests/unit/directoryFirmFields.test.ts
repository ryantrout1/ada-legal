/**
 * Public attorney directory sources practice areas + website from the FIRM
 * (post firm/attorney split the attorney columns are empty). /plan Phase D-1.
 */
import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { CreateAttorneyInput, LawFirmRow } from '@/engine/clients/types';

const ORG = '00000000-0000-4000-8000-000000000001';
const FIRM = '00000000-0000-4000-8000-0000000000f1';

const firm: LawFirmRow = {
  id: FIRM,
  orgId: ORG,
  name: 'The Spinal Cord Injury Law Firm',
  primaryContact: null,
  email: 'info@firm.com',
  phone: null,
  stripeCustomerId: null,
  status: 'active',
  isPilot: true,
  websiteUrl: 'https://firm.example',
  practiceAreas: ['ada', 'transportation'],
  additionalStates: [],
  servesNationwide: false,
};

function attorney(overrides: Partial<CreateAttorneyInput> = {}): CreateAttorneyInput {
  return {
    orgId: ORG,
    lawFirmId: FIRM,
    name: 'Kelley',
    firmName: 'The Spinal Cord Injury Law Firm',
    locationCity: 'Washington',
    locationState: 'DC',
    practiceAreas: [], // cleared post-split — firm holds them now
    additionalStates: [],
    specialtyTags: [],
    email: 'kelley@firm.com',
    phone: null,
    websiteUrl: null, // cleared post-split
    bio: null,
    photoUrl: null,
    status: 'approved',
    ...overrides,
  };
}

describe('directory sources practice areas + website from the firm', () => {
  it('searchAttorneys returns firm practice areas + website when attorney columns are empty', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm);
    await clients.db.createAttorney(attorney());

    const rows = await clients.db.searchAttorneys({ orgId: ORG });
    expect(rows).toHaveLength(1);
    expect(rows[0].practiceAreas).toEqual(['ada', 'transportation']);
    expect(rows[0].websiteUrl).toBe('https://firm.example');
  });

  it('practice-area filter matches on firm areas', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm);
    await clients.db.createAttorney(attorney());
    expect(await clients.db.searchAttorneys({ orgId: ORG, practiceAreas: ['ada'] })).toHaveLength(1);
    expect(await clients.db.searchAttorneys({ orgId: ORG, practiceAreas: ['employment'] })).toHaveLength(0);
  });

  it('facets derive practice areas from the firm', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm);
    await clients.db.createAttorney(attorney());
    const f = await clients.db.getAttorneyFacets();
    expect(f.practiceAreas).toEqual(['ada', 'transportation']);
    expect(f.states).toContain('DC');
  });

  it('falls back to attorney-level when there is no firm', async () => {
    const clients = makeInMemoryClients();
    await clients.db.createAttorney(
      attorney({ lawFirmId: null, practiceAreas: ['education'], websiteUrl: 'https://solo.example' }),
    );
    const rows = await clients.db.searchAttorneys({ orgId: ORG });
    expect(rows[0].practiceAreas).toEqual(['education']);
    expect(rows[0].websiteUrl).toBe('https://solo.example');
  });
});
