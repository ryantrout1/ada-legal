/**
 * Layer 1 test — matter people (Phase 5 §7.5).
 *
 * add/list/remove case people, firm-scoped + consent-gated, each writing a
 * PERSON_ADDED / PERSON_REMOVED activity. The claimant is implicit and never
 * stored here.
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

describe('case people', () => {
  it('adds a person, lists them, and logs PERSON_ADDED', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const person = await db.addCasePerson({
      caseId: c.id, lawFirmId: 'firm-1', name: 'Dana Lee', role: 'witness', email: 'dana@x.com',
    });
    expect(person?.name).toBe('Dana Lee');

    const people = await db.listCasePeople(c.id, 'firm-1');
    expect(people).toHaveLength(1);
    expect(people[0]!.role).toBe('witness');
    expect(people[0]!.email).toBe('dana@x.com');
    expect(db.caseActivity.some((a) => a.caseId === c.id && a.eventType === 'PERSON_ADDED')).toBe(true);
  });

  it('removes a person and logs PERSON_REMOVED', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const person = await db.addCasePerson({ caseId: c.id, lawFirmId: 'firm-1', name: 'Pat', role: 'expert' });
    const ok = await db.removeCasePerson({ caseId: c.id, lawFirmId: 'firm-1', casePersonId: person!.id });
    expect(ok).toBe(true);
    expect(await db.listCasePeople(c.id, 'firm-1')).toHaveLength(0);
    expect(db.caseActivity.some((a) => a.eventType === 'PERSON_REMOVED')).toBe(true);
  });

  it('is firm-scoped: another firm cannot add, list, or remove', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1');
    expect(await db.addCasePerson({ caseId: c.id, lawFirmId: 'firm-2', name: 'X', role: 'witness' })).toBeNull();
    const mine = await db.addCasePerson({ caseId: c.id, lawFirmId: 'firm-1', name: 'Y', role: 'witness' });
    expect(await db.listCasePeople(c.id, 'firm-2')).toHaveLength(0);
    expect(await db.removeCasePerson({ caseId: c.id, lawFirmId: 'firm-2', casePersonId: mine!.id })).toBe(false);
  });
});
