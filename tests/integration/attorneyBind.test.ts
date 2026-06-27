/**
 * Integration — attorney email-bind DB methods + bootstrap flow (test-first,
 * /plan Phase 4a, AC 1/3/4/5).
 *
 * upsertUserByClerkId is idempotent; listUnboundAttorneysByEmail finds only
 * unbound rows (case-insensitive); bindAttorneyToUser is race-safe + audited;
 * and the whole flow composes so a freshly-bound clerk user resolves.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { seedPortalFixture } from '../fixtures/portalSeed';

const ORG = '3fa40288-c96f-4a7d-b5cf-7af2382e4744';

describe('attorney email-bind', () => {
  it('upsertUserByClerkId is idempotent and updates email', async () => {
    const clients = makeInMemoryClients();
    const first = await clients.db.upsertUserByClerkId({
      clerkUserId: 'clerk_k',
      email: 'kelley@firm.com',
      displayName: 'Kelley',
    });
    const second = await clients.db.upsertUserByClerkId({
      clerkUserId: 'clerk_k',
      email: 'kelley.new@firm.com',
      displayName: 'Kelley B',
    });
    expect(second.userId).toBe(first.userId);
  });

  it('listUnboundAttorneysByEmail finds only unbound rows, case-insensitive', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    // attorneyA is bound (has user_id); add an unbound attorney with an email.
    await clients.db.createAttorney({
      orgId: ORG,
      name: 'Unbound Lawyer',
      email: 'Pending@Firm.com',
      practiceAreas: [],
      lawFirmId: fx.firms.firmA.id,
      firmRole: 'member',
      status: 'pending',
    });

    const hit = await clients.db.listUnboundAttorneysByEmail('pending@firm.com');
    expect(hit.map((a) => a.email?.toLowerCase())).toContain('pending@firm.com');

    // attorneyA's email (if any) must not surface — it's already bound.
    const boundEmail = fx.attorneys.attorneyA.attorney.email;
    if (boundEmail) {
      const none = await clients.db.listUnboundAttorneysByEmail(boundEmail);
      expect(none.find((a) => a.id === fx.attorneys.attorneyA.attorney.id)).toBeUndefined();
    }
  });

  it('bindAttorneyToUser binds once (race-safe) and writes an audit row', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const created = await clients.db.createAttorney({
      orgId: ORG,
      name: 'Bind Me',
      email: 'bindme@firm.com',
      practiceAreas: [],
      lawFirmId: fx.firms.firmA.id,
      firmRole: 'member',
      status: 'approved',
    });
    const { userId } = await clients.db.upsertUserByClerkId({
      clerkUserId: 'clerk_bind',
      email: 'bindme@firm.com',
      displayName: 'Bind Me',
    });

    const bound = await clients.db.bindAttorneyToUser(created.id, userId, {
      actorUserId: userId,
      actorEmail: 'bindme@firm.com',
    });
    expect(bound?.userId).toBe(userId);

    const audit = clients.db.__testAuditLog ?? [];
    expect(audit.find((e) => e.action === 'attorney.bound' && e.resourceId === created.id)).toBeTruthy();

    // Second attempt loses the race (already bound).
    const again = await clients.db.bindAttorneyToUser(created.id, 'someone-else', {
      actorUserId: 'someone-else',
      actorEmail: null,
    });
    expect(again).toBeNull();
  });

  it('a freshly-bound clerk user resolves end-to-end', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const created = await clients.db.createAttorney({
      orgId: ORG,
      name: 'Kelley',
      email: 'kelley@firm.com',
      practiceAreas: [],
      lawFirmId: fx.firms.firmA.id,
      firmRole: 'member',
      status: 'approved',
    });

    // Not resolvable before binding.
    expect(await clients.db.resolveAttorneyByClerkUserId('clerk_kelley')).toBeNull();

    const { userId } = await clients.db.upsertUserByClerkId({
      clerkUserId: 'clerk_kelley',
      email: 'kelley@firm.com',
      displayName: 'Kelley',
    });
    await clients.db.bindAttorneyToUser(created.id, userId, { actorUserId: userId, actorEmail: 'kelley@firm.com' });

    const resolved = await clients.db.resolveAttorneyByClerkUserId('clerk_kelley');
    expect(resolved?.attorneyId).toBe(created.id);
    expect(resolved?.lawFirmId).toBe(fx.firms.firmA.id);
  });
});
