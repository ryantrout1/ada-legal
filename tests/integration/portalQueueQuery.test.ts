/**
 * Integration test — portal queue endpoint data-plane (criteria 2, 4, 6).
 *
 * Exercises the data plane behind GET /api/portal/queue + the case-detail
 * boundary by combining the auth resolution (resolveAttorneyContext) with the
 * firm-scoped reader methods, against the in-memory client. This is the
 * integration seam (auth → firm scope → join + gray-out) distinct from the
 * pure queue-logic unit test in tests/unit/portalQueueSelection.test.ts.
 *
 * Phase 3 fills this in (Phase 1 landed it.todo shells).
 *
 * Ref: .design/attorney-portal.md Phase 3; risk register (auth boundary).
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { resolveAttorneyContext } from '../../api/_attorney';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('portal queue endpoint data-plane (auth → firm scope → join)', () => {
  it('an attorney sees their firm queue resolved purely from their Clerk identity', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const ctx = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const queue = await clients.db.listPortalQueueForFirm(ctx!.lawFirmId);
    expect(queue.cases.map((c) => c.sessionId).sort()).toEqual(
      [...fx.sessions.sessionIds].sort(),
    );
  });

  it('an attorney at Firm A cannot retrieve a session assigned only to Firm B', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    // Litigation + session assigned ONLY to Firm B.
    const litB = await clients.db.createLitigation({
      orgId: fx.firms.firmB.orgId,
      kind: 'class',
      caseName: 'FirmB Only',
      slug: 'firmb-only-q',
      status: 'active',
    });
    await clients.db.replaceFirmAssignmentsForLitigation(litB.id, [fx.firms.firmB.id]);
    const firmBSessionId = '33330000-0000-4000-8000-0000000000c9';
    await clients.db.writeSession({
      state: {
        sessionId: firmBSessionId,
        orgId: fx.firms.firmB.orgId,
        sessionType: 'public_ada',
        status: 'active',
        readingLevel: 'standard',
        anonSessionId: '00000000-0000-4000-8000-0000000000ee',
        userId: null,
        listingId: null,
        litigationListingId: litB.id,
        conversationHistory: [],
        extractedFields: {},
        classification: null,
        metadata: {},
        accessibilitySettings: {},
        isTest: true,
      },
    });

    const ctxA = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);

    // Not in Firm A's queue.
    const queueA = await clients.db.listPortalQueueForFirm(ctxA!.lawFirmId);
    expect(queueA.cases.map((c) => c.sessionId)).not.toContain(firmBSessionId);

    // And not retrievable as a case detail by Firm A.
    const detail = await clients.db.getPortalCaseForFirm(firmBSessionId, ctxA!.lawFirmId);
    expect(detail).toBeNull();
  });

  it('assigning a firm to a litigation row surfaces its sessions in that firm queue (criterion 4)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    // A third firm, initially unassigned → empty queue.
    const FIRM_C = '11110000-0000-4000-8000-0000000000c1';
    await clients.db.writeLawFirm({
      id: FIRM_C,
      orgId: fx.firms.firmA.orgId,
      name: 'Firm C LLP',
      primaryContact: null,
      email: null,
      phone: null,
      stripeCustomerId: null,
      status: 'active',
      isPilot: false,
      createdAt: new Date(0).toISOString(),
    });
    const before = await clients.db.listPortalQueueForFirm(FIRM_C);
    expect(before.cases).toHaveLength(0);

    // Admin assigns Firm C to the shared litigation row (PUT semantics keep A+B).
    await clients.db.replaceFirmAssignmentsForLitigation(
      fx.litigation.litigationListingId,
      [...fx.litigation.assignedFirmIds, FIRM_C],
    );

    const after = await clients.db.listPortalQueueForFirm(FIRM_C);
    expect(after.cases.map((c) => c.sessionId).sort()).toEqual(
      [...fx.sessions.sessionIds].sort(),
    );
  });

  it('respects firm_session_handled for gray-out across firms (criterion 6)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;

    await clients.db.markFirmSessionHandled(session1, fx.firms.firmB.id, null);

    const ctxA = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const queueA = await clients.db.listPortalQueueForFirm(ctxA!.lawFirmId, { handled: 'all' });
    const a1 = queueA.cases.find((c) => c.sessionId === session1)!;
    expect(a1.handledByOtherFirm).toBe(true);
    expect(a1.handledByThisFirm).toBe(false);
  });
});
