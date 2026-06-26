/**
 * Integration — firm roster + role resolution (test-first, /plan Phase 3.1).
 *
 * Encodes AC1-3: listAttorneysForFirm is firm-scoped, getAttorneyForFirm
 * refuses cross-firm reads (the owner's per-lawyer detail 404 path), and the
 * Clerk resolver carries firm_role through to the portal auth context.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
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
});
