/**
 * Integration — portal account write path (/plan Phase 1, AC2-3).
 *
 * Mirrors the PATCH steps in api/portal/account.ts against the in-memory
 * client: filterAccountPatch -> updateAttorney(self) -> firm read-merge-write.
 * Asserts:
 *   - allowed edits (incl. capacity) persist on the caller's attorney
 *   - a second firm's attorney is untouched (firm-scope; the handler derives
 *     ids from the Clerk session, so there is no cross-firm reach)
 *   - firm display fields update while locked fields (status/is_pilot) survive
 *   - a sensitive field is rejected and nothing is written
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { filterAccountPatch } from '@/engine/portal/accountBoundary';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('portal account — write path', () => {
  it('persists allowed edits for the caller and leaves other firms untouched', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const aId = fx.attorneys.attorneyA.attorney.id;
    const bId = fx.attorneys.attorneyB.attorney.id;

    const r = filterAccountPatch({
      attorney: {
        name: 'Kelley S.',
        location_state: 'az',
        accepting_referrals: false,
        routing_paused: true,
        max_active_cases: '15',
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    await clients.db.updateAttorney(aId, r.attorneyPatch);

    const a = await clients.db.getAttorneyById(aId);
    expect(a?.name).toBe('Kelley S.');
    expect(a?.locationState).toBe('AZ');
    expect(a?.acceptingReferrals).toBe(false);
    expect(a?.routingPaused).toBe(true);
    expect(a?.maxActiveCases).toBe(15);

    // Firm-scope: attorney B (other firm) is unchanged.
    const b = await clients.db.getAttorneyById(bId);
    expect(b?.name).toBe(fx.attorneys.attorneyB.attorney.name);
    expect(b?.acceptingReferrals).toBe(true);
    expect(b?.routingPaused).toBe(false);
    expect(b?.maxActiveCases).toBeNull();
  });

  it('updates firm display fields while preserving locked fields', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const firmId = fx.firms.firmA.id;

    const before = await clients.db.readLawFirmById(firmId);
    expect(before).not.toBeNull();
    const lockedStatus = before!.status;
    const lockedPilot = before!.isPilot;

    const r = filterAccountPatch({ firm: { name: 'Renamed Firm', email: 'new@firm.com' } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const merged = { ...before!, ...r.firmPatch };
    await clients.db.writeLawFirm(merged);

    const after = await clients.db.readLawFirmById(firmId);
    expect(after?.name).toBe('Renamed Firm');
    expect(after?.email).toBe('new@firm.com');
    // Locked fields survive the read-merge-write.
    expect(after?.status).toBe(lockedStatus);
    expect(after?.isPilot).toBe(lockedPilot);
  });

  it('rejects a sensitive field and writes nothing', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const aId = fx.attorneys.attorneyA.attorney.id;
    const beforeStatus = (await clients.db.getAttorneyById(aId))?.status;

    const r = filterAccountPatch({ attorney: { name: 'x', status: 'approved' } });
    expect(r.ok).toBe(false);
    // Handler would 400 here; no updateAttorney call happens.

    const after = await clients.db.getAttorneyById(aId);
    expect(after?.status).toBe(beforeStatus);
    expect(after?.name).not.toBe('x');
  });
});
