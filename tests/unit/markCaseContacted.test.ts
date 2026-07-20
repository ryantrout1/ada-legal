/**
 * Unit test — attorney self-attested first contact (contact-logging feature).
 *
 * markCaseContacted stamps cases.contacted_at = now(), firm-scoped +
 * consent-gated, and writes a CONTACT_LOGGED activity. Write-once: a second
 * call does not move the timestamp (self-attest, no un-mark). getCaseDetailForFirm
 * echoes contacted_at back.
 *
 * Encodes acceptance criteria from /plan phase 1:
 *  - AC1 an attorney can mark a case contacted (timestamp + activity)
 *  - AC2 firm-scoped + consent-gated (cross-firm / non-consented → no write)
 *  - AC3 idempotent write-once
 *  - AC5 case detail exposes contacted_at
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';

const ORG = 'org-1';

async function seedCase(db: InMemoryDbClient, firmId = 'firm-1', consent = true) {
  const sessionId = `s-${Math.random()}`;
  const { caseRow } = await db.createCase({
    orgId: ORG, adaSessionId: sessionId, litigationListingId: null, lane: 'routed_firm',
    firmId, classificationTitle: 'III', classificationStandard: null, matchConfidence: null,
    jurisdictionState: 'AZ', routedAt: null, firstContactDue: null, routingReason: 'test',
  });
  if (consent) await db.recordCaseConsent({ sessionId, scope: 'matched_firm' });
  return caseRow;
}

describe('markCaseContacted', () => {
  it('stamps contacted_at and writes a CONTACT_LOGGED activity', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);

    const res = await db.markCaseContacted({ caseId: c.id, lawFirmId: 'firm-1' });
    expect(res.ok).toBe(true);
    expect(res.contactedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(res.contactedAt!))).toBe(false);

    const detail = await db.getCaseDetailForFirm(c.id, 'firm-1');
    expect(detail?.contactedAt).toBe(res.contactedAt);

    const ev = db.caseActivity.find((a) => a.caseId === c.id && a.eventType === 'CONTACT_LOGGED')!;
    expect(ev).toBeTruthy();
    expect(ev.actorType).toBe('user');
  });

  it('is write-once — a second call does not move contacted_at', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);

    const first = await db.markCaseContacted({ caseId: c.id, lawFirmId: 'firm-1' });
    await new Promise((r) => setTimeout(r, 5));
    const second = await db.markCaseContacted({ caseId: c.id, lawFirmId: 'firm-1' });

    expect(second.ok).toBe(true);
    expect(second.contactedAt).toBe(first.contactedAt);
    // Only one activity row — the no-op second call doesn't log again.
    expect(db.caseActivity.filter((a) => a.caseId === c.id && a.eventType === 'CONTACT_LOGGED')).toHaveLength(1);
  });

  it('returns ok:false (no write) for a case owned by another firm', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1');
    const res = await db.markCaseContacted({ caseId: c.id, lawFirmId: 'firm-2' });
    expect(res.ok).toBe(false);
    expect(db.caseActivity.some((a) => a.eventType === 'CONTACT_LOGGED')).toBe(false);
  });

  it('returns ok:false (no write) for a non-consented case', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1', /* consent */ false);
    const res = await db.markCaseContacted({ caseId: c.id, lawFirmId: 'firm-1' });
    expect(res.ok).toBe(false);
    expect(db.caseActivity.some((a) => a.eventType === 'CONTACT_LOGGED')).toBe(false);
  });
});
