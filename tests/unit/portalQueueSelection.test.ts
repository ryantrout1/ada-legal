/**
 * Data-logic test — portal queue selection (criterion 2).
 *
 * Mirrors the existing in-memory-client pattern (tests/unit/adminFirmList.test.ts):
 * seed makeInMemoryClients via portalSeed, exercise listPortalQueueForFirm, and
 * assert firm-scoping, summary counts, and gray-out semantics. No React
 * rendering — the rendered DOM is covered by the Playwright persona (criterion 1).
 *
 * Phase 2 fills these bodies in (Phase 1 landed it.todo shells). The reader
 * method + new tables + portalSeed body all ship in Phase 2.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 2 (data infra).
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { seedPortalFixture } from '../fixtures/portalSeed';

const UNASSIGNED_FIRM = '99990000-0000-4000-8000-000000000999';

describe('listPortalQueueForFirm', () => {
  it('returns the sessions whose litigation row is assigned to this firm', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const queue = await clients.db.listPortalQueueForFirm(fx.firms.firmA.id);
    expect(queue.cases).toHaveLength(2);
    expect(queue.cases.map((c) => c.sessionId).sort()).toEqual(
      [...fx.sessions.sessionIds].sort(),
    );
    expect(queue.cases[0]!.caseName).toBe('Shared v. Defendant');
    expect(queue.cases.map((c) => c.userName).sort()).toEqual([
      'Jane Claimant',
      'John Claimant',
    ]);
  });

  it('returns an empty queue for a firm with no assignments', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);

    const queue = await clients.db.listPortalQueueForFirm(UNASSIGNED_FIRM);
    expect(queue.cases).toHaveLength(0);
    expect(queue.summary).toEqual({ openCount: 0, handledCount: 0 });
  });

  it('does not surface a session assigned only to another firm (firm-scoped boundary)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    // A second litigation row assigned ONLY to Firm B, with its own session.
    const litB = await clients.db.createLitigation({
      orgId: fx.firms.firmB.orgId,
      kind: 'class',
      caseName: 'FirmB Only v. Defendant',
      slug: 'firmb-only',
      status: 'active',
    });
    await clients.db.replaceFirmAssignmentsForLitigation(litB.id, [fx.firms.firmB.id]);
    await clients.db.writeSession({
      state: {
        sessionId: '33330000-0000-4000-8000-0000000000b9',
        orgId: fx.firms.firmB.orgId,
        sessionType: 'public_ada',
        status: 'active',
        readingLevel: 'standard',
        anonSessionId: '00000000-0000-4000-8000-0000000000cc',
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

    const firmAQueue = await clients.db.listPortalQueueForFirm(fx.firms.firmA.id);
    const firmBQueue = await clients.db.listPortalQueueForFirm(fx.firms.firmB.id);
    expect(firmAQueue.cases).toHaveLength(2); // only the shared sessions
    expect(firmBQueue.cases).toHaveLength(3); // shared + firm-B-only
  });

  it('summary counts are firm-scoped (open before any firm handles)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const queue = await clients.db.listPortalQueueForFirm(fx.firms.firmA.id);
    expect(queue.summary).toEqual({ openCount: 2, handledCount: 0 });
  });

  it('grays out a shared case for the OTHER firm when one firm handles it', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;

    await clients.db.markFirmSessionHandled(session1, fx.firms.firmB.id, null);

    // Firm B: it handled session1 → handledByThisFirm, counted as handled.
    const firmB = await clients.db.listPortalQueueForFirm(fx.firms.firmB.id, {
      handled: 'all',
    });
    const b1 = firmB.cases.find((c) => c.sessionId === session1)!;
    expect(b1.handledByThisFirm).toBe(true);
    expect(firmB.summary).toEqual({ openCount: 1, handledCount: 1 });

    // Firm A: session1 was handled by another firm → grayed, in neither count.
    const firmA = await clients.db.listPortalQueueForFirm(fx.firms.firmA.id, {
      handled: 'all',
    });
    const a1 = firmA.cases.find((c) => c.sessionId === session1)!;
    expect(a1.handledByThisFirm).toBe(false);
    expect(a1.handledByOtherFirm).toBe(true);
    expect(firmA.summary).toEqual({ openCount: 1, handledCount: 0 });
  });

  it('honors the handled filter (false default | true | all)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;
    await clients.db.markFirmSessionHandled(session1, fx.firms.firmB.id, null);

    // Firm B handled session1.
    const open = await clients.db.listPortalQueueForFirm(fx.firms.firmB.id, {
      handled: 'false',
    });
    expect(open.cases.map((c) => c.sessionId)).not.toContain(session1);

    const handled = await clients.db.listPortalQueueForFirm(fx.firms.firmB.id, {
      handled: 'true',
    });
    expect(handled.cases.map((c) => c.sessionId)).toEqual([session1]);

    const all = await clients.db.listPortalQueueForFirm(fx.firms.firmB.id, {
      handled: 'all',
    });
    expect(all.cases).toHaveLength(2);
  });

  it('paginates by page / pageSize and reports total_count', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    const p1 = await clients.db.listPortalQueueForFirm(fx.firms.firmA.id, {
      page: 1,
      pageSize: 1,
    });
    expect(p1.cases).toHaveLength(1);
    expect(p1.totalCount).toBe(2);
    expect(p1.page).toBe(1);
    expect(p1.pageSize).toBe(1);

    const p2 = await clients.db.listPortalQueueForFirm(fx.firms.firmA.id, {
      page: 2,
      pageSize: 1,
    });
    expect(p2.cases).toHaveLength(1);
    expect(p2.cases[0]!.sessionId).not.toBe(p1.cases[0]!.sessionId);
  });
});
