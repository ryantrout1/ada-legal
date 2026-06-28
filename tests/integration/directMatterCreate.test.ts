/**
 * Integration test — direct (self-originated) matter creation.
 *
 * The data-plane seam behind POST /api/portal/cases: auth resolution
 * (resolveAttorneyContext) → createDirectCase → firm-scoped reads. Confirms a
 * matter an attorney creates for themselves lands in their own firm queue with
 * the client name and stays invisible to other firms. Runs against the
 * in-memory client (mirrors the Neon methods); no live DB needed.
 *
 * Encodes /plan "Add a matter" Phase 1 — acceptance criteria 2, 4.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { resolveAttorneyContext } from '../../api/_attorney';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('direct matter creation (auth → create → firm-scoped read)', () => {
  it('an attorney creates a self-originated matter that lands in their firm queue with the client name', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);

    const ctx = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const firm = await clients.db.readLawFirmById(ctx!.lawFirmId);

    const row = await clients.db.createDirectCase({
      orgId: firm!.orgId,
      firmId: ctx!.lawFirmId,
      assignedLawyerId: ctx!.attorneyId,
      createdBy: ctx!.userId,
      classificationTitle: 'Title III — parking',
      jurisdictionState: 'AZ',
      client: { name: 'Direct Client', email: 'direct@example.com' },
    });

    expect(row.lane).toBe('direct');
    expect(row.status).toBe('investigating');
    expect(row.assignedLawyerId).toBe(ctx!.attorneyId);

    const queue = await clients.db.listCasesForFirm(ctx!.lawFirmId);
    expect(
      queue.groups.working.some((c) => c.caseId === row.id && c.claimantName === 'Direct Client'),
    ).toBe(true);

    const detail = await clients.db.getCaseDetailForFirm(row.id, ctx!.lawFirmId);
    expect(detail!.claimantName).toBe('Direct Client');
  });

  it('a direct matter at firm A is not readable by firm B (the 404 boundary)', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);

    const ctxA = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const ctxB = await resolveAttorneyContext(clients.db, 'clerk_user_b', null);
    const firmA = await clients.db.readLawFirmById(ctxA!.lawFirmId);

    const row = await clients.db.createDirectCase({
      orgId: firmA!.orgId,
      firmId: ctxA!.lawFirmId,
      assignedLawyerId: ctxA!.attorneyId,
      createdBy: ctxA!.userId,
      client: { name: 'A Client' },
    });

    expect(await clients.db.getCaseDetailForFirm(row.id, ctxB!.lawFirmId)).toBeNull();
  });
});
