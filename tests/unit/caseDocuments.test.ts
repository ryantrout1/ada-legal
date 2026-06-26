/**
 * Layer 1 test — matter documents (Phase 5 §7.5).
 *
 * add/list/remove case documents, firm-scoped + consent-gated, each writing a
 * DOCUMENT_ADDED / DOCUMENT_REMOVED activity.
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

describe('case documents', () => {
  it('attaches a document, lists it, and logs DOCUMENT_ADDED', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const doc = await db.addCaseDocument({
      caseId: c.id, lawFirmId: 'firm-1', filename: 'demand.pdf', url: 'https://files.example.com/demand.pdf',
    });
    expect(doc?.filename).toBe('demand.pdf');

    const docs = await db.listCaseDocuments(c.id, 'firm-1');
    expect(docs).toHaveLength(1);
    expect(docs[0]!.url).toBe('https://files.example.com/demand.pdf');
    expect(db.caseActivity.some((a) => a.caseId === c.id && a.eventType === 'DOCUMENT_ADDED')).toBe(true);
  });

  it('removes a document and logs DOCUMENT_REMOVED', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const doc = await db.addCaseDocument({ caseId: c.id, lawFirmId: 'firm-1', filename: 'x.pdf', url: 'https://x.test/x.pdf' });
    const ok = await db.removeCaseDocument({ caseId: c.id, lawFirmId: 'firm-1', documentId: doc!.id });
    expect(ok).toBe(true);
    expect(await db.listCaseDocuments(c.id, 'firm-1')).toHaveLength(0);
    expect(db.caseActivity.some((a) => a.eventType === 'DOCUMENT_REMOVED')).toBe(true);
  });

  it('is firm-scoped: another firm cannot add, list, or remove', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1');
    expect(
      await db.addCaseDocument({ caseId: c.id, lawFirmId: 'firm-2', filename: 'x.pdf', url: 'https://x.test/x.pdf' }),
    ).toBeNull();
    const mine = await db.addCaseDocument({ caseId: c.id, lawFirmId: 'firm-1', filename: 'y.pdf', url: 'https://y.test/y.pdf' });
    expect(await db.listCaseDocuments(c.id, 'firm-2')).toHaveLength(0);
    expect(await db.removeCaseDocument({ caseId: c.id, lawFirmId: 'firm-2', documentId: mine!.id })).toBe(false);
  });
});
