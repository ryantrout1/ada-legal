/**
 * Integration test — attorney self-attested first contact (contact-logging).
 *
 * The data-plane seam behind POST /api/portal/cases/[id]/contact:
 * markCaseContacted → firm-scoped reads. Confirms a logged contact stamps
 * contacted_at, is visible on the case detail AND in the firm queue row (the
 * surface the SLA badge reads), stays firm-scoped, and honors the consent gate.
 * Runs against the in-memory client (mirrors the Neon methods); no live DB.
 *
 * Encodes /plan contact-logging Phase 1 — acceptance criteria 1, 2, 5.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { seedPortalFixture } from '../fixtures/portalSeed';

async function routedConsentedCase(
  db: ReturnType<typeof makeInMemoryClients>['db'],
  firmId: string,
  orgId: string,
  consent = true,
) {
  const sessionId = `s-${Math.random()}`;
  const { caseRow } = await db.createCase({
    orgId, adaSessionId: sessionId, litigationListingId: null, lane: 'routed_firm',
    firmId, classificationTitle: 'Title III', classificationStandard: null, matchConfidence: null,
    jurisdictionState: 'AZ', routedAt: null, firstContactDue: null, routingReason: 'test',
  });
  if (consent) await db.recordCaseConsent({ sessionId, scope: 'matched_firm' });
  return caseRow;
}

describe('contact logging (mark → firm-scoped read)', () => {
  it('a logged contact stamps contacted_at and surfaces on detail and in the queue row', async () => {
    const clients = makeInMemoryClients();
    const { firms } = await seedPortalFixture(clients);
    const firm = await clients.db.readLawFirmById(firms.firmA.id);
    const c = await routedConsentedCase(clients.db, firms.firmA.id, firm!.orgId);

    const res = await clients.db.markCaseContacted({ caseId: c.id, lawFirmId: firms.firmA.id });
    expect(res.ok).toBe(true);
    expect(res.contactedAt).toBeTruthy();

    const detail = await clients.db.getCaseDetailForFirm(c.id, firms.firmA.id);
    expect(detail?.contactedAt).toBe(res.contactedAt);

    // The queue row the Inbox SLA badge reads must carry it too.
    const queue = await clients.db.listCasesForFirm(firms.firmA.id);
    const row = [...queue.groups.new, ...queue.groups.working, ...queue.groups.resolved].find(
      (r) => r.caseId === c.id,
    );
    expect(row?.contactedAt).toBe(res.contactedAt);
  });

  it('a different firm cannot log contact on this firm\'s case', async () => {
    const clients = makeInMemoryClients();
    const { firms } = await seedPortalFixture(clients);
    const firm = await clients.db.readLawFirmById(firms.firmA.id);
    const c = await routedConsentedCase(clients.db, firms.firmA.id, firm!.orgId);

    const res = await clients.db.markCaseContacted({ caseId: c.id, lawFirmId: firms.firmB.id });
    expect(res.ok).toBe(false);

    const detail = await clients.db.getCaseDetailForFirm(c.id, firms.firmA.id);
    expect(detail?.contactedAt).toBeNull();
  });

  it('honors the consent gate — a non-consented case cannot be marked', async () => {
    const clients = makeInMemoryClients();
    const { firms } = await seedPortalFixture(clients);
    const firm = await clients.db.readLawFirmById(firms.firmA.id);
    const c = await routedConsentedCase(clients.db, firms.firmA.id, firm!.orgId, /* consent */ false);

    const res = await clients.db.markCaseContacted({ caseId: c.id, lawFirmId: firms.firmA.id });
    expect(res.ok).toBe(false);
  });
});
