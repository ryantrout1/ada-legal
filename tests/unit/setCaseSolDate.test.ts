/**
 * Layer 1 test — attorney-set statute-of-limitations date (Phase 5 §7.3).
 *
 * setCaseSolDate sets/clears cases.sol_date, firm-scoped + consent-gated, and
 * writes a SOL_SET activity. The value is whatever the attorney supplied — the
 * server NEVER computes it. getCaseDetailForFirm echoes it back.
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

describe('setCaseSolDate', () => {
  it('sets the attorney-supplied SOL date and writes a SOL_SET activity', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const ok = await db.setCaseSolDate({ caseId: c.id, lawFirmId: 'firm-1', solDate: '2027-08-14' });
    expect(ok).toBe(true);

    const detail = await db.getCaseDetailForFirm(c.id, 'firm-1');
    expect(detail?.solDate).toBe('2027-08-14');

    const ev = db.caseActivity.find((a) => a.caseId === c.id && a.eventType === 'SOL_SET')!;
    expect(ev.actorType).toBe('user');
    expect(ev.summary).toContain('2027-08-14');
  });

  it('clears the SOL date with null', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    await db.setCaseSolDate({ caseId: c.id, lawFirmId: 'firm-1', solDate: '2027-08-14' });
    const ok = await db.setCaseSolDate({ caseId: c.id, lawFirmId: 'firm-1', solDate: null });
    expect(ok).toBe(true);
    const detail = await db.getCaseDetailForFirm(c.id, 'firm-1');
    expect(detail?.solDate).toBeNull();
  });

  it('returns false (no write) for a case owned by another firm', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1');
    expect(await db.setCaseSolDate({ caseId: c.id, lawFirmId: 'firm-2', solDate: '2027-01-01' })).toBe(false);
    expect(db.caseActivity.some((a) => a.eventType === 'SOL_SET')).toBe(false);
  });
});
