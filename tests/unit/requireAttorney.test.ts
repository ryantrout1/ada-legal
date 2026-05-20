/**
 * Unit test — attorney portal auth resolution (criterion 1 boundary).
 *
 * Tests resolveAttorneyContext (the testable core of requireAttorney) against
 * the in-memory client: the success context shape, firm isolation, and the
 * miss path (no paired attorney → null, which the HTTP wrapper maps to 403).
 *
 * The thin Clerk-token-verification wrapper (requireAttorney) mirrors the
 * audited api/_admin.ts path and is exercised end-to-end by the Phase 4
 * Playwright persona; the security-bearing resolution logic is here.
 *
 * Ref: .design/attorney-portal.md (requireAttorney contract; Phase 3).
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { resolveAttorneyContext } from '../../api/_attorney';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('resolveAttorneyContext', () => {
  it('returns the full auth context for a paired attorney', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const ctx = await resolveAttorneyContext(clients.db, 'clerk_user_a', 'fallback@x.com');
    expect(ctx).not.toBeNull();
    expect(ctx!.attorneyId).toBe(fx.attorneys.attorneyA.attorney.id);
    expect(ctx!.clerkUserId).toBe('clerk_user_a');
    expect(ctx!.lawFirmId).toBe(fx.firms.firmA.id);
    expect(typeof ctx!.userId).toBe('string');
  });

  it('scopes each attorney to their own firm (no cross-firm leak)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const a = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const b = await resolveAttorneyContext(clients.db, 'clerk_user_b', null);
    expect(a!.lawFirmId).toBe(fx.firms.firmA.id);
    expect(b!.lawFirmId).toBe(fx.firms.firmB.id);
    expect(a!.lawFirmId).not.toBe(b!.lawFirmId);
  });

  it('falls back to the Clerk email when the attorney record has none', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);

    const ctx = await resolveAttorneyContext(clients.db, 'clerk_user_a', 'clerk@example.com');
    expect(ctx!.email).toBe('clerk@example.com');
  });

  it('returns null for a Clerk user with no paired attorney (→ 403 not-onboarded)', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);

    const ctx = await resolveAttorneyContext(clients.db, 'clerk_nobody', null);
    expect(ctx).toBeNull();
  });
});
