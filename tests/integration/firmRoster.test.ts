/**
 * Integration — firm roster + role resolution (test-first, /plan Phase 3.1).
 *
 * Encodes AC1-3: listAttorneysForFirm is firm-scoped, getAttorneyForFirm
 * refuses cross-firm reads (the owner's per-lawyer detail 404 path), and the
 * Clerk resolver carries firm_role through to the portal auth context.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { filterAccountPatch } from '@/engine/portal/accountBoundary';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('firm roster + role resolution', () => {
  it('listAttorneysForFirm returns only that firm’s attorneys', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const firmA = fx.firms.firmA.id;
    const aId = fx.attorneys.attorneyA.attorney.id;
    const bId = fx.attorneys.attorneyB.attorney.id;

    const roster = await clients.db.listAttorneysForFirm(firmA);
    const ids = roster.map((r) => r.id);
    expect(ids).toContain(aId);
    expect(ids).not.toContain(bId);
  });

  it('getAttorneyForFirm refuses cross-firm reads', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const firmA = fx.firms.firmA.id;
    const aId = fx.attorneys.attorneyA.attorney.id;
    const bId = fx.attorneys.attorneyB.attorney.id;

    const own = await clients.db.getAttorneyForFirm(aId, firmA);
    expect(own?.id).toBe(aId);

    const crossFirm = await clients.db.getAttorneyForFirm(bId, firmA);
    expect(crossFirm).toBeNull();
  });

  it('the Clerk resolver carries firm_role', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const clerkId = fx.attorneys.attorneyA.clerkUserId;

    const resolution = await clients.db.resolveAttorneyByClerkUserId(clerkId);
    expect(resolution).not.toBeNull();
    expect(resolution?.firmRole).toBe('member');
  });

  it('firm edits are owner-only (member blocked writes nothing, owner persists)', async () => {
    // Mirrors the role gate in api/portal/account.ts PATCH.
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const firmId = fx.firms.firmA.id;

    const applyFirmEdit = async (firmRole: string, patch: Record<string, unknown>) => {
      const result = filterAccountPatch({ firm: patch });
      if (!result.ok) return 'invalid';
      if (Object.keys(result.firmPatch).length > 0 && firmRole !== 'owner') return 'forbidden';
      const firm = await clients.db.readLawFirmById(firmId);
      if (firm) await clients.db.writeLawFirm({ ...firm, ...result.firmPatch });
      return 'ok';
    };

    const beforeName = (await clients.db.readLawFirmById(firmId))?.name;
    expect(await applyFirmEdit('member', { name: 'Member Rename' })).toBe('forbidden');
    expect((await clients.db.readLawFirmById(firmId))?.name).toBe(beforeName);

    expect(await applyFirmEdit('owner', { name: 'Owner Rename' })).toBe('ok');
    expect((await clients.db.readLawFirmById(firmId))?.name).toBe('Owner Rename');
  });
});
