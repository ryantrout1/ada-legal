/**
 * Integration — firm ownership writes (test-first, /plan Phase 3.2, AC5-6).
 *
 * setAttorneyFirmRole changes the role and writes an audit row; provisioning
 * a lawyer by email creates a pending, unbound member in the firm.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('firm ownership writes', () => {
  it('setAttorneyFirmRole changes the role and writes an audit row', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const aId = fx.attorneys.attorneyA.attorney.id;

    const updated = await clients.db.setAttorneyFirmRole(aId, 'owner', {
      actorUserId: 'actor-1',
      actorEmail: 'owner@firm.com',
    });
    expect(updated?.firmRole).toBe('owner');

    const audit = clients.db.__testAuditLog ?? [];
    const entry = audit.find((e) => e.action === 'attorney.firm_role_changed');
    expect(entry).toBeTruthy();
    expect(entry?.resourceId).toBe(aId);
    expect(entry?.metadata.to).toBe('owner');
  });

  it('provisioning a lawyer by email creates a pending unbound member', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const firmId = fx.firms.firmA.id;
    const firm = await clients.db.readLawFirmById(firmId);

    const created = await clients.db.createAttorney({
      orgId: firm!.orgId,
      name: 'New Lawyer',
      email: 'new.lawyer@firm.com',
      practiceAreas: [],
      lawFirmId: firmId,
      firmRole: 'member',
      status: 'pending',
    });

    expect(created.status).toBe('pending');
    expect(created.firmRole).toBe('member');
    expect(created.userId ?? null).toBeNull();

    const roster = await clients.db.listAttorneysForFirm(firmId);
    expect(roster.map((r) => r.email)).toContain('new.lawyer@firm.com');
  });
});
