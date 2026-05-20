/**
 * Data-logic test — portal case detail selection (criterion 3).
 *
 * Mirrors the in-memory-client pattern: seed makeInMemoryClients via
 * portalSeed, exercise getPortalCaseForFirm, and assert the full case-package
 * shape plus the firm-scoped access boundary. No React rendering — the
 * rendered DOM is covered by the Playwright persona.
 *
 * Phase 2 fills these bodies in (Phase 1 landed it.todo shells).
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 2 (data infra).
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('getPortalCaseForFirm', () => {
  it('returns the full case package for an assigned firm', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;

    const detail = await clients.db.getPortalCaseForFirm(session1, fx.firms.firmA.id);
    expect(detail).not.toBeNull();
    expect(detail!.caseName).toBe('Shared v. Defendant');
    expect(detail!.litigationListingId).toBe(fx.litigation.litigationListingId);
    expect(detail!.userName).toBe('Jane Claimant');
    expect(detail!.userEmail).toBe('jane@example.com');
    expect(detail!.handledByThisFirm).toBe(false);
  });

  it('surfaces qualifying-question answers (non-identity extracted fields)', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;

    const detail = await clients.db.getPortalCaseForFirm(session1, fx.firms.firmA.id);
    const qq = detail!.qualifyingAnswers;
    expect(qq.find((a) => a.question === 'booked_accessible_room')?.answer).toBe('yes');
    // identity fields are surfaced separately, not as QQ answers
    expect(qq.map((a) => a.question)).not.toContain('claimant_name');
    expect(qq.map((a) => a.question)).not.toContain('claimant_email');
  });

  it('returns the conversation transcript', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;

    const detail = await clients.db.getPortalCaseForFirm(session1, fx.firms.firmA.id);
    expect(detail!.transcript).toHaveLength(2);
    expect(detail!.transcript[0]!.role).toBe('user');
  });

  it('reflects handledByThisFirm once the firm marks the case handled', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;

    await clients.db.markFirmSessionHandled(session1, fx.firms.firmA.id, null);
    const detail = await clients.db.getPortalCaseForFirm(session1, fx.firms.firmA.id);
    expect(detail!.handledByThisFirm).toBe(true);
  });

  it('rejects access when the firm has no assignment for the case litigation row', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const [session1] = fx.sessions.sessionIds;

    // A firm not assigned to the shared litigation row.
    const detail = await clients.db.getPortalCaseForFirm(
      session1,
      '99990000-0000-4000-8000-000000000999',
    );
    expect(detail).toBeNull();
  });

  it('returns null for a session not bound to any litigation row', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);

    await clients.db.writeSession({
      state: {
        sessionId: '33330000-0000-4000-8000-0000000000ff',
        orgId: fx.firms.firmA.orgId,
        sessionType: 'public_ada',
        status: 'active',
        readingLevel: 'standard',
        anonSessionId: '00000000-0000-4000-8000-0000000000dd',
        userId: null,
        listingId: null,
        litigationListingId: null,
        conversationHistory: [],
        extractedFields: {},
        classification: null,
        metadata: {},
        accessibilitySettings: {},
        isTest: true,
      },
    });

    const detail = await clients.db.getPortalCaseForFirm(
      '33330000-0000-4000-8000-0000000000ff',
      fx.firms.firmA.id,
    );
    expect(detail).toBeNull();
  });

  it('returns null for an unknown session', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const detail = await clients.db.getPortalCaseForFirm(
      '33330000-0000-4000-8000-0000000000aa',
      fx.firms.firmA.id,
    );
    expect(detail).toBeNull();
  });
});
