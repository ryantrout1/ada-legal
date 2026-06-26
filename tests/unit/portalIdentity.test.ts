/**
 * Unit test — portal shell identity (Phase 5 §7.1).
 *
 * Tests loadPortalIdentity (the testable core behind GET /api/portal/me)
 * against the in-memory client: the attorney name + firm name the shell
 * renders, firm-scoping (each attorney sees their own firm), and the graceful
 * fallbacks that keep the shell rendering when a name/firm is missing.
 *
 * The thin HTTP wrapper (api/portal/me.ts) reuses requireAttorney, which is
 * already covered by tests/unit/requireAttorney.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import {
  resolveAttorneyContext,
  loadPortalIdentity,
  type AttorneyAuthContext,
} from '../../api/_attorney';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('loadPortalIdentity', () => {
  it('returns the attorney name + firm name for the shell', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const ctx = await resolveAttorneyContext(clients.db, 'clerk_user_a', 'a@x.com');
    const identity = await loadPortalIdentity(clients.db, ctx!);

    expect(identity.attorney.id).toBe(fx.attorneys.attorneyA.attorney.id);
    expect(identity.attorney.name).toBe(fx.attorneys.attorneyA.attorney.name);
    expect(identity.attorney.email).toBe('a@x.com');
    expect(identity.firm.id).toBe(fx.firms.firmA.id);
    expect(identity.firm.name).toBe(fx.firms.firmA.name);
  });

  it('scopes each attorney to their own firm (no cross-firm leak)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const a = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const b = await resolveAttorneyContext(clients.db, 'clerk_user_b', null);
    const idA = await loadPortalIdentity(clients.db, a!);
    const idB = await loadPortalIdentity(clients.db, b!);

    expect(idA.firm.name).toBe(fx.firms.firmA.name);
    expect(idB.firm.name).toBe(fx.firms.firmB.name);
    expect(idA.firm.name).not.toBe(idB.firm.name);
  });

  it('falls back gracefully when the firm/attorney lookups miss', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);

    // A context pointing at ids that don't resolve to rows — the shell must
    // still render rather than throw.
    const orphan: AttorneyAuthContext = {
      attorneyId: 'nope-attorney',
      userId: 'nope-user',
      clerkUserId: 'nope-clerk',
      lawFirmId: 'nope-firm',
      email: 'fallback@x.com',
    };
    const identity = await loadPortalIdentity(clients.db, orphan);

    expect(identity.attorney.name).toBe('fallback@x.com');
    expect(identity.firm.name).toBe('Your firm');
  });
});
