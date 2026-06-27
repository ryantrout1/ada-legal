/**
 * Offboard an attorney from a firm (/plan Phase C).
 * Reclaim assigned cases → archive + unbind → audit. Firm-scoped.
 * An offboarded (archived) row must not re-bind if that person signs in.
 */
import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { CreateAttorneyInput } from '@/engine/clients/types';

const ORG = '00000000-0000-4000-8000-000000000001';
const FIRM = '00000000-0000-4000-8000-0000000000f1';

function make(overrides: Partial<CreateAttorneyInput> = {}): CreateAttorneyInput {
  return {
    orgId: ORG,
    lawFirmId: FIRM,
    firmRole: 'member',
    name: 'Josh Tester',
    firmName: 'Test Firm',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    practiceAreas: ['accessibility'],
    additionalStates: [],
    specialtyTags: [],
    email: 'josh@example.com',
    phone: null,
    websiteUrl: null,
    bio: null,
    photoUrl: null,
    status: 'approved',
    ...overrides,
  };
}

const actor = { actorUserId: null, actorEmail: 'owner@example.com' };

describe('offboardAttorneyFromFirm', () => {
  it('archives, unbinds, reclaims cases, and audits', async () => {
    const clients = makeInMemoryClients();
    const a = await clients.db.createAttorney(make());
    (a as { userId?: string | null }).userId = 'user-josh'; // simulate a bound login
    // a live case assigned to them
    (clients.db as unknown as { cases: unknown[] }).cases.push({
      id: 'case-1',
      firmId: FIRM,
      assignedLawyerId: a.id,
      status: 'working',
    });

    const res = await clients.db.offboardAttorneyFromFirm(a.id, FIRM, actor);
    expect(res).not.toBeNull();
    expect(res!.attorney.status).toBe('archived');
    expect(res!.attorney.userId ?? null).toBeNull();
    expect(res!.reclaimedCount).toBe(1);

    const theCase = (clients.db as unknown as { cases: { assignedLawyerId: string | null }[] }).cases[0];
    expect(theCase.assignedLawyerId).toBeNull();

    const audit = clients.db.__testAuditLog.find((e) => e.action === 'attorney.offboarded');
    expect(audit?.resourceId).toBe(a.id);
  });

  it('refuses an attorney in another firm (returns null)', async () => {
    const clients = makeInMemoryClients();
    const a = await clients.db.createAttorney(make());
    const res = await clients.db.offboardAttorneyFromFirm(a.id, 'someone-elses-firm', actor);
    expect(res).toBeNull();
  });

  it('an archived row no longer binds if that person signs in', async () => {
    const clients = makeInMemoryClients();
    const a = await clients.db.createAttorney(make({ email: 'rebind@example.com' }));
    expect(await clients.db.listUnboundAttorneysByEmail('rebind@example.com')).toHaveLength(1);
    await clients.db.offboardAttorneyFromFirm(a.id, FIRM, actor);
    expect(await clients.db.listUnboundAttorneysByEmail('rebind@example.com')).toHaveLength(0);
  });
});
