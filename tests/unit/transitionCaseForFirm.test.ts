/**
 * Layer 1 test — case lifecycle transitions in the firm workspace (Phase 2c).
 *
 * transitionCaseForFirm drives the Phase 0 state machine, firm-scoped, writing
 * a user-actor activity row and stamping the relevant timestamps. Illegal
 * transitions throw; out-of-firm returns null.
 *
 * Encodes /plan Phase 2c acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import { IllegalCaseTransitionError } from '@/engine/cases/caseStateMachine';

const ORG = 'org-1';

async function seedCase(db: InMemoryDbClient, firmId = 'firm-1') {
  const sessionId = `s-${Math.random()}`;
  const { caseRow } = await db.createCase({
    orgId: ORG, adaSessionId: sessionId, litigationListingId: null, lane: 'routed_firm',
    firmId, classificationTitle: 'III', classificationStandard: null, matchConfidence: null,
    jurisdictionState: 'AZ', routedAt: null, firstContactDue: null, routingReason: 'test',
  });
  await db.recordCaseConsent({ sessionId, scope: 'matched_firm' });
  return caseRow;
}

describe('transitionCaseForFirm', () => {
  it('accept moves new → investigating and writes an ACCEPT activity', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const res = await db.transitionCaseForFirm({ caseId: c.id, lawFirmId: 'firm-1', transition: 'accept' });
    expect(res!.caseRow.status).toBe('investigating');
    expect(db.caseActivity.some((a) => a.caseId === c.id && a.eventType === 'ACCEPT')).toBe(true);
  });

  it('decline records the reason and moves to declined', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    const res = await db.transitionCaseForFirm({
      caseId: c.id, lawFirmId: 'firm-1', transition: 'decline', reason: 'Outside our practice area',
    });
    expect(res!.caseRow.status).toBe('declined');
    const act = db.caseActivity.find((a) => a.caseId === c.id && a.eventType === 'DECLINE')!;
    expect((act.metadata as { reason?: string }).reason).toBe('Outside our practice area');
  });

  it('accept → send_demand → begin_negotiation → resolve walks the full path', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    await db.transitionCaseForFirm({ caseId: c.id, lawFirmId: 'firm-1', transition: 'accept' });
    await db.transitionCaseForFirm({ caseId: c.id, lawFirmId: 'firm-1', transition: 'send_demand' });
    await db.transitionCaseForFirm({ caseId: c.id, lawFirmId: 'firm-1', transition: 'begin_negotiation' });
    const res = await db.transitionCaseForFirm({
      caseId: c.id, lawFirmId: 'firm-1', transition: 'resolve', resolutionType: 'engaged',
    });
    expect(res!.caseRow.status).toBe('resolved');
  });

  it('throws on an illegal transition (resolve a new case)', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db);
    await expect(
      db.transitionCaseForFirm({ caseId: c.id, lawFirmId: 'firm-1', transition: 'resolve' }),
    ).rejects.toBeInstanceOf(IllegalCaseTransitionError);
  });

  it('returns null for a case owned by another firm', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 'firm-1');
    expect(
      await db.transitionCaseForFirm({ caseId: c.id, lawFirmId: 'firm-2', transition: 'accept' }),
    ).toBeNull();
  });
});
