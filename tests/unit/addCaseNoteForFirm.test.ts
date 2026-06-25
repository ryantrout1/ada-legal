/**
 * Layer 1 test — attorney case notes (Phase 2d).
 *
 * addCaseNoteForFirm writes a NOTE case_activity row, firm-scoped + consent-
 * gated. Out-of-firm / unconsented → null (no write).
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

describe('addCaseNoteForFirm', () => {
  it('writes a NOTE activity row for a firm-owned case', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const ok = await db.addCaseNoteForFirm({ caseId: c.id, lawFirmId: 'firm-1', body: 'Called claimant, left VM.' });
    expect(ok).toBe(true);
    const note = db.caseActivity.find((a) => a.caseId === c.id && a.eventType === 'NOTE')!;
    expect(note.summary).toBe('Called claimant, left VM.');
    expect(note.actorType).toBe('user');
  });

  it('returns false for a case owned by another firm', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1');
    expect(await db.addCaseNoteForFirm({ caseId: c.id, lawFirmId: 'firm-2', body: 'x' })).toBe(false);
    expect(db.caseActivity.some((a) => a.eventType === 'NOTE')).toBe(false);
  });
});
