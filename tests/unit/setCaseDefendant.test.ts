/**
 * Layer 1 test — attorney-entered defendant record (Phase 5 §7.5).
 *
 * setCaseDefendant sets/clears cases.defendant, firm-scoped + consent-gated, and
 * writes a DEFENDANT_SET activity. getCaseDetailForFirm echoes it back.
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

describe('setCaseDefendant', () => {
  it('sets the defendant and writes a DEFENDANT_SET activity', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const ok = await db.setCaseDefendant({
      caseId: c.id, lawFirmId: 'firm-1',
      defendant: { name: 'Vista Plaza LLC', kind: 'business', address: '1 Main St', notes: null },
    });
    expect(ok).toBe(true);

    const detail = await db.getCaseDetailForFirm(c.id, 'firm-1');
    expect(detail?.defendant?.name).toBe('Vista Plaza LLC');
    expect(detail?.defendant?.kind).toBe('business');

    const ev = db.caseActivity.find((a) => a.caseId === c.id && a.eventType === 'DEFENDANT_SET')!;
    expect(ev.actorType).toBe('user');
    expect(ev.summary).toContain('Vista Plaza LLC');
  });

  it('clears the defendant with null', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    await db.setCaseDefendant({ caseId: c.id, lawFirmId: 'firm-1', defendant: { name: 'X' } });
    const ok = await db.setCaseDefendant({ caseId: c.id, lawFirmId: 'firm-1', defendant: null });
    expect(ok).toBe(true);
    const detail = await db.getCaseDetailForFirm(c.id, 'firm-1');
    expect(detail?.defendant).toBeNull();
  });

  it('returns false (no write) for a case owned by another firm', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1');
    expect(
      await db.setCaseDefendant({ caseId: c.id, lawFirmId: 'firm-2', defendant: { name: 'X' } }),
    ).toBe(false);
    expect(db.caseActivity.some((a) => a.eventType === 'DEFENDANT_SET')).toBe(false);
  });
});
