/**
 * Integration — bar_number flows through the account write path and feeds
 * go-live readiness (the same readiness the admin approve-gate reads).
 * Test-first for /plan Phase 2 (AC4).
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { filterAccountPatch } from '@/engine/portal/accountBoundary';
import { computeReadiness } from '@/engine/portal/accountReadiness';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('account readiness — bar_number + required fields', () => {
  it('is not ready while required fields are blank, ready once filled', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const aId = fx.attorneys.attorneyA.attorney.id;
    const firmId = fx.firms.firmA.id;

    // Force an incomplete profile.
    await clients.db.updateAttorney(aId, {
      barNumber: null,
      locationState: null,
      additionalStates: [],
      email: null,
    });

    let attorney = await clients.db.getAttorneyById(aId);
    let firm = await clients.db.readLawFirmById(firmId);
    const before = computeReadiness(attorney!, firm);
    expect(before.ready).toBe(false);
    expect(before.missing.map((m) => m.key)).toEqual(
      expect.arrayContaining(['bar_number', 'email', 'licensed_state']),
    );

    // Fill required attorney fields through the owner boundary (proves
    // bar_number is an allowed, persisted field end-to-end).
    const r = filterAccountPatch({
      attorney: { bar_number: 'AZ-99', location_state: 'az', email: 'a@firm.com' },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    await clients.db.updateAttorney(aId, r.attorneyPatch);

    attorney = await clients.db.getAttorneyById(aId);
    expect(attorney?.barNumber).toBe('AZ-99');

    // Ensure the firm carries name + email.
    firm = await clients.db.readLawFirmById(firmId);
    if (firm && !firm.email) {
      firm = { ...firm, email: 'firm@firm.com' };
      await clients.db.writeLawFirm(firm);
    }

    const after = computeReadiness(attorney!, firm);
    expect(after.ready).toBe(true);
  });
});
